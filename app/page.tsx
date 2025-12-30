import { getUser } from "@/lib/supabase/helpers";
import { getProfiles } from "@/lib/profiles/actions";
import { AddProfileForm } from "@/components/AddProfileForm";
import { ProfileGrid } from "@/components/ProfileGrid";
import { LandingPage } from "@/components/LandingPage";
import { UpgradeButton } from "@/components/UpgradeButton";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { isPremium } from "@/lib/auth/helpers";

export default async function Home() {
  const user = await getUser();

  // If user is not logged in, show landing page
  if (!user) {
    return <LandingPage />;
  }

  // If user is logged in, show dashboard
  const { data: profiles } = await getProfiles();
  const userIsPremium = await isPremium();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Networking Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome, {user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Upgrade Button - Chỉ hiển thị nếu không phải premium */}
            {!userIsPremium && <UpgradeButton />}
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Add Profile Form */}
        <AddProfileForm currentProfileCount={profiles.length} isPremium={userIsPremium} />

        {/* Profiles Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Profiles ({profiles.length})
            {userIsPremium && (
              <span className="ml-2 text-sm font-normal text-yellow-600 dark:text-yellow-400">
                ✨ Premium
              </span>
            )}
          </h2>
          <ProfileGrid profiles={profiles} isPremium={userIsPremium} />
        </div>
      </div>
    </main>
  );
}

