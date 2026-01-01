import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/helpers";
import { getUserMembership } from "@/lib/membership";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ApiKeyManagement } from "@/components/admin/ApiKeyManagement";

export default async function ApiKeysPage() {
  // Kiểm tra authentication
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Kiểm tra admin role
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    redirect("/");
  }

  const userIsPremium = membership.isPremium;
  const userIsAdmin = membership.isAdmin;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ApiKeyManagement />
        </div>
      </div>
    </div>
  );
}

