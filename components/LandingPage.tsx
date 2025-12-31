"use client";

import Link from "next/link";
import { ArrowRight, Focus, Zap, FileText } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 pt-20 pb-16">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
              Stop Drowning in Tabs.
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Build Stronger Relationships.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Tất cả profile quan trọng của đối thủ, đối tác và khách hàng trên một màn hình duy nhất. Không quảng cáo, không xao nhãng.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-lg font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {/* Feature 1: Focus Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl flex items-center justify-center mb-6">
              <Focus className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Focus Mode
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Xem cập nhật từ các profile mà không bị cuốn vào newsfeed giải trí.
            </p>
          </div>

          {/* Feature 2: One-Click Access */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              One-Click Access
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Mở nhanh mọi nền tảng Social chỉ với 1 click.
            </p>
          </div>

          {/* Feature 3: Strategic Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-slate-100 dark:border-gray-700">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/30 dark:to-slate-700/30 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Strategic Notes
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Ghi chú chiến lược cho từng mối quan hệ.
            </p>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="py-16 border-t border-slate-200 dark:border-gray-700">
          <div className="text-center space-y-8">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Trusted by Sales Teams at Top Companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-40 grayscale">
              {/* Company Logos - Placeholder */}
              <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">Microsoft</div>
              <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">Google</div>
              <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">Salesforce</div>
              <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">HubSpot</div>
              <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">Oracle</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
