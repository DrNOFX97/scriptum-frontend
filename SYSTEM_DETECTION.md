# Sistema de Deteção e Preparação para Whisper

## 📋 Resumo

Implementado sistema completo de deteção de hardware e software para determinar a melhor configuração de Whisper (MLX vs CUDA vs CPU).

## 🎯 Funcionalidades

### 1. Deteção de Sistema
- **Plataforma**: Mac, Windows, Linux
- **Arquitetura**: Intel, Apple Silicon, x64, x86
- **Browser**: Chrome, Firefox, Safari, Edge

### 2. Deteção de GPU
- **WebGL Detection**: Deteta GPU via WebGL debug info
- **Fabricantes**:
  - Apple Silicon (M1/M2/M3/M4)
  - NVIDIA (CUDA)
  - AMD (ROCm experimental)
  - Intel (integrada)

### 3. Análise de Capacidade Whisper

#### MLX Whisper (Mac)
- ✅ **Requer**: Apple Silicon (M1/M2/M3/M4)
- ✅ **Deteta**: Chip específico
- ✅ **Performance**: Muito rápido (GPU Metal)
- ❌ **Não funciona**: Mac Intel

#### CUDA Whisper (Windows/Linux)
- ✅ **Requer**: GPU NVIDIA
- ✅ **Deteta**: NVIDIA GPU
- ✅ **Performance**: Muito rápido (CUDA)
- ❌ **Não funciona**: AMD, Intel, Mac

#### CPU Whisper (Fallback)
- ⚠️ **Usado quando**: Sem GPU compatível
- ⚠️ **Performance**: 10-20x mais lento
- ⚠️ **Recomendação**: Usar serviço cloud

## 📁 Ficheiros Criados

### `src/lib/systemDetector.ts`
```typescript
// Funções principais:
detectSystem()           // Deteta SO e arquitetura
detectGPU()              // Deteta GPU via WebGL
checkMLXCapability()     // Verifica se pode usar MLX
checkCUDACapability()    // Verifica se pode usar CUDA
checkWhisperCapability() // Análise completa
```

### `src/components/panels/SystemDiagnostics.tsx`
```typescript
// Painel de diagnóstico UI
- Mostra info de sistema
- Mostra info de GPU
- Mostra capacidade Whisper
- Recomendações automáticas
```

### `src/components/panels/Settings.tsx` (modificado)
```typescript
// Adicionado tabs:
- Tab "Chaves API" (existente)
- Tab "Diagnóstico Sistema" (novo)
```

## 🔍 Como Funciona

### 1. Deteção de Sistema
```javascript
const systemInfo = detectSystem();
// Retorna:
{
  platform: 'mac' | 'windows' | 'linux',
  os: 'macOS 14.2.1',
  arch: 'Apple Silicon',
  browser: 'Chrome',
  ...
}
```

### 2. Deteção de GPU
```javascript
const gpuInfo = detectGPU();
// Retorna:
{
  vendor: 'Apple Inc.',
  renderer: 'Apple M2',
  isAppleSilicon: true,
  isNvidia: false,
  ...
}
```

### 3. Análise de Capacidade
```javascript
const capability = await checkWhisperCapability();
// Retorna:
{
  canUseMLX: true,
  canUseCUDA: false,
  recommendedBackend: 'mlx',
  mlxInfo: {
    available: true,
    chip: 'M2',
    reason: 'Mac com Apple Silicon detetado...'
  },
  warnings: [],
  ...
}
```

## 🎨 Interface do Utilizador

### Tab "Diagnóstico Sistema"

#### Secção 1: Sistema Operativo
```
┌─────────────────────────────────────┐
│ 🖥️  Sistema Operativo              │
├─────────────────────────────────────┤
│ Plataforma: macOS 14.2.1            │
│ Arquitetura: Apple Silicon          │
│ Browser: Chrome                     │
│ Tipo: 🍎 Mac                        │
└─────────────────────────────────────┘
```

#### Secção 2: GPU
```
┌─────────────────────────────────────┐
│ 💻 GPU / Placa Gráfica              │
├─────────────────────────────────────┤
│ Fabricante: Apple Inc.              │
│ Modelo: Apple M2                    │
│ [Apple Silicon Badge]               │
└─────────────────────────────────────┘
```

