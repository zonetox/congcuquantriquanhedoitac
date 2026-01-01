import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/helpers";
import { getUserMembership } from "@/lib/membership";
import { getAllProfiles } from "@/lib/profiles/admin-actions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

// Force dynamic rendering to avoid next-intl config issues during build
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Kiểm tra authentication
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Kiểm tra admin role và membership (tối ưu: 1 query thay vì 2)
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
      console.error("[AdminPage] Error fetching membership:", error);
    }
    // Use default values if fetch fails
  }

  if (!membership.isAdmin) {
    redirect("/");
  }

  // Lấy tất cả profiles
  let profiles = null;
  let error = null;
  
  try {
    const result = await getAllProfiles();
    profiles = result.data;
    error = result.error;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[AdminPage] Error fetching profiles:", err);
    }
    error = "Failed to load profiles";
  }

  const userIsPremium = membership.isPremium;
  const userIsAdmin = membership.isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
        <div className="lg:pt-0">
          <AdminDashboard profiles={profiles || []} error={error} />
        </div>
      </div>
    </div>
  );
}

