/**
 * File download utilities for Scriptum v2.5
 * Consolidates duplicate download patterns across components
 */

import { API_BASE } from './constants';

/**
 * Download file from blob or string content
 *
 * @param content - Blob or string content to download
 * @param filename - Name for the downloaded file
 * @param contentType - MIME type (default: text/plain)
 *
 * @example
 * ```ts
 * // Download text content
 * downloadFile("Hello World", "hello.txt", "text/plain");
 *
 * // Download blob
 * const blob = new Blob([data], { type: "application/zip" });
 * downloadFile(blob, "archive.zip");
 * ```
 */
export function downloadFile(
  content: Blob | string,
  filename: string,
  contentType = 'text/plain'
): void {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: contentType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release blob URL to free memory
  URL.revokeObjectURL(url);
}

/**
 * Download file from API endpoint
 *
 * @param filename - Name of the file on the server
 * @param apiBase - Optional API base URL (defaults to constant)
 *
 * @example
 * ```ts
 * downloadFromApi("my-subtitle.srt");
 * ```
 */
export function downloadFromApi(
  filename: string,
  apiBase: string = API_BASE
): void {
  const link = document.createElement('a');
  link.href = `${apiBase}/download/${encodeURIComponent(filename)}`;
  link.download = filename;
  link.click();
}

/**
 * Download subtitle file from API with proper encoding
 *
 * @param subtitleContent - Subtitle text content
 * @param filename - Name for the downloaded file
 *
 * @example
 * ```ts
 * downloadSubtitle(subtitleText, "movie.srt");
 * ```
 */
export function downloadSubtitle(
  subtitleContent: string,
  filename: string
): void {
  downloadFile(subtitleContent, filename, 'text/plain; charset=utf-8');
}

/**
 * Download JSON data as a file
 *
 * @param data - JavaScript object to serialize
 * @param filename - Name for the downloaded file
 *
 * @example
 * ```ts
 * downloadJson({ title: "Movie", year: 2024 }, "metadata.json");
 * ```
 */
export function downloadJson(
  data: any,
  filename: string
): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Trigger download of a video file from the API
 *
 * @param filename - Name of the video file on the server
 * @param apiBase - Optional API base URL
 */
export function downloadVideo(
  filename: string,
  apiBase: string = API_BASE
): void {
  downloadFromApi(filename, apiBase);
}

/**
 * Get file extension from filename
 *
 * @param filename - Filename to extract extension from
 * @returns Extension without dot, or empty string if none
 *
 * @example
 * ```ts
 * getFileExtension("movie.srt") // "srt"
 * getFileExtension("archive.tar.gz") // "gz"
 * ```
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Validate file size
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum allowed size in megabytes
 * @returns True if file is within size limit
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Validate file extension
 *
 * @param filename - Filename to validate
 * @param allowedExtensions - Array of allowed extensions (without dots)
 * @returns True if extension is allowed
 *
 * @example
 * ```ts
 * validateFileExtension("movie.srt", ["srt", "vtt"]) // true
 * validateFileExtension("movie.txt", ["srt", "vtt"]) // false
 * ```
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext);
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}
