interface LanguageInfo {
  name: string;
  flag: string;
  variant?: string;
}

// ISO 639-1 (2 letras), ISO 639-2/B e ISO 639-2/T (3 letras)
const languageMap: Record<string, LanguageInfo> = {
  // ── Inglês ──
  'en':    { name: 'Inglês', flag: '🇬🇧' },
  'eng':   { name: 'Inglês', flag: '🇬🇧' },
  'en-US': { name: 'Inglês', flag: '🇺🇸', variant: 'EUA' },
  'en-GB': { name: 'Inglês', flag: '🇬🇧', variant: 'Reino Unido' },
  'en-AU': { name: 'Inglês', flag: '🇦🇺', variant: 'Austrália' },
  'en-CA': { name: 'Inglês', flag: '🇨🇦', variant: 'Canadá' },

  // ── Português ──
  'pt':    { name: 'Português', flag: '🇵🇹' },
  'por':   { name: 'Português', flag: '🇵🇹' },
  'pt-BR': { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },
  'pt-PT': { name: 'Português', flag: '🇵🇹', variant: 'Portugal' },
  'pb':    { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },
  'pob':   { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },
  'ptb':   { name: 'Português', flag: '🇧🇷', variant: 'Brasil' },

  // ── Espanhol ──
  'es':    { name: 'Espanhol', flag: '🇪🇸' },
  'spa':   { name: 'Espanhol', flag: '🇪🇸' },
  'es-ES': { name: 'Espanhol', flag: '🇪🇸', variant: 'Espanha' },
  'es-MX': { name: 'Espanhol', flag: '🇲🇽', variant: 'México' },
  'es-AR': { name: 'Espanhol', flag: '🇦🇷', variant: 'Argentina' },
  'es-419':{ name: 'Espanhol', flag: '🌎', variant: 'América Latina' },

  // ── Francês ──
  'fr':    { name: 'Francês', flag: '🇫🇷' },
  'fre':   { name: 'Francês', flag: '🇫🇷' },
  'fra':   { name: 'Francês', flag: '🇫🇷' },
  'fr-FR': { name: 'Francês', flag: '🇫🇷', variant: 'França' },
  'fr-CA': { name: 'Francês', flag: '🇨🇦', variant: 'Canadá' },
  'fr-BE': { name: 'Francês', flag: '🇧🇪', variant: 'Bélgica' },

  // ── Alemão ──
  'de':    { name: 'Alemão', flag: '🇩🇪' },
  'ger':   { name: 'Alemão', flag: '🇩🇪' },
  'deu':   { name: 'Alemão', flag: '🇩🇪' },
  'de-AT': { name: 'Alemão', flag: '🇦🇹', variant: 'Áustria' },
  'de-CH': { name: 'Alemão', flag: '🇨🇭', variant: 'Suíça' },

  // ── Italiano ──
  'it':    { name: 'Italiano', flag: '🇮🇹' },
  'ita':   { name: 'Italiano', flag: '🇮🇹' },

  // ── Russo ──
  'ru':    { name: 'Russo', flag: '🇷🇺' },
  'rus':   { name: 'Russo', flag: '🇷🇺' },

  // ── Chinês ──
  'zh':    { name: 'Chinês', flag: '🇨🇳' },
  'chi':   { name: 'Chinês', flag: '🇨🇳' },
  'zho':   { name: 'Chinês', flag: '🇨🇳' },
  'zh-CN': { name: 'Chinês', flag: '🇨🇳', variant: 'Simplificado' },
  'zh-TW': { name: 'Chinês', flag: '🇹🇼', variant: 'Tradicional' },
  'zh-HK': { name: 'Chinês', flag: '🇭🇰', variant: 'Hong Kong' },
  'zhs':   { name: 'Chinês', flag: '🇨🇳', variant: 'Simplificado' },
  'zht':   { name: 'Chinês', flag: '🇹🇼', variant: 'Tradicional' },

  // ── Japonês ──
  'ja':    { name: 'Japonês', flag: '🇯🇵' },
  'jpn':   { name: 'Japonês', flag: '🇯🇵' },

  // ── Árabe ──
  'ar':    { name: 'Árabe', flag: '🇸🇦' },
  'ara':   { name: 'Árabe', flag: '🇸🇦' },

  // ── Coreano ──
  'ko':    { name: 'Coreano', flag: '🇰🇷' },
  'kor':   { name: 'Coreano', flag: '🇰🇷' },

  // ── Holandês ──
  'nl':    { name: 'Holandês', flag: '🇳🇱' },
  'dut':   { name: 'Holandês', flag: '🇳🇱' },
  'nld':   { name: 'Holandês', flag: '🇳🇱' },
  'nl-BE': { name: 'Holandês', flag: '🇧🇪', variant: 'Bélgica' },

  // ── Sueco ──
  'sv':    { name: 'Sueco', flag: '🇸🇪' },
  'swe':   { name: 'Sueco', flag: '🇸🇪' },

  // ── Norueguês ──
  'no':    { name: 'Norueguês', flag: '🇳🇴' },
  'nor':   { name: 'Norueguês', flag: '🇳🇴' },
  'nob':   { name: 'Norueguês', flag: '🇳🇴', variant: 'Bokmål' },
  'nno':   { name: 'Norueguês', flag: '🇳🇴', variant: 'Nynorsk' },
  'nb':    { name: 'Norueguês', flag: '🇳🇴', variant: 'Bokmål' },
  'nn':    { name: 'Norueguês', flag: '🇳🇴', variant: 'Nynorsk' },

  // ── Dinamarquês ──
  'da':    { name: 'Dinamarquês', flag: '🇩🇰' },
  'dan':   { name: 'Dinamarquês', flag: '🇩🇰' },

  // ── Finlandês ──
  'fi':    { name: 'Finlandês', flag: '🇫🇮' },
  'fin':   { name: 'Finlandês', flag: '🇫🇮' },

  // ── Polaco ──
  'pl':    { name: 'Polaco', flag: '🇵🇱' },
  'pol':   { name: 'Polaco', flag: '🇵🇱' },

  // ── Turco ──
  'tr':    { name: 'Turco', flag: '🇹🇷' },
  'tur':   { name: 'Turco', flag: '🇹🇷' },

  // ── Hebraico ──
  'he':    { name: 'Hebraico', flag: '🇮🇱' },
  'heb':   { name: 'Hebraico', flag: '🇮🇱' },
  'iw':    { name: 'Hebraico', flag: '🇮🇱' },

  // ── Hindi ──
  'hi':    { name: 'Hindi', flag: '🇮🇳' },
  'hin':   { name: 'Hindi', flag: '🇮🇳' },

  // ── Búlgaro ──
  'bg':    { name: 'Búlgaro', flag: '🇧🇬' },
  'bul':   { name: 'Búlgaro', flag: '🇧🇬' },

  // ── Checo ──
  'cs':    { name: 'Checo', flag: '🇨🇿' },
  'cze':   { name: 'Checo', flag: '🇨🇿' },
  'ces':   { name: 'Checo', flag: '🇨🇿' },

  // ── Estoniano ──
  'et':    { name: 'Estoniano', flag: '🇪🇪' },
  'est':   { name: 'Estoniano', flag: '🇪🇪' },

  // ── Grego ──
  'el':    { name: 'Grego', flag: '🇬🇷' },
  'gre':   { name: 'Grego', flag: '🇬🇷' },
  'ell':   { name: 'Grego', flag: '🇬🇷' },

  // ── Croata ──
  'hr':    { name: 'Croata', flag: '🇭🇷' },
  'hrv':   { name: 'Croata', flag: '🇭🇷' },

  // ── Húngaro ──
  'hu':    { name: 'Húngaro', flag: '🇭🇺' },
  'hun':   { name: 'Húngaro', flag: '🇭🇺' },

  // ── Indonésio ──
  'id':    { name: 'Indonésio', flag: '🇮🇩' },
  'ind':   { name: 'Indonésio', flag: '🇮🇩' },

  // ── Lituano ──
  'lt':    { name: 'Lituano', flag: '🇱🇹' },
  'lit':   { name: 'Lituano', flag: '🇱🇹' },

  // ── Letão ──
  'lv':    { name: 'Letão', flag: '🇱🇻' },
  'lav':   { name: 'Letão', flag: '🇱🇻' },

  // ── Macedónio ──
  'mk':    { name: 'Macedónio', flag: '🇲🇰' },
  'mac':   { name: 'Macedónio', flag: '🇲🇰' },
  'mkd':   { name: 'Macedónio', flag: '🇲🇰' },

  // ── Romeno ──
  'ro':    { name: 'Romeno', flag: '🇷🇴' },
  'rum':   { name: 'Romeno', flag: '🇷🇴' },
  'ron':   { name: 'Romeno', flag: '🇷🇴' },

  // ── Eslovaco ──
  'sk':    { name: 'Eslovaco', flag: '🇸🇰' },
  'slo':   { name: 'Eslovaco', flag: '🇸🇰' },
  'slk':   { name: 'Eslovaco', flag: '🇸🇰' },

  // ── Esloveno ──
  'sl':    { name: 'Esloveno', flag: '🇸🇮' },
  'slv':   { name: 'Esloveno', flag: '🇸🇮' },

  // ── Sérvio ──
  'sr':    { name: 'Sérvio', flag: '🇷🇸' },
  'srp':   { name: 'Sérvio', flag: '🇷🇸' },
  'sr-Latn': { name: 'Sérvio', flag: '🇷🇸', variant: 'Latino' },
  'sr-Cyrl': { name: 'Sérvio', flag: '🇷🇸', variant: 'Cirílico' },

  // ── Tailandês ──
  'th':    { name: 'Tailandês', flag: '🇹🇭' },
  'tha':   { name: 'Tailandês', flag: '🇹🇭' },

  // ── Malaio ──
  'ms':    { name: 'Malaio', flag: '🇲🇾' },
  'may':   { name: 'Malaio', flag: '🇲🇾' },
  'msa':   { name: 'Malaio', flag: '🇲🇾' },

  // ── Ucraniano ──
  'uk':    { name: 'Ucraniano', flag: '🇺🇦' },
  'ukr':   { name: 'Ucraniano', flag: '🇺🇦' },

  // ── Vietnamita ──
  'vi':    { name: 'Vietnamita', flag: '🇻🇳' },
  'vie':   { name: 'Vietnamita', flag: '🇻🇳' },

  // ── Catalão ──
  'ca':    { name: 'Catalão', flag: '🇪🇸' },
  'cat':   { name: 'Catalão', flag: '🇪🇸' },

  // ── Romanche ──
  'ro-MD': { name: 'Romeno', flag: '🇲🇩', variant: 'Moldávia' },

  // ── Tamil ──
  'ta':    { name: 'Tamil', flag: '🇮🇳' },
  'tam':   { name: 'Tamil', flag: '🇮🇳' },

  // ── Telugu ──
  'te':    { name: 'Telugu', flag: '🇮🇳' },
  'tel':   { name: 'Telugu', flag: '🇮🇳' },

  // ── Bengali ──
  'bn':    { name: 'Bengali', flag: '🇧🇩' },
  'ben':   { name: 'Bengali', flag: '🇧🇩' },
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
  const raw = languageCode.trim();

  // ── Marcadores especiais (testados no raw completo) ──
  const isSDH    = /sdh|deaf|hard.?of.?hearing/i.test(raw);
  const isForced = /forced|signs?.?only/i.test(raw);
  const isCC     = /\bcc\b|closed.?caption/i.test(raw);

  // ── Extrair código de idioma ──
  // O input pode ser "eng", "pt-BR", "eng English #1", "por Portuguese (Brazil)", etc.
  // Quando há espaço, a primeira palavra (2-4 chars) é sempre o código ISO.
  const tokens = raw.split(/\s+/);
  const firstToken = tokens[0].toLowerCase();
  const isCodePrefix = /^[a-z]{2,4}(-[a-z]{2})?$/i.test(firstToken);

  // cleanCode = só o código ISO (sem o texto do título)
  let cleanCode = isCodePrefix ? firstToken : raw.toLowerCase();

  // normalizar variante: pt-br → pt-BR
  if (cleanCode.includes('-')) {
    const [base, region] = cleanCode.split('-');
    cleanCode = `${base}-${region.toUpperCase()}`;
  }

  // Texto completo para detetar variantes (inclui título como "Portuguese (Brazil)")
  const fullText = raw;

  // ── Variantes regionais (detetadas no texto completo) ──
  const isBrazilian    = /brazil(ian)?|brasil/i.test(fullText);
  const isPortugal     = /\bportugal\b|european.*port/i.test(fullText);
  const isLatinAmerican= /latin.?am(erica)?|latam|\b419\b/i.test(fullText);
  const isSpain        = /\bspain\b|castilian|european.*spa/i.test(fullText);
  const isUS           = /\b(us|usa|american)\b/i.test(fullText);
  const isUK           = /\b(uk|british|gb)\b/i.test(fullText);
  const isCanadian     = /canad(a|ian)/i.test(fullText);
  const isSimplified   = /simplified|简体|简|\bcn\b/i.test(fullText);
  const isTraditional  = /traditional|繁體|繁|\btw\b|\bhk\b/i.test(fullText);
  const isBokmaal      = /bokm[aå]l|\bnb\b/i.test(fullText);
  const isNynorsk      = /nynorsk|\bnn\b/i.test(fullText);

  // ── Lookup ──
  let langInfo = languageMap[cleanCode];

  // Tentar sem região (pt-BR → pt)
  if (!langInfo && cleanCode.includes('-')) {
    langInfo = languageMap[cleanCode.split('-')[0]];
  }

  // ── Ajuste de variante ──
  if (langInfo) {
    const base = langInfo.name;
    if (base === 'Português') {
      if (isBrazilian)        langInfo = { name: 'Português', flag: '🇧🇷', variant: 'Brasil' };
      else if (isPortugal)    langInfo = { name: 'Português', flag: '🇵🇹', variant: 'Portugal' };
    } else if (base === 'Espanhol') {
      if (isLatinAmerican)    langInfo = { name: 'Espanhol', flag: '🌎', variant: 'América Latina' };
      else if (isSpain)       langInfo = { name: 'Espanhol', flag: '🇪🇸', variant: 'Espanha' };
    } else if (base === 'Inglês') {
      if (isUS)               langInfo = { name: 'Inglês', flag: '🇺🇸', variant: 'EUA' };
      else if (isUK)          langInfo = { name: 'Inglês', flag: '🇬🇧', variant: 'Reino Unido' };
      else if (isCanadian)    langInfo = { name: 'Inglês', flag: '🇨🇦', variant: 'Canadá' };
    } else if (base === 'Chinês') {
      if (isSimplified)       langInfo = { name: 'Chinês', flag: '🇨🇳', variant: 'Simplificado' };
      else if (isTraditional) langInfo = { name: 'Chinês', flag: '🇹🇼', variant: 'Tradicional' };
    } else if (base === 'Francês') {
      if (isCanadian)         langInfo = { name: 'Francês', flag: '🇨🇦', variant: 'Canadá' };
    } else if (base === 'Norueguês') {
      if (isBokmaal)          langInfo = { name: 'Norueguês', flag: '🇳🇴', variant: 'Bokmål' };
      else if (isNynorsk)     langInfo = { name: 'Norueguês', flag: '🇳🇴', variant: 'Nynorsk' };
    }
  }

  // ── Fallback ──
  if (!langInfo) {
    langInfo = { name: cleanCode.toUpperCase(), flag: '🌐' };
  }

  // ── Nome de exibição ──
  // Se o título original contém numeração (#1, #2, etc.), inclui-a
  const numSuffix = fullText.match(/#\s*\d+/)?.[0] ?? '';
  let displayName = langInfo.variant
    ? `${langInfo.name} (${langInfo.variant})`
    : langInfo.name;
  if (numSuffix) displayName += ` ${numSuffix}`;

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

/**
 * Common language display names for UI selects (BCP-47 → Portuguese name).
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  'pt-PT': 'Português (Portugal)',
  'pt-BR': 'Português (Brasil)',
  'en':    'Inglês',
  'es':    'Espanhol',
  'it':    'Italiano',
  'fr':    'Francês',
  'de':    'Alemão',
};

/**
 * Subtitle search fallback order by language (for subtitle search with automatic fallback).
 * When no results are found in the requested language, try these in order.
 */
export const LANGUAGE_FALLBACK: Record<string, string[]> = {
  'pt-PT': ['pt-BR', 'es', 'it', 'fr', 'en'],
  'pt-BR': ['pt-PT', 'es', 'it', 'fr', 'en'],
  'es':    ['pt-PT', 'pt-BR', 'it', 'fr', 'en'],
  'it':    ['es', 'pt-PT', 'pt-BR', 'fr', 'en'],
  'fr':    ['es', 'it', 'pt-PT', 'pt-BR', 'en'],
  'en':    ['es', 'pt-PT', 'pt-BR', 'fr', 'it'],
  'de':    ['en', 'fr', 'es'],
};

export function getSubtitleBadges(info: SubtitleInfo): string[] {
  const badges: string[] = [];
  if (info.isSDH)    badges.push('SDH');
  if (info.isForced) badges.push('Forçada');
  if (info.isCC)     badges.push('CC');
  return badges;
}

/**
 * Converte qualquer código de idioma para BCP 47 (para HTML5 <track>).
 */
export function toISO6391(languageCode: string): string {
  const parts = languageCode.trim().split('-');
  const baseLang = parts[0].toLowerCase();
  const region   = parts[1]?.toUpperCase();

  const iso6392to1: Record<string, string> = {
    'eng': 'en', 'por': 'pt', 'spa': 'es', 'fre': 'fr', 'fra': 'fr',
    'ger': 'de', 'deu': 'de', 'ita': 'it', 'rus': 'ru', 'chi': 'zh',
    'zho': 'zh', 'jpn': 'ja', 'ara': 'ar', 'kor': 'ko', 'dut': 'nl',
    'nld': 'nl', 'swe': 'sv', 'nor': 'no', 'nob': 'nb', 'nno': 'nn',
    'dan': 'da', 'fin': 'fi', 'pol': 'pl', 'tur': 'tr', 'heb': 'he',
    'hin': 'hi', 'pob': 'pt', 'pb':  'pt', 'ptb': 'pt',
    'bul': 'bg', 'cze': 'cs', 'ces': 'cs', 'est': 'et',
    'gre': 'el', 'ell': 'el', 'hrv': 'hr', 'hun': 'hu', 'ind': 'id',
    'lit': 'lt', 'lav': 'lv', 'mac': 'mk', 'mkd': 'mk',
    'rum': 'ro', 'ron': 'ro', 'slo': 'sk', 'slk': 'sk',
    'slv': 'sl', 'srp': 'sr', 'tha': 'th', 'may': 'ms', 'msa': 'ms',
    'ukr': 'uk', 'vie': 'vi', 'cat': 'ca', 'tam': 'ta', 'tel': 'te',
    'ben': 'bn',
  };

  const converted = iso6392to1[baseLang] || (baseLang.length === 2 ? baseLang : 'und');

  if (region && region.length === 2) {
    return `${converted}-${region}`;
  }
  return converted;
}
