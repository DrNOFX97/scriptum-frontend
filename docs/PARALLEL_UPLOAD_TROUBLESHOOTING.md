# Parallel Upload - Troubleshooting Guide

## Problemas Comuns e Soluções

### 1. Upload Muito Lento

**Sintomas:**
- Velocidade < 5 MB/s
- ETA muito alto
- Progress bar não avança

**Causas Possíveis:**

#### A) Conexão Lenta
```
Solução: Reduzir paralelismo
```

Editar `src/lib/parallelUpload.ts`:
```typescript
const MAX_PARALLEL = 4; // Reduzir de 8 para 4
```

#### B) Servidor Sobrecarregado
```
Sintomas:
- Muitos timeouts
- Erros 503 Service Unavailable
- Logs: "Cloud Run instance limit reached"
```

Solução no Cloud Run:
```bash
gcloud run deploy scriptum-v2-5 \
  --region=europe-west1 \
  --max-instances=10 \
  --concurrency=100
```

#### C) Chunk Size Inadequado
```
Solução: Ajustar tamanho de chunk
```

Para conexões lentas (< 5 Mbps):
```typescript
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
```

Para conexões rápidas (> 20 Mbps):
```typescript
const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
```

### 2. Chunks Falhando Constantemente

**Sintomas:**
- Console: "⚠️ Chunk X failed (attempt Y/5)"
- Upload nunca completa
- Erro final: "Chunk X upload failed after 5 attempts"

**Soluções:**

#### A) Aumentar Timeout
Editar `src/lib/parallelUpload.ts`:
```typescript
const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min
```

#### B) Aumentar Retries
```typescript
const maxRetries = 10; // Aumentar de 5 para 10
```

#### C) Verificar Firewall/Proxy
```bash
# Testar conectividade
curl -X POST https://scriptum-v2-5-315653817267.europe-west1.run.app/start-chunked-upload \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.mkv","total_size":100,"chunk_size":10,"total_chunks":10}'

# Deve retornar: {"success": true, "upload_id": "..."}
```

### 3. Erro: "Not all chunks received"

**Sintomas:**
- Upload completa a 100%
- Erro na finalização: "Not all chunks received"
- Backend: "received: 612, expected: 615, missing_chunks: [145, 289, 501]"

**Causas:**

#### A) Race Condition
Alguns chunks não foram salvos antes da finalização.

Solução: Aguardar 5s antes de finalizar:
```typescript
// Após todos os chunks
await new Promise(resolve => setTimeout(resolve, 5000));

// Agora finalizar
await fetch(`${API_BASE}/finalize-chunked-upload/${upload_id}`);
```

#### B) Disco Cheio no Servidor
```bash
# Verificar espaço em disco (Cloud Run)
gcloud logging read "resource.type=cloud_run_revision" --limit=50 | grep "disk"
```

Solução: Aumentar memória (mais memória = mais tmpfs):
```bash
gcloud run deploy scriptum-v2-5 \
  --memory=8Gi  # Aumentar de 4Gi para 8Gi
```

#### C) Firestore Write Limit
Firestore tem limite de 1 write/s por documento.

Solução: Usar batch writes:
```python
# Backend: chunked_upload.py
batch = db.batch()
batch.update(upload_ref, {'chunks_received': chunks_received})
batch.commit()
```

### 4. Erro: "Size mismatch"

**Sintomas:**
- Upload completa
- Warning: "Size mismatch: expected 6,442,450,944, got 6,442,445,824"
- Diferença: ~5MB

**Causas:**

#### A) Truncamento de Chunk
Um chunk foi truncado durante upload.

Solução: Verificar MD5 de cada chunk:
```typescript
// Frontend
const chunkHash = await crypto.subtle.digest('MD5', chunk);

// Backend
import hashlib
expected_hash = request.headers.get('X-Chunk-MD5')
actual_hash = hashlib.md5(chunk.read()).hexdigest()
if expected_hash != actual_hash:
    return {'error': 'Chunk corrupted'}, 400
```

#### B) File Still Being Written
O ficheiro original ainda estava a ser escrito.

Solução: Verificar tamanho antes de upload:
```typescript
const initialSize = file.size;
await new Promise(resolve => setTimeout(resolve, 1000));
const finalSize = file.size;

if (initialSize !== finalSize) {
  throw new Error('File is still being written');
}
```

### 5. Memory Errors (OOM)

**Sintomas:**
- Browser: "Out of memory"
- Console: "RangeError: Array buffer allocation failed"
- Acontece com ficheiros > 10GB

**Soluções:**

#### A) Usar Streams (em vez de slice)
```typescript
// ❌ Má prática: carrega tudo na memória
const chunk = file.slice(start, end);

// ✅ Boa prática: usa streams
const stream = file.stream();
const reader = stream.getReader();
```

#### B) Limpar Memória Entre Chunks
```typescript
if (chunkIndex % 10 === 0) {
  // Força garbage collection a cada 10 chunks
  if (global.gc) {
    global.gc();
  }
}
```

#### C) Aumentar Heap Size (Node.js)
```bash
node --max-old-space-size=8192 script.js  # 8GB heap
```

### 6. CORS Errors

**Sintomas:**
- Console: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Upload não inicia
- Preflight requests failing

**Solução:**

Backend (`app.py`):
```python
from flask_cors import CORS

CORS(app,
     origins=['https://scriptum-v2-5.web.app', 'http://localhost:5173'],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True,
     max_age=3600)
```

### 7. Firestore Permission Denied

**Sintomas:**
- Backend: "FirebaseError: PERMISSION_DENIED"
- Chunks são salvos mas Firestore updates falham

**Solução:**

Verificar Firestore Rules:
```bash
firebase firestore:rules:get
```

