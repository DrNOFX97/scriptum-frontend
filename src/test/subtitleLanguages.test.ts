import { describe, it, expect } from "vitest";
import { parseSubtitleLanguage, toISO6391 } from "@/lib/subtitleLanguages";

describe("parseSubtitleLanguage", () => {
  // --- Códigos simples ---
  it("por → Português", () => {
    const r = parseSubtitleLanguage("por");
    expect(r.flag).toBe("🇵🇹");
    expect(r.displayName).toBe("Português");
  });

  it("eng → Inglês", () => {
    const r = parseSubtitleLanguage("eng");
    expect(r.flag).toBe("🇬🇧");
    expect(r.displayName).toBe("Inglês");
  });

  it("spa → Espanhol", () => {
    const r = parseSubtitleLanguage("spa");
    expect(r.flag).toBe("🇪🇸");
    expect(r.displayName).toBe("Espanhol");
  });

  // --- Bug anterior: substring(0,2) convertia est→es (Espanhol) ---
  it("est → Estoniano (não Espanhol)", () => {
    const r = parseSubtitleLanguage("est");
    expect(r.flag).toBe("🇪🇪");
    expect(r.displayName).toBe("Estoniano");
  });

  // --- Bug anterior: rum→ru (Russo) ---
  it("rum → Romeno (não Russo)", () => {
    const r = parseSubtitleLanguage("rum");
    expect(r.flag).toBe("🇷🇴");
    expect(r.displayName).toBe("Romeno");
  });

  it("lav → Letão", () => {
    const r = parseSubtitleLanguage("lav");
    expect(r.flag).toBe("🇱🇻");
    expect(r.displayName).toBe("Letão");
  });

  // --- Input combinado "code title" (formato ffmpeg extraído) ---
  it('"eng English #1" → 🇬🇧 Inglês #1', () => {
    const r = parseSubtitleLanguage("eng English #1");
    expect(r.flag).toBe("🇬🇧");
    expect(r.displayName).toBe("Inglês #1");
  });

  it('"eng English #2" → 🇬🇧 Inglês #2', () => {
    const r = parseSubtitleLanguage("eng English #2");
    expect(r.flag).toBe("🇬🇧");
    expect(r.displayName).toBe("Inglês #2");
  });

  it('"por Portuguese (Brazil)" → 🇧🇷 Português (Brasil)', () => {
    const r = parseSubtitleLanguage("por Portuguese (Brazil)");
    expect(r.flag).toBe("🇧🇷");
    expect(r.displayName).toBe("Português (Brasil)");
  });

  it('"por Portuguese (Portugal)" → 🇵🇹 Português (Portugal)', () => {
    const r = parseSubtitleLanguage("por Portuguese (Portugal)");
    expect(r.flag).toBe("🇵🇹");
    expect(r.displayName).toBe("Português (Portugal)");
  });

  it('"spa Spanish (Latin America)" → 🌎 Espanhol (América Latina)', () => {
    const r = parseSubtitleLanguage("spa Spanish (Latin America)");
    expect(r.flag).toBe("🌎");
    expect(r.displayName).toBe("Espanhol (América Latina)");
  });

  it('"est Estonian" → 🇪🇪 Estoniano', () => {
    const r = parseSubtitleLanguage("est Estonian");
    expect(r.flag).toBe("🇪🇪");
    expect(r.displayName).toBe("Estoniano");
  });

  it('"lav Latvian" → 🇱🇻 Letão', () => {
    const r = parseSubtitleLanguage("lav Latvian");
    expect(r.flag).toBe("🇱🇻");
    expect(r.displayName).toBe("Letão");
  });

  // --- Variantes regionais por código ---
  it("pt-BR → 🇧🇷 Português (Brasil)", () => {
    const r = parseSubtitleLanguage("pt-BR");
    expect(r.flag).toBe("🇧🇷");
    expect(r.variant).toBe("Brasil");
  });

  it("pt-PT → 🇵🇹 Português (Portugal)", () => {
    const r = parseSubtitleLanguage("pt-PT");
    expect(r.flag).toBe("🇵🇹");
    expect(r.variant).toBe("Portugal");
  });

  // --- Marcadores especiais ---
  it("detecta SDH no título", () => {
    const r = parseSubtitleLanguage("eng English SDH");
    expect(r.isSDH).toBe(true);
  });

  it("detecta Forced no título", () => {
    const r = parseSubtitleLanguage("eng Forced");
    expect(r.isForced).toBe(true);
  });

  // --- Fallback para código desconhecido ---
  it("código desconhecido → 🌐", () => {
    const r = parseSubtitleLanguage("xyz");
    expect(r.flag).toBe("🌐");
  });
});

describe("toISO6391", () => {
  it("eng → en", () => expect(toISO6391("eng")).toBe("en"));
  it("por → pt", () => expect(toISO6391("por")).toBe("pt"));
  it("spa → es", () => expect(toISO6391("spa")).toBe("es"));
  it("est → et", () => expect(toISO6391("est")).toBe("et"));
  it("rum → ro", () => expect(toISO6391("rum")).toBe("ro"));
  it("lav → lv", () => expect(toISO6391("lav")).toBe("lv"));
  it("pt-BR → pt-BR", () => expect(toISO6391("pt-BR")).toBe("pt-BR"));
  it("en → en (já é ISO 639-1)", () => expect(toISO6391("en")).toBe("en"));
});
