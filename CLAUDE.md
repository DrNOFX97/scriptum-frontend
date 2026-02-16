# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Scriptum v2.5** is a complete subtitle management suite with a React/TypeScript frontend and Python/Flask backend. It integrates FFmpeg, MLX Whisper, Google Gemini, OpenSubtitles, and TMDB for video analysis, subtitle synchronization, translation, and search.

## Development Commands

### Frontend (React/TypeScript/Vite)

```bash
# Development server (http://localhost:8080)
npm run dev

# Production build
npm run build

# Build for development mode (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Linting
npm run lint
```

### Backend (Python/Flask)

The backend is located at `/Users/f.nuno/projetos/subtitle-translator`

```bash
# Start backend server (http://localhost:5001)
cd /Users/f.nuno/projetos/subtitle-translator
source venv/bin/activate
./start_refactored.sh

# Deploy to Google Cloud Run
./deploy.sh production

# Health check
curl http://localhost:5001/health

# View backend architecture
cat ARCHITECTURE.md
```

### Deployment

```bash
# Deploy frontend to Firebase Hosting
npm run build
firebase deploy

# Deploy backend to Google Cloud Run
cd /Users/f.nuno/projetos/subtitle-translator
./deploy.sh production
```

## Architecture

### Frontend Architecture

**Pattern:** Component-based React with Context API for state management

```
src/
├── components/
│   ├── panels/          # Feature panels (VideoAnalysis, SubtitleSync, TranslationPanel, etc.)
│   ├── shared/          # Reusable components (ApiFormCard, FileUploadInput, ResultsCard)
│   ├── ui/              # shadcn/ui components (button, card, dialog, etc.)
│   └── Dashboard.tsx    # Main dashboard with feature navigation
├── contexts/
│   ├── FileContext.tsx      # Global state for files, subtitles, video info
│   └── NavigationContext.tsx # Navigation state
├── hooks/
│   ├── useFileUpload.ts     # File upload with progress tracking (XMLHttpRequest)
│   └── use-toast.tsx        # Toast notifications
├── lib/
│   ├── api.ts               # Centralized API service with error handling & retries
│   ├── constants.ts         # App-wide constants (API_BASE, limits, thresholds)
│   ├── videoAnalyzer.ts     # Local video analysis using ffmpeg.wasm
│   ├── subtitleExtractor.ts # Extract subtitles from MKV using ffmpeg.wasm
│   └── subtitleLanguages.ts # Language code mappings
├── pages/
│   ├── Index.tsx        # Main page with sidebar navigation
│   └── NotFound.tsx
└── App.tsx              # App root with providers (Query, File, Tooltip, Router)
```

**Key Patterns:**

1. **FileContext** - Central state for all file operations. Components access via `useFileContext()`. Stores:
   - Video files, subtitle files, video info, movie metadata
   - Extracted subtitles from MKV (local ffmpeg.wasm processing)
   - Searched subtitles from OpenSubtitles/LegendasDivx
   - Selected subtitle (type: 'extracted' | 'searched' | 'file')

2. **API Service** (`lib/api.ts`) - Singleton with:
   - Auto-retry logic for network errors (MAX_RETRIES = 3)
   - Centralized error handling with ApiError class
   - Type-safe request/response methods
   - FormData upload support with progress tracking

3. **Constants** (`lib/constants.ts`) - Single source of truth:
   - `API_BASE`: Defaults to GCP Cloud Run, override with `VITE_API_BASE_URL`
   - Processing limits, validation thresholds, error messages
   - Language codes use BCP 47 format (pt-PT, pt-BR, en-US)

4. **Local Processing** (ffmpeg.wasm):
   - Video analysis runs locally in browser (no upload needed)
   - MKV subtitle extraction runs locally
   - Results stored in FileContext for use across panels

### Backend Architecture

**Pattern:** Service-Oriented Architecture with Dependency Injection

Located at `/Users/f.nuno/projetos/subtitle-translator`

```
src/scriptum_api/
├── app.py                 # Application factory (create_app)
├── dependencies.py        # ServiceContainer with DI
├── config.py             # Configuration from environment
├── routes/               # Blueprints (health, video, subtitles, sync, translation)
├── services/             # Business logic (OpenSubtitles, LegendasDivx, TMDB, Gemini, Video)
└── utils/               # Utilities (logger, cleanup, validators, storage)
```

**Key Patterns:**

1. **Application Factory** (`app.py`):
   - `create_app(config, upload_folder)` creates Flask app
   - Registers blueprints with injected services
   - Starts file cleanup background service
   - CORS configured via `CORS_ORIGINS` env var (default: `*`)

