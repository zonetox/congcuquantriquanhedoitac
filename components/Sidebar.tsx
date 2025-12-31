"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutDashboard, Settings, Crown, LogOut, Shield } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userEmail?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ userEmail, isPremium, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Partner Center
          </h1>
          {userEmail && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {userEmail}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* Admin Link */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              pathname === "/admin"
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-6 border-t border-slate-200 dark:border-gray-700 space-y-3">
        {/* Premium Badge */}
        {isPremium && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg">
            <Crown className="w-4 h-4 text-yellow-900" />
            <span className="text-xs font-semibold text-yellow-900">Premium</span>
          </div>
        )}

        {/* Sign Out */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

