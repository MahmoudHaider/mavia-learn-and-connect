import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";
const STORAGE_KEY = "mavia-lang";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Pick the Arabic or English text for the current language. */
  tr: (ar: string, en: string) => string;
}

const Ctx = createContext<LangCtx>({ lang: "ar", setLang: () => {}, tr: (ar) => ar });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ar") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const tr = useCallback((ar: string, en: string) => (lang === "ar" ? ar : en), [lang]);

  return <Ctx.Provider value={{ lang, setLang, tr }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
