"use client";

import { useState, useMemo } from "react";
import { Plus, Search, X } from "lucide-react";
import { ProfileTable } from "@/components/ProfileTable";
import { AddProfileModal } from "@/components/AddProfileModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ProfileDetailsModal } from "@/components/ProfileDetailsModal";
import { UpgradeButton } from "@/components/UpgradeButton";
import { useTranslations } from "next-intl";
import type { Profile } from "@/lib/profiles/types";
import type { Category } from "@/lib/categories/actions";

interface DashboardContentProps {
  profiles: Profile[];
  isPremium: boolean;
  hasValidPremium?: boolean; // is_premium === true HOẶC đang trong trial
  trialExpired?: boolean; // Trial đã hết hạn và không phải premium
  currentProfileCount: number;
  categories?: Category[]; // Categories để pass vào ProfileTable
}

export function DashboardContent({ profiles, isPremium, hasValidPremium = false, trialExpired = false, currentProfileCount, categories = [] }: DashboardContentProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [detailsProfile, setDetailsProfile] = useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = All
  const [searchQuery, setSearchQuery] = useState("");

  // Default categories với màu
  const defaultCategories: Record<string, string> = {
    General: "#64748b",
    Competitor: "#ef4444",
    Partner: "#10b981",
    Customer: "#3b82f6",
    Other: "#8b5cf6",
  };

  // Tạo map category name -> color
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    // Thêm default colors
    Object.entries(defaultCategories).forEach(([name, color]) => {
      map.set(name, color);
    });
    // Thêm user-defined categories (override defaults)
    categories.forEach((cat) => {
      map.set(cat.name, cat.color);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Tính số lượng profiles theo category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach((profile) => {
      const cat = profile.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [profiles]);

  // Lấy tất cả categories (default + user-defined)
  const allCategories = useMemo(() => {
    const defaultCats = Object.keys(defaultCategories);
    const userCats = categories.map((c) => c.name);
    return Array.from(new Set([...defaultCats, ...userCats]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Filter profiles theo category và search query
  const filteredProfiles = useMemo(() => {
    let filtered = profiles;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => (p.category || "General") === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.url.toLowerCase().includes(query) ||
          (p.notes && p.notes.toLowerCase().includes(query)) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [profiles, selectedCategory, searchQuery]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section - Minimal */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("title")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {t("subtitle", { count: profiles.length })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isPremium && <UpgradeButton />}
            {/* Add Profile Button - Single button only */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{tCommon("addProfile")}</span>
            </button>
          </div>
        </div>

        {/* Search Bar - Fixed */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search profiles by name, URL, notes, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Bar - Horizontal, Compact */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* All Tab */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === null
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
            }`}
          >
            {t("all")} ({profiles.length})
          </button>

          {/* Category Tabs */}
          {allCategories.map((catName) => {
            const count = categoryCounts[catName] || 0;
            const color = categoryColorMap.get(catName) || "#64748b";
            const isActive = selectedCategory === catName;

            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(catName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-white shadow-sm"
                    : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
                }`}
                style={{
                  backgroundColor: isActive ? color : undefined,
                }}
              >
                {catName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Profiles Table */}
      <ProfileTable 
        profiles={filteredProfiles} 
        isPremium={isPremium}
        hasValidPremium={hasValidPremium}
        trialExpired={trialExpired}
        categories={categories}
        searchQuery={searchQuery}
        onEdit={setEditingProfile}
        onDetails={setDetailsProfile}
      />

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProfileCount={currentProfileCount}
        isPremium={isPremium}
      />

      {/* Edit Profile Modal */}
      {editingProfile && (
        <EditProfileModal
          isOpen={!!editingProfile}
          onClose={() => setEditingProfile(null)}
          profile={editingProfile}
        />
      )}

      {/* Profile Details Modal (CRM) */}
      {detailsProfile && (
        <ProfileDetailsModal
          isOpen={!!detailsProfile}
          onClose={() => setDetailsProfile(null)}
          profile={detailsProfile}
        />
      )}
    </main>
  );
}

