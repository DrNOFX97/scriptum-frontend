interface LanguageInfo {
  name: string;
  flag: string;
  variant?: string;
}

// Mapeamento de códigos ISO 639-1 (2 letras) e ISO 639-2 (3 letras)
const languageMap: Record<string, LanguageInfo> = {
  // Inglês
  'en': { name: 'Inglês', flag: '🇬🇧' },
  'eng': { name: 'Inglês', flag: '🇬🇧' },
  'en-US': { name: 'Inglês', flag: '🇺🇸', variant: 'EUA' },
  'en-GB': { name: 'Inglês', flag: '🇬🇧', variant: 'Reino Unido' },
  'en-AU': { name: 'Inglês', flag: '🇦🇺', variant: 'Austrália' },
  'en-CA': { name: 'Inglês', flag: '🇨🇦', variant: 'Canadá' },

  // Português
  'pt': { name: 'Português', flag: '🇵🇹' },
  'por': { name: 'Português', flag: '🇵🇹' },
  'pt-BR': { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },
  'pt-PT': { name: 'Português', flag: '🇵🇹', variant: 'Portugal' },
  'pb': { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },
  'pob': { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },

  // Espanhol
  'es': { name: 'Espanhol', flag: '🇪🇸' },
  'spa': { name: 'Espanhol', flag: '🇪🇸' },
  'es-ES': { name: 'Espanhol', flag: '🇪🇸', variant: 'Espanha' },
  'es-MX': { name: 'Espanhol', flag: '🇲🇽', variant: 'México' },
  'es-AR': { name: 'Espanhol', flag: '🇦🇷', variant: 'Argentina' },
  'es-419': { name: 'Espanhol', flag: '🌎', variant: 'América Latina' },

  // Francês
  'fr': { name: 'Francês', flag: '🇫🇷' },
  'fre': { name: 'Francês', flag: '🇫🇷' },
  'fra': { name: 'Francês', flag: '🇫🇷' },
  'fr-FR': { name: 'Francês', flag: '🇫🇷', variant: 'França' },
  'fr-CA': { name: 'Francês', flag: '🇨🇦', variant: 'Canadá' },

  // Alemão
  'de': { name: 'Alemão', flag: '🇩🇪' },
  'ger': { name: 'Alemão', flag: '🇩🇪' },
  'deu': { name: 'Alemão', flag: '🇩🇪' },

  // Italiano
  'it': { name: 'Italiano', flag: '🇮🇹' },
  'ita': { name: 'Italiano', flag: '🇮🇹' },

  // Russo
  'ru': { name: 'Russo', flag: '🇷🇺' },
  'rus': { name: 'Russo', flag: '🇷🇺' },

  // Chinês
  'zh': { name: 'Chinês', flag: '🇨🇳' },
  'chi': { name: 'Chinês', flag: '🇨🇳' },
  'zho': { name: 'Chinês', flag: '🇨🇳' },
  'zh-CN': { name: 'Chinês', flag: '🇨🇳', variant: 'Simplificado' },
  'zh-TW': { name: 'Chinês', flag: '🇹🇼', variant: 'Tradicional' },
  'zh-HK': { name: 'Chinês', flag: '🇭🇰', variant: 'Hong Kong' },

  // Japonês
  'ja': { name: 'Japonês', flag: '🇯🇵' },
  'jpn': { name: 'Japonês', flag: '🇯🇵' },

  // Árabe
  'ar': { name: 'Árabe', flag: '🇸🇦' },
  'ara': { name: 'Árabe', flag: '🇸🇦' },

  // Outros idiomas comuns
  'ko': { name: 'Coreano', flag: '🇰🇷' },
  'kor': { name: 'Coreano', flag: '🇰🇷' },
  'nl': { name: 'Holandês', flag: '🇳🇱' },
  'dut': { name: 'Holandês', flag: '🇳🇱' },
  'nld': { name: 'Holandês', flag: '🇳🇱' },
  'sv': { name: 'Sueco', flag: '🇸🇪' },
  'swe': { name: 'Sueco', flag: '🇸🇪' },
  'no': { name: 'Norueguês', flag: '🇳🇴' },
  'nor': { name: 'Norueguês', flag: '🇳🇴' },
  'da': { name: 'Dinamarquês', flag: '🇩🇰' },
  'dan': { name: 'Dinamarquês', flag: '🇩🇰' },
  'fi': { name: 'Finlandês', flag: '🇫🇮' },
  'fin': { name: 'Finlandês', flag: '🇫🇮' },
  'pl': { name: 'Polaco', flag: '🇵🇱' },
  'pol': { name: 'Polaco', flag: '🇵🇱' },
  'tr': { name: 'Turco', flag: '🇹🇷' },
  'tur': { name: 'Turco', flag: '🇹🇷' },
  'he': { name: 'Hebraico', flag: '🇮🇱' },
  'heb': { name: 'Hebraico', flag: '🇮🇱' },
  'hi': { name: 'Hindi', flag: '🇮🇳' },
  'hin': { name: 'Hindi', flag: '🇮🇳' },
};

