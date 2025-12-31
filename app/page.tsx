import { getUser } from "@/lib/supabase/helpers";
import { getProfiles } from "@/lib/profiles/actions";
import { ProfileGrid } from "@/components/ProfileGrid";
import { LandingPage } from "@/components/LandingPage";
import { Navbar } from "@/components/Navbar";
import { DashboardContent } from "@/components/DashboardContent";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar userEmail={user.email} isPremium={userIsPremium} />
      <DashboardContent
        profiles={profiles || []}
        isPremium={userIsPremium}
        currentProfileCount={profiles?.length || 0}
      />
    </div>
  );
}
