"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, LayoutDashboard, Settings, Crown, LogOut, Shield, Plus, Rss } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AddProfileModal } from "@/components/AddProfileModal";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const MAX_FREE_PROFILES = 5;

  // Load unread sales opportunities count
  useEffect(() => {
    const loadUnreadCount = async () => {
      const count = await getUnreadSalesOpportunitiesCount();
      setUnreadCount(count);
    };
    
    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
          const hasNotification = item.name === "Feed" && unreadCount > 0;
          return (
            <div key={item.name}>
              <div className="flex items-center gap-2">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors flex-1 relative",
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {/* Notification Badge - Pulse Effect */}
                  {hasNotification && (
                    <span className="absolute right-2 top-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </Link>
                {/* Quick Add Button - chỉ hiển thị ở Dashboard */}
                {item.name === "Dashboard" && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive
                        ? "text-white hover:bg-white/20"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                    )}
                    title="Quick Add Profile"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Trial Status & Usage Indicator - chỉ hiển thị dưới Dashboard */}
              {item.name === "Dashboard" && (
                <div className="px-4 py-2 mt-1 space-y-1">
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

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProfileCount={currentProfileCount}
        isPremium={isPremium || false}
      />
    </div>
  );
}

