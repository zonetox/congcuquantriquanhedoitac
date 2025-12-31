import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/helpers";
import { isAdmin, isPremium } from "@/lib/membership";
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

  // Kiểm tra admin role
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/");
  }

  // Lấy tất cả profiles
  const { data: profiles, error } = await getAllProfiles();
  const userIsPremium = await isPremium();

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

