"use client";

import { Target, LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";

interface NavbarProps {
  userEmail?: string;
  isPremium?: boolean;
}

export function Navbar({ userEmail, isPremium }: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
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
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Premium Badge */}
            {isPremium && (
              <span className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full">
                ✨ Premium
              </span>
            )}

            {/* Settings Button */}
            <Link
              href="/settings"
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Sign Out Button */}
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}

