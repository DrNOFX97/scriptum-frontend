/**
 * Centralized constants for the Scriptum frontend.
 * Extracts magic numbers and repeated values for better maintainability.
 */

// ============================================================================
// API Configuration
// ============================================================================
/**
 * API base URL - defaults to production GCP Cloud Run backend
 * For local development, set VITE_API_BASE_URL=http://localhost:5001 in .env.local
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://scriptum-v2-5-315653817267.europe-west1.run.app';

// ============================================================================
// Processing Limits
// ============================================================================
export const BATCH_SIZE = 10;  // Number of items to process in a single batch
export const MAX_RETRIES = 3;  // Maximum number of retry attempts
export const RETRY_DELAY_MS = 2000;  // Delay between retries in milliseconds

// ============================================================================
// UI Polling & Updates
// ============================================================================
export const POLL_INTERVAL_MS = 500;  // Polling interval for status checks
export const DEBOUNCE_DELAY_MS = 300;  // Debounce delay for search inputs
export const TOAST_DURATION_MS = 3000;  // Default toast notification duration

// ============================================================================
// Subtitle Validation
// ============================================================================
export const MAX_LINE_LENGTH = 42;  // Maximum characters per subtitle line
export const MAX_SUBTITLE_SIZE_MB = 10;  // Maximum subtitle file size
export const MIN_SUBTITLE_DURATION_MS = 500;  // Minimum subtitle display duration

// ============================================================================
// Sync Quality Thresholds
// ============================================================================
export const SYNC_QUALITY_THRESHOLD_LOW = 0.3;   // Minimum acceptable sync quality
export const SYNC_QUALITY_THRESHOLD_HIGH = 0.5;  // Good sync quality threshold
export const SYNC_QUALITY_EXCELLENT = 0.7;       // Excellent sync quality

// ============================================================================
// File Upload
// ============================================================================
export const MAX_UPLOAD_SIZE_MB = 500;  // Maximum upload file size
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv'];
export const SUPPORTED_SUBTITLE_FORMATS = ['srt', 'ass', 'ssa', 'sub', 'vtt'];

// ============================================================================
// Animation Durations
// ============================================================================
export const ANIMATION_DURATION_FAST = 0.2;    // Fast animations (seconds)
export const ANIMATION_DURATION_NORMAL = 0.4;  // Normal animations (seconds)
export const ANIMATION_DURATION_SLOW = 0.6;    // Slow animations (seconds)

// ============================================================================
// Pagination
// ============================================================================
export const DEFAULT_PAGE_SIZE = 20;  // Default number of results per page
export const MAX_PAGE_SIZE = 100;     // Maximum allowed results per page

// ============================================================================
// Default Language
// ============================================================================
export const DEFAULT_LANGUAGE = 'pt';  // Default language for operations

// ============================================================================
// Translation Settings
// ============================================================================
export const TRANSLATION_CHUNK_SIZE = 50;  // Number of subtitle entries per translation batch

// ============================================================================
// Validation Patterns
// ============================================================================
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  imdbId: /^tt\d{7,}$/,
} as const;

// ============================================================================
// File Extensions
// ============================================================================
export const FILE_EXTENSIONS = {
  video: SUPPORTED_VIDEO_FORMATS,
  subtitle: SUPPORTED_SUBTITLE_FORMATS,
} as const;

// ============================================================================
// Error Messages
// ============================================================================
export const ERROR_MESSAGES = {
  networkError: 'Erro de conexão com o servidor',
  fileTooBig: `Arquivo muito grande. Máximo: ${MAX_UPLOAD_SIZE_MB}MB`,
  invalidFormat: 'Formato de arquivo não suportado',
  uploadFailed: 'Falha ao enviar arquivo',
  processingFailed: 'Falha ao processar arquivo',
  notFound: 'Recurso não encontrado',
  unauthorized: 'Não autorizado',
  serverError: 'Erro interno do servidor',
} as const;

// ============================================================================
// Success Messages
// ============================================================================
export const SUCCESS_MESSAGES = {
  uploadComplete: 'Arquivo enviado com sucesso',
  processingComplete: 'Processamento concluído',
  syncComplete: 'Sincronização concluída',
  translationComplete: 'Tradução concluída',
  downloadReady: 'Download pronto',
} as const;
