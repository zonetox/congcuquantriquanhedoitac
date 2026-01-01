"use client";

import Link from "next/link";
import { ArrowRight, Radio, Clock, DollarSign, Zap, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

export function LandingPage() {
  const t = useTranslations("landing");
  return (
    <div className="min-h-screen neu-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 pt-20 pb-16">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-800 leading-tight">
              {t("title")}
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* CTA Button - Neumorphism Style */}
          <div className="pt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-10 py-5 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white text-lg font-semibold rounded-full shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95"
            >
              {t("getStarted")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Features Section - 4 Pain Points & Solutions - Neumorphism Style */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
          {/* Card 1: Lost in Newsfeed */}
          <div className="neu-card rounded-neu-lg p-8 shadow-soft-out hover:shadow-soft-card transition-all duration-300">
            <div className="w-16 h-16 neu-icon-box rounded-2xl flex items-center justify-center mb-6">
              <Radio className="w-8 h-8 text-pastel-pink" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {t("painPoint1.title")}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint1.description")}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint1.solution")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Time Waste */}
          <div className="neu-card rounded-neu-lg p-8 shadow-soft-out hover:shadow-soft-card transition-all duration-300">
            <div className="w-16 h-16 neu-icon-box rounded-2xl flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-pastel-teal" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {t("painPoint2.title")}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint2.description")}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint2.solution")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Cost */}
          <div className="neu-card rounded-neu-lg p-8 shadow-soft-out hover:shadow-soft-card transition-all duration-300">
            <div className="w-16 h-16 neu-icon-box rounded-2xl flex items-center justify-center mb-6">
              <DollarSign className="w-8 h-8 text-pastel-mint" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {t("painPoint3.title")}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint3.description")}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint3.solution")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Missed Opportunities */}
          <div className="neu-card rounded-neu-lg p-8 shadow-soft-out hover:shadow-soft-card transition-all duration-300">
            <div className="w-16 h-16 neu-icon-box rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8 text-pastel-purple" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              {t("painPoint4.title")}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint4.description")}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {t("painPoint4.solution")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section - Neumorphism Style */}
        <div className="py-16">
          <div className="text-center space-y-8">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Trusted by Sales Teams at Top Companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-40">
              {/* Company Logos - Placeholder */}
              <div className="text-2xl font-bold text-slate-400">Microsoft</div>
              <div className="text-2xl font-bold text-slate-400">Google</div>
              <div className="text-2xl font-bold text-slate-400">Salesforce</div>
              <div className="text-2xl font-bold text-slate-400">HubSpot</div>
              <div className="text-2xl font-bold text-slate-400">Oracle</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
