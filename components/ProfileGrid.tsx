"use client";

import { useState } from "react";
import { deleteProfile } from "@/lib/profiles/actions";
import { ProfileCard } from "@/components/ProfileCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Target } from "lucide-react";

import type { Profile } from "@/lib/profiles/types";
import type { Category } from "@/lib/categories/actions";

interface ProfileGridProps {
  profiles: Profile[];
  isPremium?: boolean;
  hasValidPremium?: boolean; // is_premium === true HOẶC đang trong trial
  trialExpired?: boolean; // Trial đã hết hạn và không phải premium
  categories?: Category[]; // Categories để lấy màu
}

export function ProfileGrid({ profiles, isPremium = false, hasValidPremium = false, trialExpired = false, categories = [] }: ProfileGridProps) {
  // Tạo map category name -> color
  const categoryColorMap = new Map<string, string>();
  
  // Default colors
  const defaultColors: Record<string, string> = {
    Competitor: "#ef4444",
    Partner: "#10b981",
    Customer: "#3b82f6",
    Other: "#8b5cf6",
    General: "#64748b",
  };
  
  // Thêm default colors vào map
  Object.entries(defaultColors).forEach(([name, color]) => {
    categoryColorMap.set(name, color);
  });
  
  // Thêm user-defined categories vào map (override defaults nếu trùng tên)
  categories.forEach((cat) => {
    categoryColorMap.set(cat.name, cat.color);
  });
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) {
      return;
    }

    setDeletingId(profileId);
    setError(null);

    try {
      const result = await deleteProfile(profileId);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Profile deleted successfully!");
        router.refresh();
      }
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 neu-icon-box rounded-2xl flex items-center justify-center mx-auto shadow-soft-icon">
            <Target className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">
              No profiles yet
            </h3>
            <p className="text-slate-600">
              You haven't added any profiles yet. Start tracking your competitors now! {/* eslint-disable-line react/no-unescaped-entities */}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-4 neu-card rounded-neu shadow-soft-out border-l-4 border-red-400">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {profiles.map((profile, index) => {
          // Logic blur: Nếu trial expired và không premium, blur từ profile thứ 6 (index >= 5)
          const shouldBlur = trialExpired && !isPremium && index >= 5;
          
          // Lấy màu category
          const categoryColor = profile.category ? categoryColorMap.get(profile.category) : undefined;
          
          // Animation delay (stagger effect)
          const animationDelay = Math.min(index * 50, 500); // Max 500ms delay
          
          return (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onDelete={handleDelete}
              isDeleting={deletingId === profile.id}
              isPremium={isPremium}
              isBlurred={shouldBlur}
              categoryColor={categoryColor}
              animationDelay={animationDelay}
            />
          );
        })}
      </div>
    </div>
  );
}