#### Secção 3: Capacidade Whisper
```
┌─────────────────────────────────────┐
│ 💾 Capacidade Whisper               │
├─────────────────────────────────────┤
│ Backend Recomendado: [MLX Badge]    │
│                                     │
│ ✅ MLX Whisper (Mac)                │
│    Mac com Apple Silicon detetado  │
│    Chip: M2                         │
│                                     │
│ ❌ CUDA Whisper (NVIDIA)            │
│    CUDA não disponível em Mac       │
│                                     │
│ ℹ️ Recomendação:                    │
│ Sistema ideal para MLX Whisper!     │
│ MLX otimizado para Apple Silicon    │
│ será muito rápido.                  │
└─────────────────────────────────────┘
```

## 🚀 Próximos Passos

### Backend (a implementar)
1. **Endpoint de configuração**:
   ```python
   @app.route('/set-whisper-backend', methods=['POST'])
   def set_whisper_backend():
       backend = request.json.get('backend')  # 'mlx' | 'cuda' | 'cpu'
       # Configurar Whisper para usar backend correto
   ```

2. **Auto-deteção no servidor**:
   ```python
   def detect_server_capability():
       if is_mac() and has_mlx():
           return 'mlx'
       elif has_nvidia_gpu() and has_cuda():
           return 'cuda'
       else:
           return 'cpu'
   ```

3. **MLX Whisper integration**:
   ```python
   import mlx_whisper

   def transcribe_mlx(audio_file):
       result = mlx_whisper.transcribe(audio_file)
       return result
   ```

4. **CUDA Whisper integration**:
   ```python
   import whisper

   def transcribe_cuda(audio_file):
       model = whisper.load_model("base", device="cuda")
       result = model.transcribe(audio_file)
       return result
   ```

## ⚙️ Configurações Recomendadas

### Mac M1/M2/M3/M4
```json
{
  "whisper_backend": "mlx",
  "model_size": "base",
  "use_gpu": true,
  "expected_speed": "Muito rápido (5-10min vídeo de 1h)"
}
```

### Windows/Linux com NVIDIA
```json
{
  "whisper_backend": "cuda",
  "model_size": "base",
  "use_gpu": true,
  "cuda_device": 0,
  "expected_speed": "Rápido (10-15min vídeo de 1h)"
}
```

### CPU Only
```json
{
  "whisper_backend": "cpu",
  "model_size": "tiny",
  "use_gpu": false,
  "expected_speed": "Muito lento (1-2h vídeo de 1h)",
  "warning": "Considere usar serviço cloud"
}
```

## 📊 Comparação de Performance

| Backend | Hardware | Velocidade | Vídeo 1h | Qualidade |
|---------|----------|------------|----------|-----------|
| MLX | Apple Silicon | ⚡⚡⚡⚡⚡ | 5-10min | Excelente |
| CUDA | NVIDIA RTX | ⚡⚡⚡⚡ | 10-15min | Excelente |
| CPU | Intel/AMD | ⚡ | 60-120min | Boa |

## 🧪 Testar

1. Abre a aplicação localmente:
   ```bash
   npm run dev
   ```

2. Vai a **Configurações → Diagnóstico Sistema**

3. Verifica:
   - Sistema detetado corretamente?
   - GPU detetada?
   - Recomendação correta?

## 📝 Notas Importantes

- **WebGL necessário**: Deteção de GPU requer WebGL ativo
- **Browser moderno**: Chrome, Firefox, Safari, Edge recentes
- **Limitações**: Não deteta VRAM ou CUDA version (só indica se é NVIDIA)
- **Servidor**: Backend precisa implementar suporte MLX/CUDA

## 🐛 Debugging

Se GPU não for detetada:
1. Verificar WebGL: `chrome://gpu`
2. Verificar permissões do browser
3. Ver console: `detectGPU()` manual

Se backend errado for recomendado:
1. Verificar `systemInfo.platform`
2. Verificar `gpuInfo.isNvidia` ou `isAppleSilicon`
3. Logs na consola mostram toda a deteção
