/**
 * Parallel chunked file upload
 * Splits large files into chunks and uploads them in parallel
 */

import { API_BASE } from './constants';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_PARALLEL = 8; // Upload 8 chunks simultaneously (optimal for most connections)

export interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  uploadSpeed: number; // bytes per second
  eta: number; // seconds
  currentChunk: number;
  totalChunks: number;
}

export interface ParallelUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  maxParallel?: number;
  chunkSize?: number;
}

/**
 * Upload a file in parallel chunks
 *
 * @param file - File to upload
 * @param options - Upload options with progress callbacks
 * @returns Path to the uploaded file on server
 */
export async function parallelUpload(
  file: File,
  options?: ParallelUploadOptions
): Promise<string> {

  const chunkSize = options?.chunkSize || CHUNK_SIZE;
  const maxParallel = options?.maxParallel || MAX_PARALLEL;
  const totalChunks = Math.ceil(file.size / chunkSize);

  console.log(`🚀 Starting parallel upload: ${file.name}`);
  console.log(`📦 Size: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`);
  console.log(`🔢 Chunks: ${totalChunks} × ${(chunkSize / 1024 / 1024).toFixed(0)}MB`);
  console.log(`⚡ Parallel: ${maxParallel} simultaneous uploads`);

  // Step 1: Start upload session
  console.log('📋 Starting upload session...');
  const startResponse = await fetch(`${API_BASE}/start-chunked-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      total_size: file.size,
      chunk_size: chunkSize,
      total_chunks: totalChunks
    })
  });

  if (!startResponse.ok) {
    const error = await startResponse.json();
    throw new Error(error.error || 'Failed to start upload session');
  }

  const { upload_id } = await startResponse.json();
  console.log(`✅ Upload session created: ${upload_id}`);

  // Step 2: Upload chunks in parallel
  let uploadedBytes = 0;
  let completedChunks = 0;
  const startTime = Date.now();

  const uploadChunk = async (chunkIndex: number): Promise<void> => {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);

    // Retry logic for failed chunks with exponential backoff
    const maxRetries = 5; // Increased retries for better reliability
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Add timeout for each chunk upload (2 minutes per chunk)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch(
          `${API_BASE}/upload-chunk/${upload_id}/${chunkIndex}`,
          {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            // Keep-alive for better connection reuse
            keepalive: false // Don't use keepalive for large uploads
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Success - break retry loop
        break;

      } catch (err) {
        attempt++;
        const isTimeout = err instanceof Error && err.name === 'AbortError';
        const errorType = isTimeout ? 'timeout' : 'error';

        console.warn(
          `⚠️ Chunk ${chunkIndex} ${errorType} (attempt ${attempt}/${maxRetries}):`,
          err
        );

        if (attempt >= maxRetries) {
          throw new Error(
            `Chunk ${chunkIndex} upload failed after ${maxRetries} attempts: ${
              err instanceof Error ? err.message : 'Unknown error'
            }`
          );
        }

        // Exponential backoff with jitter (randomness to prevent thundering herd)
        const baseDelay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s, 16s
        const jitter = Math.random() * 1000; // Add 0-1s random delay
        const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30s

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Update progress
    uploadedBytes += chunk.size;
    completedChunks++;

    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const uploadSpeed = uploadedBytes / elapsed;
    const remainingBytes = file.size - uploadedBytes;
    const eta = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0;

    const progress: UploadProgress = {
      uploadedBytes,
      totalBytes: file.size,
      percentage: (uploadedBytes / file.size) * 100,
      uploadSpeed,
      eta,
      currentChunk: completedChunks,
      totalChunks
    };

    options?.onProgress?.(progress);
    options?.onChunkComplete?.(chunkIndex, totalChunks);

    console.log(
      `✅ Chunk ${chunkIndex + 1}/${totalChunks} ` +
      `(${(chunk.size / 1024 / 1024).toFixed(1)}MB) ` +
      `- ${progress.percentage.toFixed(1)}% ` +
      `@ ${(uploadSpeed / 1024 / 1024).toFixed(1)} MB/s`
    );
  };

  // Upload chunks with concurrency limit
  const chunks = Array.from({ length: totalChunks }, (_, i) => i);

  console.log(`⚡ Uploading ${chunks.length} chunks with max ${maxParallel} parallel...`);

  while (chunks.length > 0) {
    const batch = chunks.splice(0, maxParallel);
    await Promise.all(batch.map(uploadChunk));
  }

  const uploadTimeSeconds = (Date.now() - startTime) / 1000;
  const uploadSpeedMBps = (uploadedBytes / uploadTimeSeconds) / (1024 * 1024);
  const uploadTimeMinutes = uploadTimeSeconds / 60;

  console.log(`✅ All ${totalChunks} chunks uploaded successfully`);
  console.log(`📊 Upload Statistics:`);
  console.log(`   - Total: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`   - Time: ${uploadTimeMinutes.toFixed(1)} min (${uploadTimeSeconds.toFixed(1)}s)`);
  console.log(`   - Speed: ${uploadSpeedMBps.toFixed(1)} MB/s`);
  console.log(`   - Parallel: ${maxParallel} chunks simultaneously`);

  // Step 3: Finalize upload (reassemble chunks)
  console.log('🔧 Finalizing upload (reassembling chunks)...');

  // Update progress to show finalization
  options?.onProgress?.({
    uploadedBytes: file.size,
    totalBytes: file.size,
    percentage: 100,
    uploadSpeed: uploadedBytes / uploadTimeSeconds,
    eta: 0,
    currentChunk: totalChunks,
    totalChunks
  });

  const finalizeResponse = await fetch(
    `${API_BASE}/finalize-chunked-upload/${upload_id}`,
    { method: 'POST' }
  );

  if (!finalizeResponse.ok) {
    const error = await finalizeResponse.json();
    throw new Error(error.error || 'Failed to finalize upload');
  }

  const { file_path } = await finalizeResponse.json();

  console.log(`🎉 Upload complete: ${file_path}`);

  return file_path;
}

/**
 * Get upload status (for resumable uploads in the future)
 */
export async function getUploadStatus(uploadId: string) {
  const response = await fetch(`${API_BASE}/chunked-upload-status/${uploadId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload status');
  }

  return response.json();
}
