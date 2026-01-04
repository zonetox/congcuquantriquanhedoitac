"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Menu, X, LayoutDashboard, Settings, Shield, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  userEmail?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  currentProfileCount?: number;
  trialStatus?: {
    daysLeft: number | null;
    isActive: boolean;
    isExpired: boolean;
  };
}

export function Header({ userEmail, isPremium, isAdmin, currentProfileCount = 0, trialStatus }: HeaderProps) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const MAX_FREE_PROFILES = 5;

  const navigation = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("feed"), href: "/feed", icon: Rss },
    { name: t("settings"), href: "/settings", icon: Settings },
  ];

  return (
    <div>
      {/* Desktop Header - 64px height */}
      <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Minimal */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Partner Center
              </h1>
            </Link>

            {/* Navigation - Minimal */}
            <nav className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm",
                    pathname === "/admin"
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">{t("admin")}</span>
                </Link>
              )}
              {/* User Menu Dropdown */}
              <UserMenu userEmail={userEmail} isPremium={isPremium} />
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header - 64px height */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Partner Center
              </h1>
            </Link>
            <div className="flex items-center gap-2">
              <UserMenu userEmail={userEmail} isPremium={isPremium} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Minimal */}
        {mobileMenuOpen && (
          <div className="px-4 pb-4 space-y-1 border-t border-slate-200 dark:border-gray-700">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  pathname === "/admin"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                )}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium text-sm">Admin</span>
              </Link>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
