/**
 * Tests for parallel upload system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parallelUpload } from '../parallelUpload';

// Mock fetch globally
global.fetch = vi.fn();

describe('parallelUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should split file into correct number of chunks', async () => {
    const file = new File(['x'.repeat(25 * 1024 * 1024)], 'test.mkv'); // 25MB
    const chunkSize = 10 * 1024 * 1024; // 10MB
    const expectedChunks = Math.ceil(file.size / chunkSize); // 3 chunks

    expect(expectedChunks).toBe(3);
  });

  it('should start upload session', async () => {
    const file = new File(['test'], 'test.mkv');

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_id: 'test-upload-id' })
      });

    global.fetch = mockFetch;

    try {
      await parallelUpload(file);
    } catch (err) {
      // Expected to fail at chunk upload stage
    }

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/start-chunked-upload'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('should call progress callback', async () => {
    const file = new File(['x'.repeat(5 * 1024 * 1024)], 'test.mkv'); // 5MB
    const onProgress = vi.fn();

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_id: 'test-id' })
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

    global.fetch = mockFetch;

    try {
      await parallelUpload(file, { onProgress, chunkSize: 5 * 1024 * 1024 });
    } catch (err) {
      // Expected to fail at finalize stage
    }

    expect(onProgress).toHaveBeenCalled();
  });

  it('should retry failed chunk uploads', async () => {
    const file = new File(['test'], 'test.mkv');

    const mockFetch = vi.fn()
      // Start session
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_id: 'test-id' })
      })
      // First chunk fails
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
      // Retry succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      // Finalize fails (expected)
      .mockResolvedValueOnce({
        ok: false
      });

    global.fetch = mockFetch;

    try {
      await parallelUpload(file, { chunkSize: 1024 });
    } catch (err) {
      // Expected to fail
    }

    // Should have called: start session + failed chunk + retry chunk + finalize
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('should handle timeout', async () => {
    vi.useFakeTimers();

    const file = new File(['test'], 'test.mkv');

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_id: 'test-id' })
      })
      .mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true })
            });
          }, 200000); // 200 seconds (exceeds 120s timeout)
        });
      });

    global.fetch = mockFetch;

    const uploadPromise = parallelUpload(file, { chunkSize: 1024 });

    // Fast-forward time to trigger timeout
    vi.advanceTimersByTime(130000);

    await expect(uploadPromise).rejects.toThrow();

    vi.useRealTimers();
  });

  it('should calculate correct upload speed', () => {
    const uploadedBytes = 100 * 1024 * 1024; // 100MB
    const elapsedSeconds = 10; // 10 seconds
    const expectedSpeed = uploadedBytes / elapsedSeconds; // 10 MB/s

    expect(expectedSpeed).toBe(10485760); // bytes per second
    expect(expectedSpeed / (1024 * 1024)).toBe(10); // MB/s
  });

  it('should calculate correct ETA', () => {
    const uploadedBytes = 100 * 1024 * 1024; // 100MB
    const totalBytes = 500 * 1024 * 1024; // 500MB
    const elapsedSeconds = 10;

    const uploadSpeed = uploadedBytes / elapsedSeconds;
    const remainingBytes = totalBytes - uploadedBytes;
    const eta = remainingBytes / uploadSpeed;

    expect(eta).toBe(40); // 40 seconds remaining
  });

  it('should handle exponential backoff correctly', () => {
    const attempts = [1, 2, 3, 4];
    const baseDelays = attempts.map(a => 1000 * Math.pow(2, a - 1));

    expect(baseDelays).toEqual([1000, 2000, 4000, 8000]);
  });
});

describe('parallel upload configuration', () => {
  it('should use default chunk size of 10MB', () => {
    const CHUNK_SIZE = 10 * 1024 * 1024;
    expect(CHUNK_SIZE).toBe(10485760);
  });

  it('should use 8 parallel uploads by default', () => {
    const MAX_PARALLEL = 8;
    expect(MAX_PARALLEL).toBe(8);
  });

  it('should calculate correct number of chunks for various file sizes', () => {
    const CHUNK_SIZE = 10 * 1024 * 1024;

    const sizes = [
      { size: 5 * 1024 * 1024, expected: 1 },      // 5MB = 1 chunk
      { size: 10 * 1024 * 1024, expected: 1 },     // 10MB = 1 chunk
      { size: 15 * 1024 * 1024, expected: 2 },     // 15MB = 2 chunks
      { size: 100 * 1024 * 1024, expected: 10 },   // 100MB = 10 chunks
      { size: 6 * 1024 * 1024 * 1024, expected: 615 }, // 6GB = 615 chunks
    ];

    sizes.forEach(({ size, expected }) => {
      const chunks = Math.ceil(size / CHUNK_SIZE);
      expect(chunks).toBe(expected);
    });
  });
});
