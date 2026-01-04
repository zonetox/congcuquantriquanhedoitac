"use client";

import { useState } from "react";
import { deleteProfile } from "@/lib/profiles/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Edit, Trash2, Rss, Lock, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { UpgradeButton } from "@/components/UpgradeButton";
import Image from "next/image";
import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils/url";
import type { Profile } from "@/lib/profiles/types";
import type { Category } from "@/lib/categories/actions";

interface ProfileTableProps {
  profiles: Profile[];
  isPremium?: boolean;
  hasValidPremium?: boolean;
  trialExpired?: boolean;
  categories?: Category[];
  searchQuery?: string;
  onEdit?: (profile: Profile) => void;
  onDetails?: (profile: Profile) => void;
}

export function ProfileTable({ 
  profiles, 
  isPremium = false, 
  hasValidPremium = false, 
  trialExpired = false,
  categories = [],
  searchQuery = "",
  onEdit,
  onDetails 
}: ProfileTableProps) {
  const router = useRouter();
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Category color map
  const categoryColorMap = new Map<string, string>();
  const defaultColors: Record<string, string> = {
    Competitor: "#ef4444",
    Partner: "#10b981",
    Customer: "#3b82f6",
    Other: "#8b5cf6",
    General: "#64748b",
  };
  Object.entries(defaultColors).forEach(([name, color]) => {
    categoryColorMap.set(name, color);
  });
  categories.forEach((cat) => {
    categoryColorMap.set(cat.name, cat.color);
  });

  const handleDelete = async (profileId: string) => {
    if (!confirm(tProfile("deleteConfirm"))) {
      return;
    }

    setDeletingId(profileId);
    try {
      const result = await deleteProfile(profileId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(tProfile("delete") + " " + tCommon("success"));
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (profile: Profile) => {
    if (onDetails && !(trialExpired && !isPremium && profiles.indexOf(profile) >= 5)) {
      onDetails(profile);
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {tDashboard("noProfilesFound")}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {searchQuery ? tDashboard("tryAdjustingSearch") : tDashboard("addFirstProfile")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                URL
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Feed
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
            {profiles.map((profile, index) => {
              const shouldBlur = trialExpired && !isPremium && index >= 5;
              const categoryColor = profile.category ? categoryColorMap.get(profile.category) : undefined;
              const isDeleting = deletingId === profile.id;

              return (
                <tr
                  key={profile.id}
                  onClick={() => handleRowClick(profile)}
                  className={`transition-colors relative ${
                    shouldBlur 
                      ? "opacity-50 cursor-not-allowed" 
                      : onDetails 
                        ? "hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer" 
                        : "hover:bg-slate-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {/* Blur Overlay */}
                  {shouldBlur && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          {tDashboard("upgradeToUnlock")}
                        </p>
                        <UpgradeButton />
                      </div>
                    </div>
                  )}

                  {/* Profile Column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={getFaviconUrl(profile.url)}
                          alt={getDomainFromUrl(profile.url)}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          unoptimized
                        />
                        {shouldBlur && (
                          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${
                          shouldBlur 
                            ? "text-slate-400 dark:text-slate-600" 
                            : "text-slate-900 dark:text-white"
                        }`}>
                          {profile.title}
                        </p>
                        {profile.notes && (
                          <p className={`text-xs truncate mt-0.5 ${
                            shouldBlur 
                              ? "text-slate-300 dark:text-slate-700" 
                              : "text-slate-500 dark:text-slate-400"
                          }`}>
                            {profile.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category Column */}
                  <td className="px-4 py-3">
                    {profile.category && profile.category !== "General" && categoryColor ? (
                      <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${categoryColor}15`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}30`,
                        }}
                      >
                        {profile.category}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">General</span>
                    )}
                  </td>

                  {/* URL Column */}
                  <td className="px-4 py-3">
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <span className="truncate max-w-[200px]">{getDomainFromUrl(profile.url)}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  </td>

                  {/* Feed Column */}
                  <td className="px-4 py-3 text-center">
                    <Rss
                      className={`w-5 h-5 mx-auto ${
                        profile.is_in_feed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-300 dark:text-slate-600"
                      }`}
                    />
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && !shouldBlur && (
                        <button
                          onClick={() => onEdit(profile)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title={tCommon("edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(profile.id)}
                        disabled={isDeleting || shouldBlur}
                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={shouldBlur ? tDashboard("upgradeToUnlock") : tCommon("delete")}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

