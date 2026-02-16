# Quick Start - Sistema de Player Duplo

## Deploy Backend (Único passo pendente)

```bash
cd /Users/f.nuno/projetos/subtitle-translator

gcloud run deploy scriptum-v2-5 \
  --source . \
  --region=europe-west1 \
  --allow-unauthenticated \
  --memory=2Gi \
  --timeout=900
```

## Usar Aplicação

### 1. Abrir App
```
https://scriptum-v2-50.web.app
```

### 2. Carregar Vídeo MKV Grande
- Arrastar ou selecionar ficheiro
- Ficheiro > 4GB dispara extração rápida

### 3. Aceitar Extração Rápida
```
⚠️ Ficheiro MKV muito grande (5.6GB)

🚀 OPÇÃO RÁPIDA disponível:
✅ Extrair e converter só o áudio (2-3 min)

Usar extração rápida? (Recomendado)
→ Clicar "OK"
```

### 4. Aguardar 2-3 Minutos
- Progress bar mostra extração
- Mensagem: "Extração rápida de áudio"

### 5. Player Duplo Ativo
- Badge verde: "🎵 Áudio Sincronizado"
- Vídeo original + Áudio AAC
- Tudo sincronizado automaticamente

### 6. Sincronizar Legendas Normalmente
- Usar painel "Sync Subtitles"
- Áudio agora está disponível
- Whisper pode fazer sync perfeito

## Teste Rápido (Backend Local)

```bash
cd /Users/f.nuno/projetos/subtitle-translator

# Ativar venv
source .venv/bin/activate

# Rodar servidor
python wsgi_prod.py

# Em outro terminal - testar
python test_audio_extraction.py ~/Downloads/test_video.mkv
```

## Verificar Deploy

```bash
# Health check
curl https://scriptum-v2-5-315653817267.europe-west1.run.app/health

# Logs
gcloud run logs tail scriptum-v2-5 --region=europe-west1
```

## Troubleshooting

### Badge "Áudio Sincronizado" não aparece
- Verificar console do browser (F12)
- Procurar logs: "🎬 Setting up dual player sync"

### Extração demora muito
- Normal para ficheiros grandes
- 5.6GB ≈ 2-3 minutos
- 10GB ≈ 4-5 minutos

### Vídeo sem som
- Verificar se badge aparece
- Se não: extração falhou, tentar novamente
- Fallback: converter ficheiro completo

## Ficheiros Importantes

```
Frontend:
  /Users/f.nuno/projetos/scriptum-v2.5/
    src/components/DualVideoPlayer.tsx
    src/components/panels/VideoAnalysis.tsx

Backend:
  /Users/f.nuno/projetos/subtitle-translator/
    src/scriptum_api/routes/audio_extraction.py

Docs:
  IMPLEMENTATION_SUMMARY.md  ← Resumo completo
  DUAL_PLAYER_SETUP.md       ← Setup técnico
  DEPLOY_INSTRUCTIONS.md     ← Deploy backend
```

## URLs

- **App Live:** https://scriptum-v2-50.web.app
- **Backend:** https://scriptum-v2-5-315653817267.europe-west1.run.app
- **Firestore:** Console GCP > Firestore
- **Cloud Run:** Console GCP > Cloud Run

---

**Ready to use!** 🎉
