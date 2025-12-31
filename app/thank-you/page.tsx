import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getUser } from "@/lib/supabase/helpers";
import { getUserMembership } from "@/lib/membership";

export default async function ThankYouPage() {
  const user = await getUser();
  const membership = await getUserMembership();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {user && (
        <>
          <Sidebar
            userEmail={user.email}
            isPremium={membership.isPremium}
            isAdmin={membership.isAdmin}
          />
          <Header
            userEmail={user.email}
            isPremium={membership.isPremium}
            isAdmin={membership.isAdmin}
          />
        </>
      )}
      <div className={user ? "lg:pl-64" : ""}>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Payment Successful!
            </h1>

            {/* Message */}
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Your account has been upgraded to Premium. You now have access to all premium features.
            </p>

            {/* Features List */}
            <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8 text-left">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
                Premium Features Unlocked:
              </h2>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Unlimited profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>All categories (including Competitor)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Strategic notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>AI updates (coming soon)</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

