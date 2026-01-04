"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/config";
import { updateUserLocale } from "@/lib/user/actions";
import { Check } from "lucide-react";

const languageNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
};

interface UserMenuProps {
  userEmail?: string;
  isPremium?: boolean;
}

export function UserMenu({ userEmail, isPremium }: UserMenuProps) {
  const t = useTranslations("settings");
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale>("en");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLanguageMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = async (locale: Locale) => {
    // Update in database (if user is logged in)
    const result = await updateUserLocale(locale);
    
    if (result.error) {
      // If database update fails, still update cookie (for non-logged-in users)
      console.warn("[UserMenu] Failed to update locale in database:", result.error);
    }
    
    // Set cookie (always, as fallback)
    document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`; // 1 year
    
    // Update state
    setCurrentLocale(locale);
    setShowLanguageMenu(false);
    setIsOpen(false);
    
    // Reload page to apply new language
    window.location.reload();
  };

  // Get initials from email
  const getInitials = (email?: string) => {
    if (!email) return "U";
    const parts = email.split("@")[0];
    return parts.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {getInitials(userEmail)}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getInitials(userEmail)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {userEmail}
                </p>
                {isPremium && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    ✨ Premium
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{t("selectLanguage")}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {languageNames[currentLocale]}
                </span>
              </button>

              {/* Language Submenu */}
              {showLanguageMenu && (
                <div className="ml-4 mt-1 space-y-1">
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => handleLanguageChange(locale)}
                      className={`w-full flex items-center justify-between px-4 py-1.5 text-sm rounded transition-colors ${
                        currentLocale === locale
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span>{languageNames[locale]}</span>
                      {currentLocale === locale && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sign Out */}
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

