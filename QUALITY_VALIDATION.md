# Sistema de Validação de Qualidade de Legendas

Sistema automático de detecção e correção de problemas comuns em legendas traduzidas.

## Funcionalidades

### 1. Validação Automática

O sistema valida automaticamente as legendas traduzidas e detecta:

- **Tempos longos** (>10s): Legendas que permanecem muito tempo no ecrã
- **Linhas muito longas** (>42 chars): Texto que não cabe confortavelmente no ecrã
- **Pausas excessivas** (>20s): Gaps muito longos entre legendas consecutivas
- **CPS alto** (>20 chars/s): Texto que passa rápido demais para ser lido
- **Legendas vazias**: Entradas sem texto

### 2. Categorização por Severidade

Cada problema é classificado em:

- **Error** (🔴): Problemas críticos que devem ser corrigidos
- **Warning** (🟡): Problemas que podem afetar a qualidade
- **Info** (🔵): Sugestões de melhoria

### 3. Editor Inline

Interface para corrigir problemas diretamente:

- Edição inline de legendas problemáticas
- Sugestões automáticas de correção
- Preview em tempo real
- Download de legendas corrigidas

## Uso

### Frontend (TranslationPanel)

O sistema é ativado automaticamente após a conclusão da tradução:

```typescript
// Após tradução completar
validateTranslation(jobId);

// Mostra componente de qualidade
{validationResults && (
  <SubtitleQualityCheck
    validation={validationResults}
    onFixProblem={handleFixProblem}
    onDownloadCorrected={downloadCorrectedSubtitles}
  />
)}
```

### Backend API

**Endpoint:** `POST /validate-subtitles`

**Request:**
```bash
curl -X POST http://localhost:5001/validate-subtitles \
  -F "subtitle=@legendas.srt"
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "total_entries": 1524,
    "has_problems": true,
    "stats": {
      "long_durations": 4,
      "long_lines": 12,
      "long_pauses": 2,
      "high_cps": 3,
      "empty": 1
    },
    "problems": [
      {
        "index": 456,
        "type": "long_duration",
        "severity": "error",
        "message": "Duração muito longa: 14.2s",
        "timecode": "00:09:08,821 --> 00:09:22,740",
        "text": "Texto da legenda...",
        "suggestion": "Dividir em 2+ legendas ou verificar se está correto"
      }
    ]
  }
}
```

## Regras de Validação

### 1. Duração de Legendas

| Duração | Severidade | Ação |
|---------|-----------|------|
| ≤10s | ✅ OK | - |
| 10-15s | 🟡 Warning | Considere dividir |
| >15s | 🔴 Error | Divida em múltiplas legendas |

### 2. Comprimento de Linhas

| Caracteres | Severidade | Ação |
|-----------|-----------|------|
| ≤42 chars | ✅ OK | - |
| >42 chars | 🟡 Warning | Quebre em ponto natural |

### 3. Pausas Entre Legendas

| Pausa | Severidade | Ação |
|-------|-----------|------|
| ≤20s | ✅ OK | - |
| 20-60s | 🟡 Warning | Verifique se está correto |
| >60s | 🔴 Error | Pode haver legendas em falta |

### 4. CPS (Characters Per Second)

| CPS | Severidade | Ação |
|-----|-----------|------|
| ≤20 | ✅ OK | - |
| >20 | 🟡 Warning | Simplifique ou aumente duração |

### 5. Legendas Vazias

| Estado | Severidade | Ação |
|--------|-----------|------|
| Com texto | ✅ OK | - |
| Vazia | 🔴 Error | Remova ou adicione texto |

## Interface do Utilizador

### Visualização de Problemas

```
┌─────────────────────────────────────────┐
│ Verificação de Qualidade                │
│ 1524 legendas analisadas                │
│                                    [❌ 22 problema(s)] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Estatísticas:                           │
│  4   Tempos longos                      │
│ 12   Linhas longas                      │
│  2   Pausas longas                      │
│  3   CPS alto                           │
│  1   Vazias                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔴 #456  00:09:08,821 --> 00:09:22,740 │
│ Duração muito longa: 14.2s              │
│ 💡 Dividir em 2+ legendas               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Texto da legenda aqui...            │ │
│ └─────────────────────────────────────┘ │
│                         [Editar]        │
└─────────────────────────────────────────┘

[Descarregar Legendas Corrigidas]
```

