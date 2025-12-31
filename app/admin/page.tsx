import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/helpers";
import { getUserMembership } from "@/lib/membership";
import { getAllProfiles } from "@/lib/profiles/admin-actions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function AdminPage() {
  // Kiểm tra authentication
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Kiểm tra admin role và membership (tối ưu: 1 query thay vì 2)
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    redirect("/");
  }

  // Lấy tất cả profiles
  const { data: profiles, error } = await getAllProfiles();
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