2. **Service Container** (`dependencies.py`):
   - Dataclass holding all services (OpenSubtitles, TMDB, Gemini, etc.)
   - Services fail independently (graceful degradation)
   - Created once at app startup, injected into routes

3. **WSGI Entry** (`wsgi_prod.py`):
   - Minimal wrapper (38 lines) around `create_app()`
   - Sets production CORS if `PRODUCTION_CORS=true`
   - Used by gunicorn in Cloud Run deployment

## Critical Implementation Details

### Language Handling

**Always use BCP 47 language codes** with regional variants:
- Portuguese (Portugal): `pt-PT` ✅ NOT `pt`
- Portuguese (Brazil): `pt-BR`
- English (US): `en-US` or `en`
- Spanish: `es`

Frontend defaults to `pt-PT` for Portuguese users. Backend `/translate` endpoint accepts both `pt` and `pt-PT` variants.

### Multi-Source Subtitle Selection

TranslationPanel supports **3 subtitle sources**:
1. **Upload**: Direct file input
2. **Extracted**: From MKV using local ffmpeg.wasm (stored in FileContext.extractedSubtitles)
3. **Searched**: From OpenSubtitles/LegendasDivx (stored in FileContext.selectedSubtitle)

When implementing features that use subtitles, check all 3 sources via FileContext.

### File Upload Pattern

Use `useFileUpload` hook for **progress tracking**:

```typescript
const { progress, isUploading, uploadFile } = useFileUpload();

const handleUpload = async (file: File) => {
  const result = await uploadFile<ResponseType>(
    `${API_BASE}/endpoint`,
    file,
    'fieldName',
    { additionalParam: 'value' }
  );
};
```

For simple requests without progress, use `api` service from `lib/api.ts`.

### FFmpeg.wasm Integration

Video analysis and subtitle extraction run **locally** in the browser:

1. `videoAnalyzer.ts` - Analyzes video metadata without upload
2. `subtitleExtractor.ts` - Extracts embedded MKV subtitles without upload

Results are stored in FileContext and can be used across panels (e.g., translate extracted subtitles).

**Important:** ffmpeg.wasm loads ~30MB on first use. Show loading state during initialization.

### API Error Handling

Backend returns consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": { /* optional */ }
}
```

Frontend `api.ts` wraps errors in `ApiError` class. Always check `response.success` before accessing `response.data`.

### Environment Variables

**Frontend** (`.env.local`):
```bash
VITE_API_BASE_URL=http://localhost:5001  # Override for local backend
```

**Backend** (`.env` or Cloud Run env vars):
```bash
OPENSUBTITLES_API_KEY=...       # Required
TMDB_API_KEY=...                # Required
GEMINI_API_KEY=...              # Optional (translation disabled without it)
LEGENDASDIVX_API_URL=...        # Optional (LegendasDivx integration)
CORS_ORIGINS=*                  # CORS origins (production default: *)
PORT=5001                       # Server port
DEBUG=false                     # Debug mode
```

### Deployment Configuration

**Frontend:** Firebase Hosting
- Build output: `dist/`
- SPA routing: All routes rewrite to `index.html`
- Static assets cached for 1 year

**Backend:** Google Cloud Run
- Docker build via Cloud Build
- Deploy script: `deploy.sh` (automated with health checks)
- Region: `europe-west1`
- Memory: 2Gi, CPU: 2, Timeout: 300s

## Common Gotchas

1. **Don't use generic `pt` language code** - Always use `pt-PT` or `pt-BR` for Portuguese
2. **FileContext is the single source of truth** - Don't create local state for files/subtitles
3. **Check subtitle source type** - Extracted vs Searched vs File have different data structures
4. **FFmpeg.wasm is async** - Always show loading state during video analysis/extraction
5. **API_BASE points to production by default** - Override with `VITE_API_BASE_URL` for local dev
6. **Backend services can be unavailable** - Check `services.gemini_service` exists before using
7. **Translation requires Gemini API key** - Feature gracefully degrades without it

## UI/UX Conventions

- **shadcn/ui** for all UI components (located in `src/components/ui/`)
- **Framer Motion** for animations (use `ANIMATION_DURATION_*` constants)
- **Lucide React** for icons
- **Tailwind CSS** for styling with custom gradient utilities
- **Toast notifications** for user feedback (use `useToast` hook)
- **Tab-based interfaces** for multiple options (e.g., subtitle sources)
- **Progress indicators** for uploads/processing (use `useFileUpload` progress)

## Testing

Tests use **Vitest** with **@testing-library/react**:

```bash
# Run all tests
npm test

# Watch mode during development
npm test:watch
```

Test files should be co-located with components: `ComponentName.test.tsx`
