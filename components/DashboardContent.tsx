"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProfileGrid } from "@/components/ProfileGrid";
import { AddProfileModal } from "@/components/AddProfileModal";
import { UpgradeButton } from "@/components/UpgradeButton";
import type { Profile } from "@/lib/profiles/types";

interface DashboardContentProps {
  profiles: Profile[];
  isPremium: boolean;
  hasValidPremium?: boolean; // is_premium === true HOẶC đang trong trial
  trialExpired?: boolean; // Trial đã hết hạn và không phải premium
  currentProfileCount: number;
}

export function DashboardContent({ profiles, isPremium, hasValidPremium = false, trialExpired = false, currentProfileCount }: DashboardContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Your Profiles
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {profiles.length} {profiles.length === 1 ? "profile" : "profiles"} tracked
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isPremium && <UpgradeButton />}
            {/* Add Profile Button - Nổi bật ở đầu trang */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all transform hover:scale-105 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <ProfileGrid 
        profiles={profiles} 
        isPremium={isPremium}
        hasValidPremium={hasValidPremium}
        trialExpired={trialExpired}
      />

      {/* Floating Add Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-110 flex items-center justify-center z-40 group"
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
    </main>
  );
}

