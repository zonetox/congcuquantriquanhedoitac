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

  const membership = await getUserMembership();
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
        <FeedContent />
      </div>
    </div>
  );
}


