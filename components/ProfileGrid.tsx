"use client";

import { useState } from "react";
import { deleteProfile } from "@/lib/profiles/actions";
import { ProfileCard } from "@/components/ProfileCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Profile } from "@/lib/profiles/types";

interface ProfileGridProps {
  profiles: Profile[];
}

export function ProfileGrid({ profiles }: ProfileGridProps) {
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
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          You haven't added any profiles yet. Start tracking your competitors now!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onDelete={handleDelete}
            isDeleting={deletingId === profile.id}
          />
        ))}
      </div>
    </div>
  );
}

