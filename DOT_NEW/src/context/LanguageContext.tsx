import { createContext, useContext, useState, type ReactNode } from "react";
import type { Language } from "../types";
import { readJson, writeJson } from "../lib/storage";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    readJson<Language>("kish.language", "en") === "ta" ? "ta" : "en",
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    writeJson("kish.language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Kept beside its private context so legacy components retain their existing import.
// oxlint-disable-next-line react/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
