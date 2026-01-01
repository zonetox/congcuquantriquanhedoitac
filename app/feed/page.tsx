import { getUser } from "@/lib/supabase/helpers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { getUserMembership } from "@/lib/membership";
import { FeedContent } from "@/components/FeedContent";

export default async function FeedPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Wrap in try-catch to prevent server crashes
  let membership: Awaited<ReturnType<typeof getUserMembership>> = {
    isPremium: false,
    isAdmin: false,
    role: null,
    hasValidPremium: false,
    trialStatus: { daysLeft: null, isActive: false, isExpired: false }
  };
  
  try {
    membership = await getUserMembership();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[FeedPage] Error fetching membership:", error);
    }
    // Use default values if fetch fails
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
      />
      <Header
        userEmail={user.email}
        isPremium={userIsPremium}
        isAdmin={userIsAdmin}
      />
      <div className="lg:pl-64">
        <FeedContent 
          isPremium={userIsPremium}
          hasValidPremium={hasValidPremium}
          trialExpired={trialExpired}
        />
      </div>
    </div>
  );
}


