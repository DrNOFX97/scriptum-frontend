/**
 * Analyze video file locally in the browser without uploading
 */

export interface LocalVideoInfo {
  filename: string;
  codec: string;
  format: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  duration_formatted: string;
  size_mb: number;
}

/**
 * Extract video metadata from File using HTML5 Video API
 */
export async function analyzeVideoLocally(file: File): Promise<LocalVideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      // Get basic info
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      // Calculate resolution label
      let resolution = `${width}x${height}`;
      if (height >= 2160) resolution = '4K';
      else if (height >= 1440) resolution = '2K';
      else if (height >= 1080) resolution = '1080p';
      else if (height >= 720) resolution = '720p';
      else if (height >= 480) resolution = '480p';
      
      // Format duration
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = Math.floor(duration % 60);
      const duration_formatted = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Get file extension as format
      const format = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      
      // Estimate FPS (not directly available in HTML5)
      // Common values: 23.976, 24, 25, 29.97, 30, 60
      const fps = 24; // Default assumption
      
      // Get file size
      const size_mb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
      
      // Clean up
      URL.revokeObjectURL(url);
      
      resolve({
        filename: file.name,
        codec: 'H.264', // Default assumption (most common)
        format,
        resolution,
        width,
        height,
        fps,
        duration,
        duration_formatted,
        size_mb
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = url;
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
