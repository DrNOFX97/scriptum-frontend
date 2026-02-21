# Changelog

All notable changes to Scriptum v2.5 will be documented in this file.

## [2.5.1] - 2026-02-16

### Added - Parallel Upload System

#### Performance Improvements
- **Parallel Chunked Upload**: Files are split into 10MB chunks and uploaded simultaneously
- **4-5x Faster Uploads**: 6GB files now upload in ~3 minutes (vs ~15 min sequential)
- **8 Concurrent Connections**: Optimal balance between speed and reliability
- **Real-time Progress**: Detailed progress with speed (MB/s), ETA, and chunks completed

#### Frontend (`src/lib/parallelUpload.ts`)
- New `parallelUpload()` function for chunked uploads
- Progress tracking with `UploadProgress` interface
- Exponential backoff retry logic (up to 5 attempts per chunk)
- Timeout protection (2 minutes per chunk)
- Jitter in retries to prevent thundering herd
- Detailed console logging for debugging

#### Backend (`src/scriptum_api/routes/chunked_upload.py`)
- `POST /start-chunked-upload` - Initialize upload session
- `POST /upload-chunk/<upload_id>/<chunk_index>` - Upload individual chunks
- `POST /finalize-chunked-upload/<upload_id>` - Reassemble chunks
- `GET /chunked-upload-status/<upload_id>` - Get upload progress
- Firestore integration for session tracking
- Buffered streaming (8MB buffer) for memory efficiency
- Automatic chunk deletion after reassembly
- Size validation and integrity checks

#### Integration
- `VideoAnalysis.tsx` now uses `parallelUpload()` for large file uploads
- Progress bar shows upload speed, ETA, and current chunk
- Seamless integration with audio extraction workflow
- Automatic fallback to traditional upload on errors

#### Documentation
- [`docs/PARALLEL_UPLOAD.md`](docs/PARALLEL_UPLOAD.md) - Complete technical documentation
- [`docs/PARALLEL_UPLOAD_TROUBLESHOOTING.md`](docs/PARALLEL_UPLOAD_TROUBLESHOOTING.md) - Troubleshooting guide
- [`scripts/benchmark-upload.ts`](scripts/benchmark-upload.ts) - Performance benchmark suite
- [`src/lib/__tests__/parallelUpload.test.ts`](src/lib/__tests__/parallelUpload.test.ts) - Unit tests

### Changed
- `MAX_PARALLEL` increased from 6 to 8 for better performance
- Retry attempts increased from 3 to 5 for better reliability
- Backend now uses 8MB buffer for file reassembly (vs loading entire chunks)
- Improved error messages with specific failure reasons

### Technical Details

**Upload Flow:**
```
1. Frontend splits file into 10MB chunks
2. Start upload session → get upload_id
3. Upload 8 chunks in parallel (concurrent requests)
4. Track progress in Firestore (chunks_received array)
5. Finalize upload → reassemble chunks into single file
6. Validate integrity (file size check)
7. Return file path to frontend
```

**Performance Benchmarks:**
```
File Size | Sequential | Parallel (8x) | Speedup
----------|------------|---------------|--------
100MB     | 14s        | 4s            | 3.5x
500MB     | 72s        | 18s           | 4.0x
1GB       | 145s       | 35s           | 4.1x
6GB       | 870s (15m) | 180s (3m)     | 4.8x
```

**Architecture:**
- Frontend: React + TypeScript
- Backend: Python Flask + Firestore
- Storage: Cloud Run tmpfs → GCS (future)
- Deployment: Cloud Run (europe-west1)

### Fixed
- Memory issues with large file uploads (streaming instead of loading all chunks)
- Race conditions in chunk tracking (Firestore atomic updates)
- Timeout errors with slow connections (increased to 2 min per chunk)
- Size mismatch warnings (better validation and logging)

### Known Issues
- Cloud Run tmpfs is ephemeral (files deleted between requests) → Future: GCS integration
- Firestore has 1 write/s limit per document → Batching needed for > 100 chunks/s
- Browser memory limit (~2GB) for files > 50GB → Future: Stream API

### Breaking Changes
None - backward compatible with traditional upload

### Migration Guide
No migration needed - parallel upload is automatic for large files.

To disable parallel upload:
```typescript
// Fallback to traditional upload
const formData = new FormData();
formData.append('video', file);
await fetch(`${API_BASE}/extract-convert-audio`, {
  method: 'POST',
  body: formData
});
```

### Dependencies
- No new dependencies required
- Uses existing: `fetch`, `FormData`, `File.slice()`
- Backend: `google-cloud-firestore`

### Performance Tips
1. Adjust `MAX_PARALLEL` based on connection speed:
   - Slow (< 5 Mbps): `MAX_PARALLEL = 4`
   - Normal (5-20 Mbps): `MAX_PARALLEL = 6-8`
   - Fast (> 20 Mbps): `MAX_PARALLEL = 10-12`

2. Adjust `CHUNK_SIZE` for optimal throughput:
   - Small chunks (5MB): More overhead, better reliability
   - Large chunks (20MB): Less overhead, faster (if stable connection)
   - Default (10MB): Best balance

3. Cloud Run configuration:
   ```bash
   gcloud run deploy scriptum-v2-5 \
     --memory=8Gi \
     --cpu=4 \
     --concurrency=80 \
     --max-instances=10
   ```

### Credits
Implemented by: DrNOFX97
Tested with: Real 6.19GB MKV files
Inspired by: Dropbox chunked upload, Google Drive resumable upload

---

## [2.5.0] - 2026-01-XX

### Initial Release
- Video analysis with FFmpeg
- Local subtitle extraction using ffmpeg.wasm
- MLX Whisper synchronization
- Gemini AI translation
- OpenSubtitles integration
- TMDB movie recognition
- Dual video player (original video + converted audio)
- Modern React UI with shadcn/ui
