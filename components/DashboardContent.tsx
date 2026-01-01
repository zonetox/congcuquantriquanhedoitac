"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { ProfileGrid } from "@/components/ProfileGrid";
import { AddProfileModal } from "@/components/AddProfileModal";
import { EditProfileModal } from "@/components/EditProfileModal";
import { ProfileDetailsModal } from "@/components/ProfileDetailsModal";
import { UpgradeButton } from "@/components/UpgradeButton";
import type { Profile } from "@/lib/profiles/types";
import type { Category } from "@/lib/categories/actions";

interface DashboardContentProps {
  profiles: Profile[];
  isPremium: boolean;
  hasValidPremium?: boolean; // is_premium === true HOẶC đang trong trial
  trialExpired?: boolean; // Trial đã hết hạn và không phải premium
  currentProfileCount: number;
  categories?: Category[]; // Categories để pass vào ProfileGrid
}

export function DashboardContent({ profiles, isPremium, hasValidPremium = false, trialExpired = false, currentProfileCount, categories = [] }: DashboardContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [detailsProfile, setDetailsProfile] = useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = All

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

  // Filter profiles theo category được chọn
  const filteredProfiles = useMemo(() => {
    if (!selectedCategory) return profiles;
    return profiles.filter((p) => (p.category || "General") === selectedCategory);
  }, [profiles, selectedCategory]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section - Neumorphism Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              Your Profiles
            </h2>
            <p className="text-slate-600 mt-1">
              {profiles.length} {profiles.length === 1 ? "profile" : "profiles"} tracked
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isPremium && <UpgradeButton />}
            {/* Add Profile Button - Neumorphism Style */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white rounded-full shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Profile</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {/* All Tab */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? "neu-card shadow-soft-out text-slate-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            style={{
              backgroundColor: selectedCategory === null ? "rgba(255, 255, 255, 0.7)" : undefined,
            }}
          >
            All ({profiles.length})
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "text-white shadow-soft-out"
                    : "text-slate-600 hover:bg-slate-100"
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

      {/* Profiles Grid */}
      <ProfileGrid 
        profiles={filteredProfiles} 
        isPremium={isPremium}
        hasValidPremium={hasValidPremium}
        trialExpired={trialExpired}
        categories={categories}
        onEdit={setEditingProfile}
        onDetails={setDetailsProfile}
      />

      {/* Floating Add Button - Neumorphism Style */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white rounded-full shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 flex items-center justify-center z-40 group"
        title="Add New Profile"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

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

