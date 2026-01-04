"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutDashboard, Settings, Crown, LogOut, Shield, Rss } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getUnreadSalesOpportunitiesCount } from "@/lib/notifications/queries";

interface SidebarProps {
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

export function Sidebar({ userEmail, isPremium, isAdmin, currentProfileCount = 0, trialStatus }: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const MAX_FREE_PROFILES = 5;

  // Load unread sales opportunities count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadSalesOpportunitiesCount();
        setUnreadCount(count);
      } catch (error) {
        // Silently fail - don't break the UI
        console.error("[Sidebar] Error loading unread count:", error);
        setUnreadCount(0);
      }
    };
    
    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate usage percentage for progress bar
  const usagePercentage = !isPremium ? Math.min((currentProfileCount / MAX_FREE_PROFILES) * 100, 100) : 0;

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700">
      {/* Logo - Minimal */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Partner Center
        </h1>
      </div>

      {/* Navigation - Minimal */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const hasNotification = item.name === "Feed" && unreadCount > 0;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
              {/* Notification Badge - Pulse Effect */}
              {hasNotification && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Link */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              pathname === "/admin"
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium text-sm">Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom Section - Minimal */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-gray-700 space-y-3">
        {/* Premium Badge - Compact */}
        {isPremium && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg">
            <Crown className="w-3.5 h-3.5 text-yellow-900" />
            <span className="text-xs font-semibold text-yellow-900">Premium</span>
          </div>
        )}

        {/* Usage Progress Bar - Compact (chỉ hiển thị khi không Premium) */}
        {!isPremium && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Usage</span>
              <span className="font-medium">{currentProfileCount}/{MAX_FREE_PROFILES}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  currentProfileCount >= MAX_FREE_PROFILES
                    ? "bg-red-500"
                    : currentProfileCount >= MAX_FREE_PROFILES - 1
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Sign Out - Moved to bottom */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

