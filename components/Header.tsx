"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Menu, X, LayoutDashboard, Settings, Shield, Rss } from "lucide-react";
import { cn } from "@/lib/utils";

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

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Feed", href: "/feed", icon: Rss },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Header({ userEmail, isPremium, isAdmin, currentProfileCount = 0, trialStatus }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const MAX_FREE_PROFILES = 5;

  return (
    <div>
      {/* Desktop Header */}
      <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Partner Center
                </h1>
                {userEmail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {userEmail}
                  </p>
                )}
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
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
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    pathname === "/admin"
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Admin</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Partner Center
                </h1>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-400"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="px-4 pb-4 space-y-2 border-t border-slate-200 dark:border-gray-700">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                  {/* Trial Status & Usage Indicator - chỉ hiển thị dưới Dashboard */}
                  {item.name === "Dashboard" && (
                    <div className="px-4 py-2 space-y-1">
                      {/* Trial Status */}
                      {trialStatus && !isPremium && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {trialStatus.isActive && trialStatus.daysLeft !== null ? (
                            <>
                              Trial: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {trialStatus.daysLeft} {trialStatus.daysLeft === 1 ? "day" : "days"} left
                              </span>
                            </>
                          ) : (
                            <>
                              Plan: <span className="font-semibold text-slate-700 dark:text-slate-300">Free</span>
                            </>
                          )}
                        </p>
                      )}
                      {/* Usage Indicator - chỉ hiển thị khi không phải Premium */}
                      {!isPremium && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Usage: <span className={cn(
                            "font-semibold",
                            currentProfileCount >= MAX_FREE_PROFILES 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-slate-700 dark:text-slate-300"
                          )}>
                            {currentProfileCount}/{MAX_FREE_PROFILES} profiles
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  pathname === "/admin"
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                )}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </Link>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
