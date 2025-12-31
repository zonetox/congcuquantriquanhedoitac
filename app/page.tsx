import { getUser } from "@/lib/supabase/helpers";
import { getProfiles } from "@/lib/profiles/actions";
import { LandingPage } from "@/components/LandingPage";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardContent } from "@/components/DashboardContent";
import { isPremium, isAdmin } from "@/lib/membership";

export default async function Home() {
  const user = await getUser();

  // If user is not logged in, show landing page
  if (!user) {
    return <LandingPage />;
  }

  // If user is logged in, show dashboard
  const { data: profiles } = await getProfiles();
  const [userIsPremium, userIsAdmin] = await Promise.all([
    isPremium(),
    isAdmin(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar
        userEmail={user.email}
        isPremium={userIsPremium}
        isAdmin={userIsAdmin}
        currentProfileCount={profiles?.length || 0}
      />
      <Header
        userEmail={user.email}
        isPremium={userIsPremium}
        isAdmin={userIsAdmin}
        currentProfileCount={profiles?.length || 0}
      />
      <div className="lg:pl-64">
        <div className="lg:pt-0">
          <DashboardContent
            profiles={profiles || []}
            isPremium={userIsPremium}
            currentProfileCount={profiles?.length || 0}
          />
        </div>
      </div>
    </div>
  );
}
