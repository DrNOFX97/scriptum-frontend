/**
 * Scriptum v2.5 - API Service
 * Integração com backend Python/Flask
 */

import { API_BASE, MAX_RETRIES, RETRY_DELAY_MS, ERROR_MESSAGES } from './constants';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

/**
 * Custom API Error with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized API Service with error handling, retries, and type safety
 */
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Centralized error handling wrapper
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options?: RequestInit,
    retries = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      // Try to parse JSON response
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      let data: any;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch {
        data = null;
      }

      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage =
          (isJson && data?.error) ||
          (isJson && data?.message) ||
          data ||
          `HTTP ${response.status}`;

        throw new ApiError(
          errorMessage,
          response.status,
          isJson ? data?.details : undefined
        );
      }

      return data as T;

    } catch (error) {
      // Retry logic for network errors
      if (
        error instanceof TypeError &&
        error.message.includes('fetch') &&
        retries < MAX_RETRIES
      ) {
        await this.delay(RETRY_DELAY_MS);
        return this.fetchWithErrorHandling<T>(url, options, retries + 1);
      }

      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Wrap unknown errors
      if (error instanceof Error) {
        throw new ApiError(error.message);
      }

      throw new ApiError(ERROR_MESSAGES.serverError);
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generic request method with JSON body
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const data = await this.fetchWithErrorHandling<T>(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message,
          details: error.details,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.serverError,
      };
    }
  }

  /**
   * Upload method for FormData
   */
  private async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const data = await this.fetchWithErrorHandling<T>(url, {
        method: 'POST',
        body: formData,
      });

      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          success: false,
          error: error.message,
          details: error.details,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.uploadFailed,
      };
    }
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  async diagnostics() {
    return this.request('/diagnostics');
  }

  // Video Analysis
  async analyzeVideo(file: File) {
    const formData = new FormData();
    formData.append('video', file);
    return this.upload('/analyze-video', formData);
  }

  async remuxMkvToMp4(file: File) {
    const formData = new FormData();
    formData.append('mkv', file);
    return this.upload('/remux-mkv-to-mp4', formData);
  }

  async convertToMp4(file: File, quality: string = 'balanced') {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('quality', quality);
    return this.upload('/convert-to-mp4', formData);
  }

  async extractMkvSubtitles(file: File) {
    const formData = new FormData();
    formData.append('mkv', file);
    return this.upload('/extract-mkv-subtitles', formData);
  }

  // Movie Recognition
  async recognizeMovie(filename: string) {
    return this.request('/recognize-movie', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    });
  }

  // Subtitle Search
  async searchSubtitles(query: string, language: string = 'pt') {
    return this.request('/search-subtitles', {
      method: 'POST',
      body: JSON.stringify({ query, language }),
    });
  }

  async downloadSubtitle(subtitleId: string) {
    return this.request('/download-subtitle', {
      method: 'POST',
      body: JSON.stringify({ subtitle_id: subtitleId }),
    });
  }

  // Sync
  async syncSubtitles(video: File, subtitle: File) {
    const formData = new FormData();
    formData.append('video', video);
    formData.append('subtitle', subtitle);
    return this.upload('/sync', formData);
  }

  // Translation
  async translateSubtitles(
    file: File,
    sourceLang: string,
    targetLang: string,
    context?: string,
    tone?: string
  ) {
    const formData = new FormData();
    formData.append('subtitle', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    if (context) formData.append('context', context);
    if (tone) formData.append('tone', tone);
    return this.upload('/translate', formData);
  }
}

export const api = new ApiService();
export default api;