interface SubtitleInfo {
  displayName: string;
  flag: string;
  isSDH: boolean;
  isForced: boolean;
  isCC: boolean;
  variant?: string;
  originalCode: string;
}

export function parseSubtitleLanguage(languageCode: string): SubtitleInfo {
  // Normalizar o código
  const normalizedCode = languageCode.toLowerCase().trim();

  // Detectar legendas especiais
  const isSDH = /sdh|deaf|hard.?of.?hearing/i.test(languageCode);
  const isForced = /forced|signs?.?only/i.test(languageCode);
  const isCC = /cc|closed.?caption/i.test(languageCode);

  // Detectar variantes regionais nos títulos
  const isBrazilian = /brazil(ian)?|brasil/i.test(languageCode);
  const isPortugal = /portugal|european.*port/i.test(languageCode);
  const isLatinAmerican = /latin.?american|latam|419/i.test(languageCode);
  const isSpanish = /spain|castilian|european.*spa/i.test(languageCode);
  const isUS = /\b(us|usa|american)\b/i.test(languageCode);
  const isUK = /\b(uk|british|gb)\b/i.test(languageCode);
  const isCanadian = /canad(a|ian)/i.test(languageCode);
  const isSimplified = /simplified|简|cn/i.test(languageCode);
  const isTraditional = /traditional|繁|tw|hk/i.test(languageCode);

  // Extrair código de idioma base (remover sufixos e títulos)
  let cleanCode = normalizedCode
    .replace(/[\s\-_]*(sdh|deaf|hard.?of.?hearing|forced|signs?.?only|cc|closed.?caption)[\s\-_]*/gi, '')
    .replace(/[\s\-_]*(brazil(ian)?|brasil|portugal|latin.?american|latam|european|american|british|canadian|simplified|traditional)[\s\-_]*/gi, '')
    .trim();

  // Tentar encontrar no mapa com código completo primeiro
  let langInfo = languageMap[cleanCode];

  // Se não encontrar, tentar com apenas os primeiros 2 caracteres
  if (!langInfo) {
    const shortCode = cleanCode.substring(0, 2);
    langInfo = languageMap[shortCode];
  }

  // Se ainda não encontrar, tentar código de 3 letras
  if (!langInfo) {
    const code3 = cleanCode.substring(0, 3);
    langInfo = languageMap[code3];
  }

  // Ajustar baseado em variantes detectadas nos títulos
  if (langInfo) {
    const baseName = langInfo.name;

    if (baseName === 'Português') {
      if (isBrazilian) {
        langInfo = { name: 'Português', flag: '🇧🇷', variant: 'Brasil' };
      } else if (isPortugal) {
        langInfo = { name: 'Português', flag: '🇵🇹', variant: 'Portugal' };
      }
    } else if (baseName === 'Espanhol') {
      if (isLatinAmerican) {
        langInfo = { name: 'Espanhol', flag: '🌎', variant: 'América Latina' };
      } else if (isSpanish) {
        langInfo = { name: 'Espanhol', flag: '🇪🇸', variant: 'Espanha' };
      }
    } else if (baseName === 'Inglês') {
      if (isUS) {
        langInfo = { name: 'Inglês', flag: '🇺🇸', variant: 'EUA' };
      } else if (isUK) {
        langInfo = { name: 'Inglês', flag: '🇬🇧', variant: 'Reino Unido' };
      } else if (isCanadian) {
        langInfo = { name: 'Inglês', flag: '🇨🇦', variant: 'Canadá' };
      }
    } else if (baseName === 'Chinês') {
      if (isSimplified) {
        langInfo = { name: 'Chinês', flag: '🇨🇳', variant: 'Simplificado' };
      } else if (isTraditional) {
        langInfo = { name: 'Chinês', flag: '🇹🇼', variant: 'Tradicional' };
      }
    } else if (baseName === 'Francês') {
      if (isCanadian) {
        langInfo = { name: 'Francês', flag: '🇨🇦', variant: 'Canadá' };
      }
    }
  }

  // Fallback para código desconhecido
  if (!langInfo) {
    langInfo = { name: languageCode, flag: '🌐' };
  }

  // Construir nome de exibição
  let displayName = langInfo.name;
  if (langInfo.variant) {
    displayName += ` (${langInfo.variant})`;
  }

  return {
    displayName,
    flag: langInfo.flag,
    isSDH,
    isForced,
    isCC,
    variant: langInfo.variant,
    originalCode: languageCode,
  };
}

export function getSubtitleBadges(info: SubtitleInfo): string[] {
  const badges: string[] = [];

  if (info.isSDH) badges.push('SDH');
  if (info.isForced) badges.push('Forçada');
  if (info.isCC) badges.push('CC');

  return badges;
}
