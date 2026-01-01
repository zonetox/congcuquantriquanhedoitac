"use client";

import Link from "next/link";
import { ArrowRight, Radio, Clock, DollarSign, Zap, CheckCircle2, XCircle } from "lucide-react";

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
            Partner Center: Your AI Assistant to{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Care for the Right People, Close Deals at the Right Time.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Never miss a critical update. Never waste time. Never miss a sales opportunity.
          </p>
        </div>

        {/* Why You Need Us Section */}
        <div className="mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg border border-slate-100 dark:border-gray-700">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              Why You Need Us?
            </h2>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="text-lg">
                Social media algorithms are silently sabotaging your business relationships.
              </p>
              <p>
                Every day, Facebook and LinkedIn's algorithms decide what you see and what you don't. 
                If you haven't interacted with someone recently—even if they're your most important client 
                or partner—their posts get buried in your feed. You might see 20% of their updates, 
                or worse, none at all.
              </p>
              <p>
                This isn't just inconvenient—it's costing you deals. While you're scrolling through 
                irrelevant content, your competitors are responding to opportunities you never even saw. 
                While you're manually checking 5 different platforms for 2 hours daily, your sales 
                pipeline is leaking.
              </p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                Partner Center bypasses the algorithm. We scan profiles directly, ensuring 100% visibility 
                of updates from your business-critical contacts. No more missed posts. No more wasted time. 
                No more lost opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Traditional Method vs. Partner Center
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Criteria
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Traditional Method
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      With Partner Center (AI)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Post Visibility Rate
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        &lt; 20% (Due to algorithm)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        100% (Direct scan)
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Daily Time Investment
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        120 - 180 minutes
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        5 - 10 minutes
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Monthly Cost
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        $200+ or free but ineffective
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        $5 - $10 (Optimized ROI)
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Conversation Response
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Manual thinking, easy to delay or miss
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        AI suggests response templates instantly
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-8 md:p-12 shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Transform Your Partner Management?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Start your 15-day free trial today. No credit card required. 
              See the difference AI-powered relationship management makes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-emerald-600 text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              Start Your 15-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

