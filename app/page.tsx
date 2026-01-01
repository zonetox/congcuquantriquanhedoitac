import { getUser } from "@/lib/supabase/helpers";
import { getProfiles } from "@/lib/profiles/actions";
import { getCategories } from "@/lib/categories/actions";
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
  // Tối ưu: Gộp queries membership, profiles và categories
  // Wrap in try-catch to prevent server crashes
  let profiles = null;
  let membership: Awaited<ReturnType<typeof getUserMembership>> = {
    isPremium: false,
    isAdmin: false,
    role: null,
    hasValidPremium: false,
    trialStatus: { daysLeft: null, isActive: false, isExpired: false }
  };
  let categories = null;

  try {
    const [profilesResult, membershipResult, categoriesResult] = await Promise.all([
      getProfiles().catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[Home] Error fetching profiles:", err);
        }
        return { data: null, error: "Failed to load profiles" };
      }),
      getUserMembership().catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[Home] Error fetching membership:", err);
        }
        return {
          isPremium: false,
          isAdmin: false,
          role: null,
          hasValidPremium: false,
          trialStatus: { daysLeft: null, isActive: false, isExpired: false }
        };
      }),
      getCategories().catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[Home] Error fetching categories:", err);
        }
        return { data: null, error: "Failed to load categories" };
      }),
    ]);
    
    profiles = profilesResult.data;
    membership = membershipResult;
    categories = categoriesResult.data;
  } catch (error) {
    // Fallback values if all queries fail
    if (process.env.NODE_ENV === "development") {
      console.error("[Home] Unexpected error:", error);
    }
  }

  const userIsPremium = membership.isPremium;
  const userIsAdmin = membership.isAdmin;
  const hasValidPremium = membership.hasValidPremium;
  const trialStatus = membership.trialStatus;
  const trialExpired = trialStatus.isExpired && !userIsPremium;

  return (
    <div className="min-h-screen neu-bg">
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
            categories={categories || []}
          />
        </div>
      </div>
    </div>
  );
}
