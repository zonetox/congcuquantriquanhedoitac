"use client";

import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils/url";
import { Trash2, Globe, Radio, Crown, ExternalLink } from "lucide-react";
import { useState } from "react";

import type { Profile } from "@/lib/profiles/types";

interface ProfileCardProps {
  profile: Profile;
  onDelete: (profileId: string) => void;
  isDeleting?: boolean;
  isPremium?: boolean;
}

export function ProfileCard({ profile, onDelete, isDeleting = false, isPremium = false }: ProfileCardProps) {
  const [faviconError, setFaviconError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open link if clicking on delete button or AI update icon
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Open link in new tab using window.open
    window.open(profile.url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking delete
    onDelete(profile.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer p-6 border-2 ${
        isPremium
          ? "border-yellow-400 dark:border-yellow-500 shadow-yellow-200/30 dark:shadow-yellow-900/20"
          : "border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600"
      } transform hover:-translate-y-2 hover:scale-[1.02]`}
    >
      {/* Premium Crown Icon */}
      {isPremium && (
        <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-2 shadow-lg">
          <Crown className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10 rounded-lg"
        title="Delete profile"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Category Badge */}
      {profile.category && profile.category !== "General" && (() => {
        const categoryColors = {
          Competitor: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
          Partner: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          Customer: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          Other: "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
        };
        const colorClass = categoryColors[profile.category as keyof typeof categoryColors] || categoryColors.Other;
        
        return (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
              {profile.category}
            </span>
          </div>
        );
      })()}

      {/* AI Update Icon - Premium Feature Teaser */}
      <div className={`absolute ${profile.category && profile.category !== "General" ? "top-12 left-3" : "top-3 left-3"} z-10`}>
        <div
          className={`p-2 rounded-full transition-all cursor-help ${
            profile.has_new_update
              ? "bg-blue-100 dark:bg-blue-900/30 shadow-sm"
              : "bg-slate-100 dark:bg-gray-700/50"
          }`}
          title="AI Update feature coming soon for Premium users"
        >
          <Radio
            className={`w-4 h-4 transition-colors ${
              profile.has_new_update
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          />
        </div>
      </div>

      {/* Business Card Content */}
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        {/* Logo - Larger for Business Card feel */}
        <div className="flex justify-center mb-2">
          {faviconError ? (
            <div className="w-20 h-20 rounded-xl border-2 border-slate-200 dark:border-gray-700 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-inner">
              <Globe className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
          ) : (
            <div className="relative">
              <img
                src={getFaviconUrl(profile.url)}
                alt={getDomainFromUrl(profile.url)}
                className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 dark:border-gray-700 shadow-md"
                onError={() => {
                  setFaviconError(true);
                }}
              />
              {/* External Link Indicator */}
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>

        {/* Title - Business Card Style */}
        <div className="space-y-2 w-full">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[3rem] leading-tight">
            {profile.title}
          </h3>

          {/* Notes - Subtle below title */}
          {profile.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center line-clamp-2 italic px-2 leading-relaxed">
              {profile.notes}
            </p>
          )}
        </div>

        {/* Domain - Professional styling */}
        <div className="pt-2 border-t border-slate-200 dark:border-gray-700 w-full">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
            {getDomainFromUrl(profile.url)}
          </p>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />
    </div>
  );
}
