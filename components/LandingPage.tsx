"use client";

import Link from "next/link";
import { ArrowRight, Radio, Clock, DollarSign, Zap, MessageSquare } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen neu-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 pt-20 pb-16">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-800 leading-tight">
              Stop Drowning in Tabs.
              <br />
              <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                Build Stronger Relationships.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              All important profiles of competitors, partners, and customers on a single screen. No ads, no distractions.
            </p>
          </div>

          {/* CTA Button - Neumorphism Style */}
          <div className="pt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-10 py-5 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white text-lg font-semibold rounded-full shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95"
            >
              Get Started for Free
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
              Lost in Newsfeed
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Facebook/LinkedIn algorithms hide posts from important people if you don't interact frequently.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Partner Center scans profiles directly, ensuring you never miss updates from business-critical contacts.
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
              Time Waste
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Spending 2 hours daily scrolling through 5 social networks just to check what 20 partners/customers are doing.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Just 5 minutes on Partner Center's focused Newsfeed. Time saved = Money earned.
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
              High Cost
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Bulky Social Listening systems cost $200+/month, too expensive for individuals and SMEs.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  A lean, "just enough" tool with pricing starting from just $5 - $10/month.
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
              Missed Opportunities
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  The Problem:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  You know customers posted, but don't know what to say, or miss when they're showing buying signals.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-600 mb-2">
                  The Solution:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  AI Ice Breaker suggests response templates, and AI Sales Signals alerts you instantly when purchase intent is detected in posts.
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
