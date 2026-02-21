# Deployment Guide - Scriptum v2.5.1

Guia completo de deployment do sistema de upload paralelo.

## Pré-requisitos

### 1. Google Cloud Platform
- Conta GCP ativa
- Projeto criado
- Billing ativado
- APIs ativadas:
  - Cloud Run
  - Cloud Firestore
  - Cloud Logging
  - Cloud Storage (opcional)

### 2. Firebase
- Projeto Firebase configurado
- Firestore ativado
- Hosting configurado

### 3. Ferramentas Locais
```bash
# Google Cloud SDK
brew install google-cloud-sdk

# Firebase CLI
npm install -g firebase-tools

# Node.js 18+
node --version  # v18.x ou superior

# Python 3.11+
python --version  # 3.11+
```

## Deploy Backend (Cloud Run)

### 1. Configurar Ambiente

```bash
cd /Users/f.nuno/projetos/subtitle-translator

# Login no GCP
gcloud auth login

# Selecionar projeto
gcloud config set project scriptum-v2-5

# Região
gcloud config set run/region europe-west1
```

### 2. Preparar requirements.txt

Verificar que inclui:
```txt
flask>=3.0.0
flask-cors>=4.0.0
google-cloud-firestore>=2.14.0
google-cloud-storage>=2.14.0
google-cloud-logging>=3.8.0
```

### 3. Deploy

```bash
# Deploy com configuração optimizada para uploads paralelos
gcloud run deploy scriptum-v2-5 \
  --source . \
  --region=europe-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=8Gi \
  --cpu=4 \
  --timeout=3600 \
  --concurrency=80 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="ENVIRONMENT=production" \
  --set-env-vars="CORS_ORIGINS=https://scriptum-v2-5.web.app,https://scriptum-v2-5.firebaseapp.com"

# Obter URL do serviço
gcloud run services describe scriptum-v2-5 \
  --region=europe-west1 \
  --format="value(status.url)"
```

**Saída esperada:**
```
https://scriptum-v2-5-315653817267.europe-west1.run.app
```

### 4. Configurar Firestore

Criar índices necessários:

```bash
firebase firestore:indexes

# Adicionar ao firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "chunked_uploads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 5. Configurar Regras Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chunked uploads collection
    match /chunked_uploads/{uploadId} {
      // Allow read/write for authenticated users and service account
      allow read, write: if request.auth != null;

      // Allow read/write for development (remover em produção)
      allow read, write: if request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

### 6. Verificar Deploy

```bash
# Test health endpoint
curl https://scriptum-v2-5-315653817267.europe-west1.run.app/health

# Test chunked upload endpoints
curl -X POST https://scriptum-v2-5-315653817267.europe-west1.run.app/start-chunked-upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.mkv",
    "total_size": 1000000,
    "chunk_size": 10485760,
    "total_chunks": 1
  }'

# Deve retornar: {"success": true, "upload_id": "upload_..."}
```

## Deploy Frontend (Firebase Hosting)

### 1. Configurar Variáveis de Ambiente

Criar `.env.production`:
```bash
VITE_API_BASE_URL=https://scriptum-v2-5-315653817267.europe-west1.run.app
```

### 2. Build

```bash
cd /Users/f.nuno/projetos/scriptum-v2.5

# Install dependencies
npm install

# Build for production
npm run build

# Verificar build
ls -lh dist/
```

**Saída esperada:**
```
dist/
├── assets/
│   ├── index-[hash].js      (~500KB gzipped)
│   ├── index-[hash].css     (~50KB gzipped)
│   └── ...
├── index.html
└── ...
```

### 3. Deploy

```bash
# Login no Firebase
firebase login

# Deploy hosting
firebase deploy --only hosting

# Verificar deploy
firebase hosting:channel:list
```

**URL de produção:**
```
https://scriptum-v2-5.web.app
https://scriptum-v2-5.firebaseapp.com
```

### 4. Configurar firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=86400"
          }
        ]
      }
    ]
  }
}
```

### 5. Verificar Frontend

```bash
# Abrir no browser
open https://scriptum-v2-5.web.app

# Test upload paralelo
# 1. Carregar ficheiro grande (> 1GB)
# 2. Verificar console: "🚀 Starting parallel upload"
# 3. Verificar velocidade e chunks
```

## Monitorização

### 1. Cloud Run Logs

```bash
# Real-time logs
gcloud run services logs tail scriptum-v2-5 \
  --region=europe-west1 \
  --format="table(timestamp,severity,textPayload)"

# Filter by upload
gcloud logging read \
  "resource.type=cloud_run_revision AND textPayload=~\"upload_.*\"" \
  --limit=100 \
  --format=json

# Filter by errors
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=50
```

### 2. Firestore Console

https://console.firebase.google.com/project/scriptum-v2-5/firestore

Verificar colecção `chunked_uploads`:
- Documents com `status: "completed"` → Sucesso
- Documents com `status: "error"` → Falha
- Documents com `status: "uploading"` → Em progresso

### 3. Cloud Run Metrics

https://console.cloud.google.com/run/detail/europe-west1/scriptum-v2-5/metrics

Métricas importantes:
- **Request count**: Número de uploads
- **Request latency**: Tempo por chunk
- **Memory utilization**: Uso de RAM (deve estar < 80%)
- **CPU utilization**: Uso de CPU (picos durante reassembly)
- **Instance count**: Número de instâncias ativas

### 4. Frontend Analytics

Firebase Console → Analytics:
- User engagement
- Performance monitoring
- Error reporting

## Troubleshooting

### Upload Lento

**Problema:** Uploads lentos (< 5 MB/s)