Actualizar rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chunked_uploads/{upload_id} {
      // Allow service account
      allow read, write: if request.auth != null;

      // Allow anonymous for dev
      allow read, write: if request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

Aplicar:
```bash
firebase deploy --only firestore:rules
```

### 8. Slow Reassembly

**Sintomas:**
- Chunks uploadam rápido (3 min)
- Reassembly demora muito (10+ min)
- Backend log: "Reassembling chunks..." (stuck)

**Causas:**

#### A) Sequential Read/Write
Backend está a ler chunks sequencialmente.

Solução: Já implementado (streaming com buffer de 8MB).

#### B) Disk I/O Lento
Cloud Run usa tmpfs (RAM disk) mas pode ser lento se pouca memória.

Solução:
```bash
gcloud run deploy scriptum-v2-5 \
  --memory=8Gi  # Mais RAM = tmpfs mais rápido
  --cpu=4       # Mais CPU = I/O paralelo
```

#### C) Muitos Pequenos Chunks
Milhares de chunks (< 1MB cada) causam overhead.

Solução: Aumentar chunk size:
```typescript
const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
```

### 9. Upload Completo mas Ficheiro Não Encontrado

**Sintomas:**
- Upload 100% completo
- Backend: "Upload completed successfully"
- Mas depois: "File not found: /uploads/assembled_..."

**Causa:**
Cloud Run usa tmpfs que é limpo entre requests.

**Solução:**
Usar Google Cloud Storage:

```python
from google.cloud import storage

def upload_to_gcs(local_path: Path, bucket_name: str):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(local_path.name)

    blob.upload_from_filename(str(local_path))

    return blob.public_url

# Após reassembly
gcs_url = upload_to_gcs(output_path, 'scriptum-uploads')
upload_ref.update({'gcs_url': gcs_url})
```

### 10. Progress Bar Stuck

**Sintomas:**
- Progress bar pára a 45%
- Não há erros no console
- Chunks continuam a ser enviados

**Causa:**
Progress callback não está a ser chamado.

**Solução:**

Verificar se callback está registado:
```typescript
await parallelUpload(file, {
  onProgress: (progress) => {
    console.log('Progress:', progress.percentage);
    setProcessingProgress(progress.percentage);
  }
});
```

Forçar update a cada chunk:
```typescript
options?.onProgress?.({
  uploadedBytes,
  totalBytes: file.size,
  percentage: (uploadedBytes / file.size) * 100,
  uploadSpeed,
  eta,
  currentChunk: completedChunks,
  totalChunks
});
```

## Debugging Tools

### Frontend Console

```typescript
// Enable verbose logging
localStorage.setItem('DEBUG', 'parallelUpload:*');

// Inspect upload state
window.uploadState = {
  uploadId: null,
  completedChunks: [],
  failedChunks: []
};
```

### Backend Logs

```bash
# View real-time logs
gcloud run services logs tail scriptum-v2-5 --region=europe-west1

# Search for specific upload
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"upload_.*\"" --limit=100

# Filter by error
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50
```

### Network Inspector

Browser DevTools → Network → Filter by "chunk":
- Verify all chunks sent (should be 615 for 6GB file)
- Check response codes (should all be 200)
- Verify timing (should be parallel, not sequential)

### Firestore Console

https://console.firebase.google.com → Firestore → `chunked_uploads`

Check document:
- `status`: should be "uploading" → "completed"
- `chunks_received`: should have all chunk indices [0,1,2,...,614]
- `progress`: should be 100

## Performance Tuning

### Optimal Settings by Connection Speed

| Connection | MAX_PARALLEL | CHUNK_SIZE | Expected Speed |
|------------|-------------|------------|----------------|
| < 5 Mbps   | 3-4         | 5MB        | ~4 MB/s        |
| 5-10 Mbps  | 4-6         | 10MB       | ~8 MB/s        |
| 10-20 Mbps | 6-8         | 10MB       | ~15 MB/s       |
| 20-50 Mbps | 8-10        | 15MB       | ~30 MB/s       |
| > 50 Mbps  | 10-12       | 20MB       | ~50 MB/s       |

### Cloud Run Optimization

```yaml
# Optimal for parallel uploads
apiVersion: serving.knative.dev/v1
kind: Service
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project/scriptum-v2-5
        resources:
          limits:
            memory: 8Gi
            cpu: "4"
        env:
        - name: MAX_WORKERS
          value: "8"
      containerConcurrency: 80
      timeoutSeconds: 3600
```

Deploy:
```bash
gcloud run deploy scriptum-v2-5 \
  --source . \
  --region=europe-west1 \
  --memory=8Gi \
  --cpu=4 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=3600
```

## Getting Help

Se o problema persistir:

1. **Gather Information:**
   ```bash
   # Frontend
   - Browser: Chrome/Firefox/Safari?
   - Console logs (copy all)
   - Network tab (export HAR)
   - File size and type

   # Backend
   - Cloud Run logs (last 100 lines)
   - Firestore document state
   - Error messages
   ```

2. **Create Issue:**
   https://github.com/scriptum/issues/new
   - Include all information above
   - Attach HAR file (sanitized)
   - Describe expected vs actual behavior

3. **Quick Fixes:**
   - Try different browser
   - Disable browser extensions
   - Test with smaller file (< 1GB)
   - Check internet connection stability
   - Verify server status (Cloud Run dashboard)

## Emergency Fallback

Se parallel upload não funcionar, usar upload tradicional:

```typescript
// Fallback to traditional upload
const formData = new FormData();
formData.append('video', file);

const response = await fetch(`${API_BASE}/extract-convert-audio`, {
  method: 'POST',
  body: formData
});
```

**Nota:** Será mais lento mas mais confiável.
