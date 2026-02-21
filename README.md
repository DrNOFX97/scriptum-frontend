# Scriptum v2.5

🎬 **Suite Completa de Gestão de Legendas** - Interface moderna React integrada com backend Python/Flask.

![Version](https://img.shields.io/badge/version-2.5.0-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Python](https://img.shields.io/badge/Python-3.x-green)

## 🚀 Visão Geral

Scriptum v2.5 combina um frontend React moderno com um backend Python robusto para processamento completo de legendas.

### Funcionalidades Principais

🎥 **Análise de Vídeo** - Metadados, codec, FPS com FFmpeg
🚀 **Upload Paralelo** - Chunks paralelos para uploads 4-5x mais rápidos
🔄 **Sincronização** - MLX Whisper para sync automático
🌍 **Tradução** - Gemini AI com formatação automática
🔍 **Pesquisa** - OpenSubtitles integrado
🎬 **Reconhecimento** - TMDB para metadados de filmes

## 📦 Instalação Rápida

### Frontend
```bash
cd /Users/f.nuno/projetos/scriptum-v2.5
npm install
npm run dev
```

### Backend
```bash
cd /Users/f.nuno/projetos/subtitle-translator
source venv/bin/activate
./start_refactored.sh
```

## 🌐 URLs

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5001
- **API Health**: http://localhost:5001/health

## 🎨 Stack Tecnológica

**Frontend:** React 18 • TypeScript • Vite • shadcn/ui • Tailwind • Framer Motion
**Backend:** Flask • MLX Whisper • Gemini • FFmpeg • OpenSubtitles • TMDB

## 📖 Como Usar

1. Inicie o backend (porta 5001)
2. Inicie o frontend (porta 8080)
3. Aceda http://localhost:8080
4. Selecione funcionalidade no dashboard
5. Upload e processe ficheiros

## 🚀 Upload Paralelo

Scriptum v2.5 implementa upload paralelo com chunks para ficheiros grandes:

- **Performance**: 4-5x mais rápido que upload tradicional
- **Exemplo**: 6GB em ~3 minutos (vs ~15 min sequencial)
- **Tecnologia**: 8 chunks paralelos de 10MB cada
- **Reliability**: Retry automático + validação de integridade

📚 **Documentação Completa**: [`docs/PARALLEL_UPLOAD.md`](docs/PARALLEL_UPLOAD.md)
🔧 **Troubleshooting**: [`docs/PARALLEL_UPLOAD_TROUBLESHOOTING.md`](docs/PARALLEL_UPLOAD_TROUBLESHOOTING.md)

---

**Desenvolvido com ❤️ por DrNOFX97**
