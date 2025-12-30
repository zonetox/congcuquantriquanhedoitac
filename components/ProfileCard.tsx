"use client";

import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils/url";
import { Trash2, Globe, Radio } from "lucide-react";
import { useState } from "react";

import type { Profile } from "@/lib/profiles/types";

interface ProfileCardProps {
  profile: Profile;
  onDelete: (profileId: string) => void;
  isDeleting?: boolean;
}

export function ProfileCard({ profile, onDelete, isDeleting = false }: ProfileCardProps) {
  const [faviconError, setFaviconError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open link if clicking on delete button
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer p-6 relative group hover:scale-105"
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10"
        title="Delete profile"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* AI Update Icon - Premium Feature Teaser */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`p-1.5 rounded-full transition-colors cursor-help ${
            profile.has_new_update
              ? "bg-blue-100 dark:bg-blue-900/30"
              : "bg-gray-100 dark:bg-gray-700/50"
          }`}
          title="AI Update feature coming soon for Premium users"
        >
          <Radio
            className={`w-4 h-4 transition-colors ${
              profile.has_new_update
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          />
        </div>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-4">
        {faviconError ? (
          // Fallback icon từ lucide-react nếu không lấy được favicon
          <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Globe className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
        ) : (
          <img
            src={getFaviconUrl(profile.url)}
            alt={getDomainFromUrl(profile.url)}
            className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
            onError={() => {
              // Đánh dấu lỗi để hiển thị icon fallback
              setFaviconError(true);
            }}
          />
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center line-clamp-2 min-h-[3rem]">
        {profile.title}
      </h3>

      {/* Notes - Hiển thị mờ bên dưới title */}
      {profile.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2 line-clamp-2 italic px-2">
          {profile.notes}
        </p>
      )}

      {/* Domain */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center truncate">
        {getDomainFromUrl(profile.url)}
      </p>
    </div>
  );
}

