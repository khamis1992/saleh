import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslations, type Locale, type TranslationDict } from '@/constants/translations';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationDict;
  tt: (key: string, fallback: string) => string;
  dir: 'rtl' | 'ltr';
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('locale') as Locale) || 'ar';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const t = getTranslations(locale);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // Dotted-key translation lookup with Arabic fallback
  const tt = (key: string, fallback: string): string => {
    const keys = key.split('.');
    let current: any = t;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return fallback;
      }
    }
    return typeof current === 'string' ? current : fallback;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tt, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
