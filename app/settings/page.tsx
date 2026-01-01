import { getUser } from "@/lib/supabase/helpers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { getUserMembership } from "@/lib/membership";
import { UpgradeButton } from "@/components/UpgradeButton";
import { ManageCategories } from "@/components/ManageCategories";
import { NotificationSettings } from "@/components/NotificationSettings";

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Tối ưu: Gộp queries membership
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
      console.error("[SettingsPage] Error fetching membership:", error);
    }
    // Use default values if fetch fails
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
                {userIsPremium ? (
                  <div className="mt-4 space-y-3">
                    <a
                      href={process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL || "https://app.lemonsqueezy.com/my-account"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-lg transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage Subscription
                    </a>
                  </div>
                ) : (
                  <div className="mt-4">
                    <UpgradeButton />
                  </div>
                )}
              </div>
            </div>

            {/* Categories Section */}
            <div className="border-b border-slate-200 dark:border-gray-700 pb-6">
              <ManageCategories isPremium={userIsPremium} />
            </div>

            {/* Notification Settings Section */}
            <div>
              <NotificationSettings />
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