**Diagnóstico:**
```bash
# Check Cloud Run instances
gcloud run services describe scriptum-v2-5 \
  --region=europe-west1 \
  --format="value(status.conditions)"

# Check instance count
gcloud logging read \
  "resource.type=cloud_run_revision" \
  --format="table(timestamp,httpRequest.requestMethod)" \
  --limit=100
```

**Solução:**
1. Aumentar `max-instances`:
   ```bash
   gcloud run services update scriptum-v2-5 \
     --max-instances=20 \
     --region=europe-west1
   ```

2. Aumentar `cpu`:
   ```bash
   gcloud run services update scriptum-v2-5 \
     --cpu=8 \
     --region=europe-west1
   ```

### Chunks Falhando

**Problema:** Muitos chunks falham (> 10%)

**Diagnóstico:**
```bash
# Check error logs
gcloud logging read \
  "resource.type=cloud_run_revision AND severity=ERROR AND textPayload=~\"Chunk.*failed\"" \
  --limit=50
```

**Solução:**
1. Aumentar timeout:
   ```bash
   gcloud run services update scriptum-v2-5 \
     --timeout=3600 \
     --region=europe-west1
   ```

2. Aumentar memória:
   ```bash
   gcloud run services update scriptum-v2-5 \
     --memory=16Gi \
     --region=europe-west1
   ```

### Firestore Errors

**Problema:** "PERMISSION_DENIED" errors

**Diagnóstico:**
```bash
# Check Firestore rules
firebase firestore:rules:get

# Check service account permissions
gcloud projects get-iam-policy scriptum-v2-5 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)"
```

**Solução:**
1. Actualizar Firestore rules (ver secção acima)
2. Verificar service account:
   ```bash
   gcloud iam service-accounts list
   ```

## Rollback

### Backend

```bash
# List revisions
gcloud run revisions list \
  --service=scriptum-v2-5 \
  --region=europe-west1

# Rollback to previous revision
gcloud run services update-traffic scriptum-v2-5 \
  --to-revisions=scriptum-v2-5-00042-abc=100 \
  --region=europe-west1
```

### Frontend

```bash
# List releases
firebase hosting:releases:list

# Rollback
firebase hosting:rollback <release-id>
```

## Cost Optimization

### 1. Cloud Run

**Pricing:**
- CPU: $0.00002400 per vCPU-second
- Memory: $0.00000250 per GiB-second
- Requests: $0.40 per million requests

**Estimativa (1000 uploads/dia de 6GB):**
- Request time: ~3 min/upload = 180s
- CPU: 4 vCPU × 180s × 1000 = 720,000 vCPU-seconds/dia
- Memory: 8 GiB × 180s × 1000 = 1,440,000 GiB-seconds/dia
- Cost: ~$20/dia (~$600/mês)

**Optimizações:**
1. Min instances = 0 (cold start OK)
2. Max instances = 10 (limitar custos)
3. CPU = 4 (balance cost/performance)
4. Memory = 8Gi (suficiente)

### 2. Firestore

**Pricing:**
- Reads: $0.06 per 100,000 reads
- Writes: $0.18 per 100,000 writes
- Storage: $0.18 per GiB/month

**Estimativa (1000 uploads/dia):**
- Writes: ~615 chunks × 1000 uploads = 615,000 writes/dia
- Cost: ~$1.10/dia (~$33/mês)

**Optimizações:**
1. Delete completed uploads after 24h
2. Use batch writes quando possível
3. Minimize update frequency

### 3. Firebase Hosting

**Pricing:**
- Storage: $0.026 per GB
- Bandwidth: $0.15 per GB

**Estimativa:**
- Storage: ~100MB = $0.0026/mês
- Bandwidth: ~10GB/mês = $1.50/mês

**Cost Total Estimado: ~$635/mês** (1000 uploads/dia de 6GB)

## Performance Tuning

### 1. Ajustar Paralelismo

Editar `src/lib/parallelUpload.ts`:
```typescript
// Para conexões lentas
const MAX_PARALLEL = 4;

// Para conexões normais (default)
const MAX_PARALLEL = 8;

// Para conexões rápidas
const MAX_PARALLEL = 12;
```

Build e deploy:
```bash
npm run build
firebase deploy --only hosting
```

### 2. Ajustar Chunk Size

```typescript
// Chunks pequenos (mais confiáveis)
const CHUNK_SIZE = 5 * 1024 * 1024;  // 5MB

// Chunks médios (default)
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

// Chunks grandes (mais rápidos)
const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB
```

### 3. Backend Optimization

```bash
# Mais CPU para reassembly rápido
gcloud run services update scriptum-v2-5 \
  --cpu=8 \
  --region=europe-west1

# Mais memória para tmpfs
gcloud run services update scriptum-v2-5 \
  --memory=16Gi \
  --region=europe-west1
```

## CI/CD Pipeline

### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - run: |
          cd subtitle-translator
          gcloud run deploy scriptum-v2-5 \
            --source . \
            --region=europe-west1

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: |
          npm install
          npm run build
          npm install -g firebase-tools
          firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
```

## Backup & Recovery

### 1. Firestore Backup

```bash
# Export Firestore
gcloud firestore export gs://scriptum-v2-5-backups/$(date +%Y-%m-%d)

# Import Firestore
gcloud firestore import gs://scriptum-v2-5-backups/2026-02-16
```

### 2. Code Backup

```bash
# Git tags for releases
git tag -a v2.5.1 -m "Parallel upload system"
git push origin v2.5.1

# Backup to another remote
git remote add backup https://github.com/user/scriptum-backup.git
git push backup main
```

## Support

**Issues:** https://github.com/scriptum/issues
**Docs:** https://scriptum-v2-5.web.app/docs
**Email:** support@scriptum.com

---

**Last updated:** 2026-02-16
**Version:** 2.5.1
**Maintainer:** DrNOFX97
