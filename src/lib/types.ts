/**
 * Shared TypeScript interfaces used across multiple components.
 */

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  year: string;
  rating: number;
  overview: string;
  poster: string;
  imdb_id: string | null;
  release_date?: string;
  genres?: Array<{ id: number; name: string }>;
  media_type?: string;
}

export interface VideoInfo {
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