## Workflow do Utilizador

1. **Traduzir legendas** (ES→PT-PT)
2. **Validação automática** ao completar
3. **Relatório mostra:**
   - 5 linhas muito longas
   - 4 tempos muito longos
   - 2 pausas excessivas
4. **Editar inline** os problemas
5. **Download corrigido** com fixes aplicados
6. ✅ Legendas de qualidade!

## Exemplos

### Exemplo 1: Tempo Longo

**Problema detectado:**
```
00:09:08,821 --> 00:09:22,740  (14 segundos!)
Texto muito longo que fica no ecrã por muito tempo
```

**Sugestão:**
Dividir em 2 legendas:
```
00:09:08,821 --> 00:09:15,000
Texto muito longo que fica
no ecrã por muito tempo

00:09:15,001 --> 00:09:22,740
(continuação ou dividir de outra forma)
```

### Exemplo 2: Linha Longa

**Problema detectado:**
```
Todos os índices correlacionados com o arrendamento trimestral estimado
```
(56 caracteres - muito longo!)

**Sugestão:**
```
Todos os índices correlacionados
com o arrendamento trimestral estimado
```

### Exemplo 3: Pausa Excessiva

**Problema detectado:**
```
1423: 01:44:17,870 --> 01:44:25,820
Primeira legenda

1424: 01:44:48,330 --> 01:44:55,580  (23s de pausa!)
Segunda legenda
```

**Sugestão:**
Verificar se há diálogo em falta ou se a pausa é intencional.

## Integração

### Em TranslationPanel.tsx

```typescript
// Estado
const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
const [correctedSubtitles, setCorrectedSubtitles] = useState<Map<number, string>>(new Map());

// Após tradução
const validateTranslation = async (jobId: string) => {
  const response = await fetch(`${API_BASE}/translate-download/${jobId}`);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append('subtitle', blob);

  const validationResponse = await fetch(`${API_BASE}/validate-subtitles`, {
    method: 'POST',
    body: formData
  });

  const { validation } = await validationResponse.json();
  setValidationResults(validation);
};

// Correções
const handleFixProblem = (index: number, newText: string) => {
  const updated = new Map(correctedSubtitles);
  updated.set(index, newText);
  setCorrectedSubtitles(updated);
};

// Download com correções
const downloadCorrectedSubtitles = () => {
  // Aplica correções ao SRT original
  // Download do arquivo corrigido
};
```

## Testes

Execute o script de teste:

```bash
cd /Users/f.nuno/projetos/subtitle-translator
python test_validation.py
```

Testa todos os tipos de problemas:
- ✅ Tempos longos
- ✅ Linhas longas
- ✅ Pausas excessivas
- ✅ CPS alto
- ✅ Legendas vazias

## Limitações

- Mostra apenas os primeiros 20 problemas (para evitar sobrecarga)
- Validação é baseada em regras simples (não usa IA)
- Sugestões são genéricas (não específicas ao contexto)

## Melhorias Futuras

1. **Auto-fix inteligente**: IA para sugerir correções específicas
2. **Validação semântica**: Verificar se tradução faz sentido
3. **Detecção de erros de formatação**: Tags HTML, caracteres especiais
4. **Comparação com original**: Verificar se informação foi preservada
5. **Métricas de legibilidade**: Flesch-Kincaid, etc.

## Arquivos Relacionados

**Backend:**
- `/Users/f.nuno/projetos/subtitle-translator/src/scriptum_api/utils/subtitle_validator.py`
- `/Users/f.nuno/projetos/subtitle-translator/src/scriptum_api/routes/translation.py` (endpoint)

**Frontend:**
- `/Users/f.nuno/projetos/scriptum-v2.5/src/components/SubtitleQualityCheck.tsx`
- `/Users/f.nuno/projetos/scriptum-v2.5/src/components/panels/TranslationPanel.tsx`

**Testes:**
- `/Users/f.nuno/projetos/subtitle-translator/test_validation.py`
