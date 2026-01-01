"use client";

import { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/config";
import { toast } from "sonner";
import { updateUserLocale } from "@/lib/user/actions";

const languageNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
};

export function LanguageSelector() {
  const t = useTranslations("settings");
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get locale from cookie
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1] as Locale;
    
    if (cookieLocale && locales.includes(cookieLocale)) {
      setCurrentLocale(cookieLocale);
    }
  }, []);

  const handleLanguageChange = async (locale: Locale) => {
    // Update in database (if user is logged in)
    const result = await updateUserLocale(locale);
    
    if (result.error) {
      // If database update fails, still update cookie (for non-logged-in users)
      console.warn("[LanguageSelector] Failed to update locale in database:", result.error);
    }
    
    // Set cookie (always, as fallback)
    document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`; // 1 year
    
    // Update state
    setCurrentLocale(locale);
    setIsOpen(false);
    
    // Reload page to apply new language
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 neu-button rounded-lg shadow-soft-out hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all text-sm text-slate-700"
        title={t("selectLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{languageNames[currentLocale]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 neu-card rounded-lg shadow-soft-out z-20 overflow-hidden">
            <div className="p-2 space-y-1">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    currentLocale === locale
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{languageNames[locale]}</span>
                  {currentLocale === locale && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

