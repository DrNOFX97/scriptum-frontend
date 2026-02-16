# Sistema de Player Duplo (Vídeo + Áudio Separado)

## Visão Geral

Sistema implementado para reproduzir ficheiros MKV com AC3 no browser sem conversão completa do vídeo.

**Problema resolvido:**
- MKV 5.6GB com AC3 demorava 10-15 min para converter completo
- Ficheiros grandes bloqueavam o workflow

**Solução:**
- Extração rápida só do áudio (300MB)
- Conversão AC3 → AAC (2-3 min)
- Player duplo sincronizado

## Arquitectura

### Backend (Python Flask)

**Novo endpoint:** `/extract-convert-audio`

Ficheiro: `/Users/f.nuno/projetos/subtitle-translator/src/scriptum_api/routes/audio_extraction.py`

**Processo:**
1. Recebe upload do vídeo MKV
2. Extrai stream de áudio com `ffmpeg -c:a copy` (rápido!)
3. Converte AC3 → AAC com `ffmpeg -c:a aac -b:a 192k`
4. Retorna job_id para polling
5. Download do AAC extraído

**Endpoints:**
- `POST /extract-convert-audio` - Inicia extração
- `GET /extract-audio-status/<job_id>` - Status da extração
- `GET /extract-audio-download/<job_id>` - Download do AAC

### Frontend (React + TypeScript)

**Novo componente:** `DualVideoPlayer.tsx`

Ficheiro: `/Users/f.nuno/projetos/scriptum-v2.5/src/components/DualVideoPlayer.tsx`

**Funcionalidades:**
- Carrega vídeo original (sem som)
- Carrega áudio AAC separado
- Sincronização automática:
  - Play/Pause
  - Seeking
  - Playback rate
  - Volume
  - Drift correction (100ms)

**Integração em VideoAnalysis.tsx:**
- Detecção de ficheiros grandes (>4GB)
- Dialog oferecendo extração rápida
- Progress tracking durante extração
- Switch automático para DualVideoPlayer

## Workflow do Utilizador

### 1. Carregar Ficheiro Grande

```
Ficheiro: video.mkv (5.6GB)
```

### 2. Dialog de Extração Rápida

```
⚠️ Ficheiro MKV muito grande (5.6GB)

🚀 OPÇÃO RÁPIDA disponível:

✅ Extrair e converter só o áudio (2-3 min)
✅ Vídeo original preservado
✅ Som AAC compatível com browser
✅ Playback sincronizado

Alternativa: Converter tudo (10-15 min)

Usar extração rápida? (Recomendado)
```

### 3. Extração em Background

```
🔄 A extrair áudio...
📊 Progresso: 50%
⏱️ Tempo estimado: 2-3 minutos
```

### 4. Player Duplo Ativo

```
🎬 Vídeo: video.mkv (original)
🎵 Áudio: audio_extract_xxx.aac (convertido)
✅ Sincronização ativa
```

## Vantagens

| Métrica | Conversão Completa | Extração Rápida |
|---------|-------------------|-----------------|
| Tempo | 10-15 min | 2-3 min |
| Upload | 5.6GB | 5.6GB (único) |
| Download | 5.4GB | 300MB |
| Qualidade vídeo | Preservada | Original! |
| Qualidade áudio | AAC 192k | AAC 192k |
| **Speedup** | **1x** | **5x** ⚡ |

## Sincronização

O DualVideoPlayer implementa:

1. **Event Listeners**
   - `play` → sincroniza play do áudio
   - `pause` → sincroniza pause
   - `seeked` → sincroniza posição
   - `ratechange` → sincroniza velocidade
   - `volumechange` → sincroniza volume

2. **Drift Correction**
   - Verifica a cada 100ms
   - Se drift > 100ms, corrige automaticamente

3. **Muting**
   - Vídeo sempre muted (previne áudio duplicado)
   - Volume controlado pelo elemento áudio

## Comandos de Deploy

### Backend

```bash
cd /Users/f.nuno/projetos/subtitle-translator

# Deploy para Cloud Run
gcloud run deploy scriptum-v2-5 \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated \
  --memory=2Gi \
  --timeout=900
```

### Frontend

```bash
cd /Users/f.nuno/projetos/scriptum-v2.5

# Build
npm run build

# Deploy para Firebase
firebase deploy --only hosting
```

## Testing

### 1. Backend Local

```bash
cd /Users/f.nuno/projetos/subtitle-translator
python wsgi_prod.py
```

Testar endpoint:
```bash
curl -X POST http://localhost:5001/extract-convert-audio \
  -F "video=@test_video.mkv"
```

### 2. Frontend Local

```bash
cd /Users/f.nuno/projetos/scriptum-v2.5
npm run dev
```

Abrir: http://localhost:5173

### 3. Teste End-to-End

1. Carregar MKV grande (>4GB)
2. Aceitar "extração rápida"
3. Aguardar 2-3 min
4. Verificar player duplo
5. Testar play/pause/seek
6. Verificar badge "🎵 Áudio Sincronizado"

## Arquivos Modificados

### Backend

- ✅ `src/scriptum_api/routes/audio_extraction.py` (novo)
- ✅ `src/scriptum_api/routes/__init__.py` (+ import)
- ✅ `src/scriptum_api/app.py` (+ blueprint + banner)

### Frontend

- ✅ `src/components/DualVideoPlayer.tsx` (novo)
- ✅ `src/components/panels/VideoAnalysis.tsx` (integração)

## Troubleshooting

### Áudio não sincroniza

```typescript
// Verificar console
console.log('🎬 Video time:', video.currentTime);
console.log('🎵 Audio time:', audio.currentTime);
```

### Extração falha

```bash
# Verificar logs do servidor
gcloud run logs read scriptum-v2-5 --region=europe-west1 --limit=50
```

### Player duplo não aparece

```typescript
// Verificar estados
console.log('videoUrl:', videoUrl);
console.log('separateAudioUrl:', separateAudioUrl);
```

## Melhorias Futuras

1. **Streaming**
   - Stream do áudio em chunks durante extração
   - Preview parcial antes de terminar

2. **Cache**
   - Cache de áudios extraídos
   - Reutilizar para mesmo ficheiro

3. **Qualidade**
   - Opção de bitrate (128k/192k/256k)
   - Detecção automática de qualidade original

4. **UX**
   - Mostrar preview do waveform
   - Indicador visual de drift
   - Controles separados de volume

## Conclusão

Sistema implementado e funcionando em produção:

- ✅ Backend deployado: https://scriptum-v2-5-315653817267.europe-west1.run.app
- ✅ Frontend deployado: https://scriptum-v2-50.web.app
- ✅ Testes validados
- ✅ 5x mais rápido que conversão completa
- ✅ Qualidade preservada
- ✅ Sincronização perfeita

🎉 **Ready for production!**
