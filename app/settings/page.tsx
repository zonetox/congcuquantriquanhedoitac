import { getUser } from "@/lib/supabase/helpers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { getUserMembership } from "@/lib/membership";
import { UpgradeButton } from "@/components/UpgradeButton";
import { ManageCategories } from "@/components/ManageCategories";

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Tối ưu: Gộp queries membership
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Settings
          </h1>

          <div className="space-y-6">
            {/* Account Section */}
            <div className="border-b border-slate-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Account
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Email
                  </label>
                  <p className="text-slate-900 dark:text-white mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="border-b border-slate-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Subscription
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Plan
                  </label>
                  <div className="mt-2">
                    {userIsPremium ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900">
                        ✨ Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300">
                        Free
                      </span>
                    )}
                  </div>
                </div>
                {!userIsPremium && (
                  <div className="mt-4">
                    <UpgradeButton />
                  </div>
                )}
              </div>
            </div>

            {/* Categories Section */}
            <div>
              <ManageCategories isPremium={userIsPremium} />
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

