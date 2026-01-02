"use client";

import { useState, useEffect, useCallback } from "react";
import { Rss, Loader2, RefreshCw, ExternalLink, Copy, Check, RotateCw, MessageCircle, Send, Lightbulb, Sparkles, AlertCircle } from "lucide-react";
import { getFeedPosts, syncFeed, syncFeedByCategory } from "@/lib/feed/actions";
import { getCategories, type Category } from "@/lib/categories/actions";
import { ExportButton } from "@/components/ExportButton";
import { updateLastContactedAt } from "@/lib/profiles/contact-actions";
import { toast } from "sonner";
import Image from "next/image";
import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils/url";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ProfilePost } from "@/lib/feed/actions";

interface FeedContentProps {
  isPremium?: boolean;
  hasValidPremium?: boolean;
  trialExpired?: boolean;
  categories?: Category[];
  profilesCount?: number;
}

export function FeedContent({ 
  isPremium = false, 
  hasValidPremium = false, 
  trialExpired = false,
  categories: initialCategories = [],
  profilesCount = 0
}: FeedContentProps) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [posts, setPosts] = useState<Array<ProfilePost & { profile_title: string; profile_url: string; profile_category: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingCategory, setSyncingCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [salesOpportunityOnly, setSalesOpportunityOnly] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [healthScores, setHealthScores] = useState<Record<string, { status: "healthy" | "warning" | "critical"; color: { bg: string; text: string; border: string } }>>({});

  // Load categories nếu chưa có
  useEffect(() => {
    if (categories.length === 0) {
      getCategories().then((result) => {
        if (result.data) {
          setCategories(result.data);
        }
      });
    }
  }, [categories.length]);

  const loadPosts = useCallback(async (category?: string | null) => {
    setLoading(true);
    const result = await getFeedPosts(category);
    if (result.error) {
      toast.error(result.error);
    } else {
      setPosts(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts(selectedCategory, salesOpportunityOnly);
  }, [selectedCategory, salesOpportunityOnly, loadPosts]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncFeed();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("syncSuccess", { count: result.postsCreated }));
      loadPosts(selectedCategory);
      router.refresh();
    }
    setSyncing(false);
  };

  const handleSyncCategory = async (category: string | null) => {
    setSyncingCategory(category);
    const result = await syncFeedByCategory(category);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("syncSuccess", { count: result.postsCreated }));
      loadPosts(selectedCategory);
      router.refresh();
    }
    setSyncingCategory(null);
  };

  const handleCopyLink = async (postUrl: string | null, postId: string, profileId: string) => {
    if (!postUrl) {
      toast.error(t("noLink"));
      return;
    }
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopiedId(postId);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopiedId(null), 2000);
      
      // Update last_contacted_at (Interaction Clock)
      await updateLastContactedAt(profileId);
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleCopySuggestion = async (text: string, suggestionId: string, profileId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestionId(suggestionId);
      toast.success(t("copySuggestion"));
      setTimeout(() => setCopiedSuggestionId(null), 2000);
      
      // Update last_contacted_at (Interaction Clock)
      await updateLastContactedAt(profileId);
    } catch (error) {
      toast.error("Failed to copy suggestion");
    }
  };

  // Helper function để parse AI analysis (format mới: {summary, signal, intent_score})
  const parseAIAnalysis = (analysis: any): { summary: string; signal: string; intent_score?: number } | null => {
    if (!analysis || typeof analysis !== "object") return null;
    return {
      summary: analysis.summary || "",
      signal: analysis.signal || "Khác",
      intent_score: typeof analysis.intent_score === "number" ? analysis.intent_score : undefined,
    };
  };

  // Helper function để parse AI suggestions (format mới: array string đơn giản)
  const parseAISuggestions = (suggestions: any): string[] => {
    if (!Array.isArray(suggestions)) return [];
    return suggestions.filter((s) => typeof s === "string" && s.trim().length > 0);
  };

  const handleRefresh = () => {
    loadPosts(selectedCategory);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header - Neumorphism Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Rss className="w-8 h-8 text-pastel-teal" />
              {t("title")}
            </h1>
            <p className="text-slate-600 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Export Button */}
            <ExportButton />
            {/* Sync Button - Neumorphism Style */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-3 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white rounded-full shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("syncing")}
                </> 
              ) : (
                <>
                  <RotateCw className="w-5 h-5" />
                  {t("sync")}
                </>
              )}
            </button>
            {/* Refresh Button - Neumorphism Style */}
            <button
              onClick={handleRefresh}
              className="p-3 neu-icon-box rounded-xl text-slate-600 hover:text-emerald-600 transition-all active:shadow-soft-button-pressed"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar - Neumorphism Style */}
        <div className="mt-6 space-y-4">
          {/* Sales Opportunity Filter */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSalesOpportunityOnly(!salesOpportunityOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                salesOpportunityOnly
                  ? "neu-button shadow-soft-button-pressed bg-gradient-to-r from-red-400 to-pink-400 text-white"
                  : "neu-button shadow-soft-out text-slate-700 hover:shadow-soft-button"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              {t("salesOpportunityOnly")}
            </button>
          </div>

          {/* Category Filter Bar */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {/* All Tab */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === null
                    ? "neu-button shadow-soft-button-pressed bg-gradient-to-r from-emerald-400 to-blue-400 text-white"
                    : "neu-button shadow-soft-out text-slate-700 hover:shadow-soft-button"
                }`}
              >
                All
              </button>
            {/* Category Tabs */}
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.name
                      ? "neu-button shadow-soft-button-pressed text-white"
                      : "neu-button shadow-soft-out text-slate-700 hover:shadow-soft-button"
                  }`}
                  style={
                    selectedCategory === category.name
                      ? { background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)` }
                      : {}
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </button>
                {/* Force Sync Button for Category */}
                <button
                  onClick={() => handleSyncCategory(category.name)}
                  disabled={syncingCategory === category.name}
                  className="p-2 neu-icon-box rounded-lg text-slate-600 hover:text-emerald-600 transition-all active:shadow-soft-button-pressed disabled:opacity-50"
                  title={`Force sync ${category.name}`}
                >
                  {syncingCategory === category.name ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCw className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Feed Posts - Neumorphism Style */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 neu-icon-box rounded-2xl flex items-center justify-center mx-auto shadow-soft-icon">
              <Rss className="w-10 h-10 text-pastel-teal" />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-800">
                {t("emptyTitle")}
              </h3>
              <p className="text-slate-600">
                {profilesCount > 0
                  ? t("emptyMessageWithProfiles", { count: profilesCount })
                  : t("emptyMessage")}
              </p>
              {profilesCount > 0 && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-6 py-3 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white rounded-full shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("syncing")}
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-5 h-5" />
                      {t("startScanning")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="neu-card rounded-neu-lg shadow-soft-out hover:shadow-soft-card transition-all duration-300 p-6"
            >
              {/* Post Header - Neumorphism Style */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 neu-icon-box rounded-xl flex items-center justify-center shadow-soft-icon p-2">
                    <Image
                      src={getFaviconUrl(post.profile_url || "")}
                      alt={getDomainFromUrl(post.profile_url || "")}
                      width={48}
                      height={48}
                      className="w-full h-full rounded-lg object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {post.profile_title || "Unknown Profile"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {getDomainFromUrl(post.profile_url || "")}
                        </p>
                      </div>
                      {/* Health Score Badge */}
                      {healthScores[post.profile_id] && (
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-semibold shadow-soft-out ${healthScores[post.profile_id].color.bg} ${healthScores[post.profile_id].color.text}`}
                          title={
                            healthScores[post.profile_id].status === "healthy"
                              ? "Healthy relationship (< 3 days)"
                              : healthScores[post.profile_id].status === "warning"
                              ? "Needs attention (3-7 days)"
                              : "Critical - needs immediate interaction (> 7 days)"
                          }
                        >
                          {healthScores[post.profile_id].status === "healthy"
                            ? "✓"
                            : healthScores[post.profile_id].status === "warning"
                            ? "!"
                            : "⚠"}
                        </div>
                      )}
                      {/* Interaction Clock Badge - "Cần chăm sóc" nếu > 7 days */}
                      {(() => {
                        const profileLastContacted = (post as any).profile_last_contacted_at;
                        if (!profileLastContacted) {
                          // Nếu chưa có last_contacted_at, hiển thị badge "Cần chăm sóc"
                          return (
                            <div
                              className="px-2 py-1 rounded-full text-xs font-semibold shadow-soft-out bg-red-100 text-red-700 border border-red-300 animate-pulse"
                              title="Chưa từng liên hệ. Cần chăm sóc ngay!"
                            >
                              🚨 {t("needsCare", { defaultValue: "Cần chăm sóc" })}
                            </div>
                          );
                        }
                        
                        const daysSinceContact = Math.floor(
                          (Date.now() - new Date(profileLastContacted).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        
                        if (daysSinceContact > 7) {
                          return (
                            <div
                              className="px-2 py-1 rounded-full text-xs font-semibold shadow-soft-out bg-red-100 text-red-700 border border-red-300"
                              title={`Chưa liên hệ ${daysSinceContact} ngày. Cần chăm sóc ngay!`}
                            >
                              🚨 {t("needsCare", { defaultValue: "Cần chăm sóc" })}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {post.published_at && (
                      <time className="text-xs text-slate-400 whitespace-nowrap ml-4">
                        {formatDate(post.published_at)}
                      </time>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary - Neumorphism Style */}
              {post.ai_analysis && parseAIAnalysis(post.ai_analysis) && (
                <div className="mb-4 space-y-2">
                  <div className="bg-gradient-to-r from-pastel-mint/30 to-pastel-purple/30 rounded-lg p-3 shadow-soft-in">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-pastel-purple flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 font-medium">
                        {parseAIAnalysis(post.ai_analysis)?.summary}
                      </p>
                    </div>
                  </div>
                  {/* Sales Signal Tag - Hiển thị nếu signal là "Cơ hội bán hàng" hoặc "Sales Opportunity" */}
                  {(parseAIAnalysis(post.ai_analysis)?.signal === "Cơ hội bán hàng" || 
                    parseAIAnalysis(post.ai_analysis)?.signal === "Sales Opportunity") && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold shadow-soft-out">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      {t("salesOpportunity")}
                      {parseAIAnalysis(post.ai_analysis)?.intent_score && (
                        <span className="ml-1">
                          (Intent: {parseAIAnalysis(post.ai_analysis)?.intent_score}/100)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Post Content - Neumorphism Style */}
              <div className="space-y-4">
                {post.content && (
                  <div className="neu-input rounded-lg p-4">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                )}

                {post.image_url && (
                  <div className="rounded-neu-lg overflow-hidden neu-card shadow-soft-out">
                    <Image
                      src={post.image_url}
                      alt={post.content || "Post image"}
                      width={800}
                      height={400}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {/* AI Ice Breakers - Neumorphism Style */}
              {post.ai_suggestions && parseAISuggestions(post.ai_suggestions).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-pastel-purple" />
                    <h4 className="text-sm font-semibold text-slate-700">{t("aiSuggestions")}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {parseAISuggestions(post.ai_suggestions).slice(0, 3).map((suggestionText, idx) => {
                      const suggestionId = `${post.id}-${idx}`;
                      const icons = [MessageCircle, Send, Lightbulb];
                      const labels = [t("publicComment"), t("privateMessage"), t("engagingQuestion")];
                      const Icon = icons[idx] || MessageCircle;
                      const label = labels[idx] || t("aiSuggestions");
                      const isCopied = copiedSuggestionId === suggestionId;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleCopySuggestion(suggestionText, suggestionId, post.profile_id)}
                          className="flex items-start gap-2 p-3 neu-button rounded-lg shadow-soft-out hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all text-left group"
                        >
                          <Icon className="w-4 h-4 text-pastel-purple flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-600 mb-1">
                              {label}
                            </p>
                            <p className="text-xs text-slate-700 line-clamp-2">
                              {suggestionText}
                            </p>
                            {isCopied && (
                              <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs">
                                <Check className="w-3 h-3" />
                                <span>{t("copied")}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Post Footer - Neumorphism Style */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
                {post.post_url && (
                  <>
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 neu-button text-emerald-600 hover:text-emerald-700 rounded-lg shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all font-medium text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Original
                    </a>
                    <button
                      onClick={() => handleCopyLink(post.post_url, post.id, post.profile_id)}
                      className="flex items-center gap-2 px-4 py-2 neu-icon-box text-slate-600 hover:text-slate-800 rounded-lg shadow-soft-icon hover:shadow-soft-button transition-all active:shadow-soft-button-pressed text-sm"
                    >
                      {copiedId === post.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
