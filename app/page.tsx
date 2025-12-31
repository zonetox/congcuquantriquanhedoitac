import { getUser } from "@/lib/supabase/helpers";
import { getProfiles } from "@/lib/profiles/actions";
import { LandingPage } from "@/components/LandingPage";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardContent } from "@/components/DashboardContent";
import { getUserMembership } from "@/lib/membership";

export default async function Home() {
  const user = await getUser();

  // If user is not logged in, show landing page
  if (!user) {
    return <LandingPage />;
  }

  // If user is logged in, show dashboard
  // Tối ưu: Gộp queries membership và profiles
  const [{ data: profiles }, membership] = await Promise.all([
    getProfiles(),
    getUserMembership(),
  ]);
  const userIsPremium = membership.isPremium;
  const userIsAdmin = membership.isAdmin;
  const hasValidPremium = membership.hasValidPremium;
  const trialStatus = membership.trialStatus;
  const trialExpired = trialStatus.isExpired && !userIsPremium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar
        userEmail={user.email}
        isPremium={userIsPremium}
        isAdmin={userIsAdmin}
        currentProfileCount={profiles?.length || 0}
        trialStatus={trialStatus}
      />
      <Header
        userEmail={user.email}
        isPremium={userIsPremium}
        isAdmin={userIsAdmin}
        currentProfileCount={profiles?.length || 0}
        trialStatus={trialStatus}
      />
      <div className="lg:pl-64">
        <div className="lg:pt-0">
          <DashboardContent
            profiles={profiles || []}
            isPremium={userIsPremium}
            hasValidPremium={hasValidPremium}
            trialExpired={trialExpired}
            currentProfileCount={profiles?.length || 0}
          />
        </div>
      </div>
    </div>
  );
}
