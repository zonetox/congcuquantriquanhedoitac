"use client";

import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils/url";
import { Trash2, Globe, Radio, Crown, ExternalLink, Lock, Rss, Edit2 } from "lucide-react";
import { useState, memo } from "react";
import Image from "next/image";
import { toggleFeedStatus } from "@/lib/profiles/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { Profile } from "@/lib/profiles/types";

interface ProfileCardProps {
  profile: Profile;
  onDelete: (profileId: string) => void;
  onEdit?: (profile: Profile) => void; // Callback để mở EditModal
  isDeleting?: boolean;
  isPremium?: boolean;
  isBlurred?: boolean; // Profile bị blur (trial expired, từ thứ 6 trở đi)
  categoryColor?: string; // Màu của category từ categories table
  animationDelay?: number; // Delay cho animation (ms)
}

export const ProfileCard = memo(function ProfileCard({ profile, onDelete, onEdit, isDeleting = false, isPremium = false, isBlurred = false, categoryColor, animationDelay = 0 }: ProfileCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const [isTogglingFeed, setIsTogglingFeed] = useState(false);
  const router = useRouter();

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

  const handleToggleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsTogglingFeed(true);
    const result = await toggleFeedStatus(profile.id, !profile.is_in_feed);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(profile.is_in_feed ? "Removed from feed" : "Added to feed");
      router.refresh();
    }
    setIsTogglingFeed(false);
  };

  // Helper function để convert hex color thành rgba với opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Default colors cho các category cố định
  const defaultCategoryColors: Record<string, string> = {
    Competitor: "#ef4444",
    Partner: "#10b981",
    Customer: "#3b82f6",
    Other: "#8b5cf6",
    General: "#64748b",
  };

  // Lấy màu category (từ prop hoặc default)
  const finalCategoryColor = categoryColor || defaultCategoryColors[profile.category || "General"] || "#64748b";

  return (
    <div
      onClick={isBlurred ? undefined : handleCardClick}
      className={`group relative neu-card rounded-neu-lg shadow-soft-out hover:shadow-soft-card transition-all duration-300 p-6 ${
        isBlurred 
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer"
      } ${!isBlurred ? "transform hover:-translate-y-1" : ""} animate-fade-in-slide-up opacity-0`}
      style={{
        ...(isBlurred ? {
          filter: "blur(4px) grayscale(1)",
          pointerEvents: "none" as const,
        } : {}),
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Premium Crown Icon - Neumorphism Style */}
      {isPremium && (
        <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full p-2 shadow-soft-button">
          <Crown className="w-5 h-5 text-white" />
        </div>
      )}

      {/* RSS Icon - Always visible, different color when added to feed */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleToggleFeed}
          disabled={isTogglingFeed || isBlurred}
          className={`p-2 neu-icon-box rounded-xl transition-all disabled:opacity-50 active:shadow-soft-button-pressed ${
            profile.is_in_feed
              ? "text-emerald-600 bg-emerald-50"
              : "text-slate-400 hover:text-emerald-600"
          }`}
          title={profile.is_in_feed ? "Remove from feed" : "Add to feed"}
        >
          <Rss className={`w-5 h-5 ${isTogglingFeed ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Action Buttons - Neumorphism Style (Edit & Delete, shown on hover) */}
      <div className="absolute top-3 right-12 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(profile);
            }}
            disabled={isBlurred}
            className="p-2 neu-icon-box rounded-xl text-slate-500 hover:text-blue-500 transition-all disabled:opacity-50 active:shadow-soft-button-pressed"
            title="Edit profile"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 neu-icon-box rounded-xl text-slate-500 hover:text-red-500 transition-all disabled:opacity-50 active:shadow-soft-button-pressed"
          title="Delete profile"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Category Badge - Neumorphism Style */}
      {profile.category && profile.category !== "General" && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className="px-3 py-1.5 text-xs font-semibold rounded-full neu-icon-box shadow-soft-icon"
            style={{
              color: finalCategoryColor, // Màu chữ đậm
            }}
          >
            {profile.category}
          </span>
        </div>
      )}

      {/* AI Update Icon - Neumorphism Style */}
      <div className={`absolute ${profile.category && profile.category !== "General" ? "top-12 left-3" : "top-3 left-3"} z-10`}>
        <div
          className="p-2 neu-icon-box rounded-full transition-all cursor-help shadow-soft-icon"
          title="AI Update feature coming soon for Premium users"
        >
          <Radio
            className={`w-4 h-4 transition-colors ${
              profile.has_new_update
                ? "text-blue-500"
                : "text-slate-400"
            }`}
          />
        </div>
      </div>

      {/* Business Card Content */}
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        {/* Logo - Neumorphism Style */}
        <div className="flex justify-center mb-2">
          {faviconError ? (
            <div className="w-20 h-20 rounded-2xl neu-icon-box flex items-center justify-center shadow-soft-icon">
              <Globe className="w-10 h-10 text-slate-400" />
            </div>
          ) : (
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl neu-icon-box shadow-soft-icon p-2">
                <Image
                  src={getFaviconUrl(profile.url)}
                  alt={getDomainFromUrl(profile.url)}
                  width={80}
                  height={80}
                  className="w-full h-full rounded-xl object-cover"
                  loading="lazy"
                  unoptimized
                  onError={() => {
                    setFaviconError(true);
                  }}
                />
              </div>
              {/* External Link Indicator */}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-soft-button opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>

        {/* Title - Neumorphism Style */}
        <div className="space-y-2 w-full">
          <h3 className="text-xl font-bold text-slate-800 line-clamp-2 min-h-[3rem] leading-tight">
            {profile.title}
          </h3>

          {/* Notes - Subtle below title */}
          {profile.notes && (
            <p className="text-xs text-slate-500 text-center line-clamp-2 italic px-2 leading-relaxed">
              {profile.notes}
            </p>
          )}
        </div>

        {/* Domain - Neumorphism Style */}
        <div className="pt-3 w-full">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <p className="text-sm font-medium text-slate-600 truncate mt-3">
            {getDomainFromUrl(profile.url)}
          </p>
        </div>
      </div>

      {/* Hover Effect Overlay - Neumorphism Style */}
      <div className="absolute inset-0 rounded-neu-lg bg-gradient-to-br from-emerald-400/0 to-blue-400/0 group-hover:from-emerald-400/5 group-hover:to-blue-400/5 transition-all duration-300 pointer-events-none" />
    </div>
  );
});
