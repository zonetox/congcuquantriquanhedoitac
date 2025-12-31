"use client";

import { useState } from "react";
import { deleteProfile } from "@/lib/profiles/actions";
import { ProfileCard } from "@/components/ProfileCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Target } from "lucide-react";

import type { Profile } from "@/lib/profiles/types";

interface ProfileGridProps {
  profiles: Profile[];
  isPremium?: boolean;
}

export function ProfileGrid({ profiles, isPremium = false }: ProfileGridProps) {
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
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <Target className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              No profiles yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
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
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onDelete={handleDelete}
            isDeleting={deletingId === profile.id}
            isPremium={isPremium}
          />
        ))}
      </div>
    </div>
  );
}
