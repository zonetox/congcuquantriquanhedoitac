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
  const [feedFilter, setFeedFilter] = useState<"all" | "hotLeads" | "marketNews">("all"); // Newsfeed Filter: all, hotLeads (intent_score > 70), marketNews (signal = "Tin thị trường")
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

  const loadPosts = useCallback(async (category?: string | null, salesOpportunityOnly?: boolean, filter?: "all" | "hotLeads" | "marketNews") => {
    setLoading(true);
    const result = await getFeedPosts(category, salesOpportunityOnly, filter);
    if (result.error) {
      toast.error(result.error);
    } else {
      setPosts(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts(selectedCategory, salesOpportunityOnly, feedFilter);
  }, [selectedCategory, salesOpportunityOnly, feedFilter, loadPosts]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncFeed();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("syncSuccess", { count: result.postsCreated }));
      loadPosts(selectedCategory, salesOpportunityOnly, feedFilter);
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
      loadPosts(selectedCategory, salesOpportunityOnly, feedFilter);
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
      
      // 🔍 CONSISTENCY: Optimistic Update - Update UI ngay lập tức trước khi gọi API
      // Update healthScores state để UI phản ánh ngay lập tức
      setHealthScores((prev) => {
        const updated = { ...prev };
        if (updated[profileId]) {
          // Update status thành "healthy" (< 3 days)
          updated[profileId] = {
            status: "healthy",
            color: {
              bg: "bg-emerald-500",
              text: "text-emerald-700",
              border: "border-emerald-500",
            },
          };
        }
        return updated;
      });
      
      // Update last_contacted_at (Interaction Clock) - Background update
      updateLastContactedAt(profileId).catch((error) => {
        // Nếu update fail, revert optimistic update (optional)
        if (process.env.NODE_ENV === "development") {
          console.warn("[handleCopyLink] Failed to update last_contacted_at:", error);
        }
        // Có thể reload health score nếu cần
      });
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
      
      // 🔍 CONSISTENCY: Optimistic Update - Update UI ngay lập tức trước khi gọi API
      // Update healthScores state để UI phản ánh ngay lập tức
      setHealthScores((prev) => {
        const updated = { ...prev };
        if (updated[profileId]) {
          // Update status thành "healthy" (< 3 days)
          updated[profileId] = {
            status: "healthy",
            color: {
              bg: "bg-emerald-500",
              text: "text-emerald-700",
              border: "border-emerald-500",
            },
          };
        }
        return updated;
      });
      
      // Update last_contacted_at (Interaction Clock) - Background update
      updateLastContactedAt(profileId).catch((error) => {
        // Nếu update fail, revert optimistic update (optional)
        if (process.env.NODE_ENV === "development") {
          console.warn("[handleCopySuggestion] Failed to update last_contacted_at:", error);
        }
        // Có thể reload health score nếu cần
      });
    } catch (error) {
      toast.error("Failed to copy suggestion");
    }
  };

  // Helper function để parse AI analysis (format mới: {summary, signal, intent_score, intent, reason})
  const parseAIAnalysis = (analysis: any): { summary: string; signal: string; intent_score?: number; intent?: string; reason?: string } | null => {
    if (!analysis || typeof analysis !== "object") return null;
    return {
      summary: analysis.summary || "",
      signal: analysis.signal || "Khác",
      intent_score: typeof analysis.intent_score === "number" ? analysis.intent_score : undefined,
      intent: analysis.intent || "Neutral",
      reason: analysis.reason || "",
    };
  };

  // Helper function để parse AI suggestions (format mới: array string đơn giản)
  const parseAISuggestions = (suggestions: any): string[] => {
    if (!Array.isArray(suggestions)) return [];
    return suggestions.filter((s) => typeof s === "string" && s.trim().length > 0);
  };

  const handleRefresh = () => {
    loadPosts(selectedCategory, salesOpportunityOnly, feedFilter);
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
      {/* Header - Minimal */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Rss className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              {t("title")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <ExportButton />
            {/* Sync Button - Minimal */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("syncing")}
                </> 
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  {t("sync")}
                </>
              )}
            </button>
            {/* Refresh Button - Minimal */}
            <button
              onClick={handleRefresh}
              className="p-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar - Minimal */}
        <div className="space-y-3">
          {/* Newsfeed Filter Tabs - Sales Intelligence */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setFeedFilter("all");
                setSalesOpportunityOnly(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                feedFilter === "all"
                  ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("allPosts")}
            </button>
            <button
              onClick={() => {
                setFeedFilter("hotLeads");
                setSalesOpportunityOnly(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                feedFilter === "hotLeads"
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("hotLeads")}
            </button>
            <button
              onClick={() => {
                setFeedFilter("marketNews");
                setSalesOpportunityOnly(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                feedFilter === "marketNews"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
              }`}
            >
              {t("marketNews")}
            </button>
          </div>

          {/* Category Filter Bar */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {/* All Tab */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === null
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
                }`}
              >
                All
              </button>
            {/* Category Tabs */}
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === category.name
                      ? "text-white shadow-sm"
                      : "bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
                  }`}
                  style={
                    selectedCategory === category.name
                      ? { backgroundColor: category.color }
                      : {}
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </button>
                {/* Force Sync Button for Category */}
                <button
                  onClick={() => handleSyncCategory(category.name)}
                  disabled={syncingCategory === category.name}
                  className="p-1.5 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  title={`Force sync ${category.name}`}
                >
                  {syncingCategory === category.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Feed Posts - Minimal */}
      {posts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-12">
          <div className="text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <Rss className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {feedFilter === "hotLeads"
                  ? t("noHotLeads")
                  : feedFilter === "marketNews"
                  ? t("noMarketNews")
                  : t("emptyTitle")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {feedFilter === "hotLeads"
                  ? t("noHotLeadsMessage")
                  : feedFilter === "marketNews"
                  ? t("noMarketNewsMessage")
                  : profilesCount > 0
                  ? t("emptyMessageWithProfiles", { count: profilesCount })
                  : t("emptyMessage")}
              </p>
            </div>
            {profilesCount > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("syncing")}
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    {t("startScanning")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 p-4"
            >
              {/* Post Header - Minimal */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden">
                    <Image
                      src={getFaviconUrl(post.profile_url || "")}
                      alt={getDomainFromUrl(post.profile_url || "")}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {post.profile_title || "Unknown Profile"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {getDomainFromUrl(post.profile_url || "")}
                        </p>
                      </div>
                      {/* Health Score Badge */}
                      {healthScores[post.profile_id] && (
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${healthScores[post.profile_id].color.bg} ${healthScores[post.profile_id].color.text}`}
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
                              className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
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
                              className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
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

              {/* AI Summary - Minimal */}
              {post.ai_analysis && parseAIAnalysis(post.ai_analysis) && (
                <div className="mb-3 space-y-2">
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg p-2.5">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {parseAIAnalysis(post.ai_analysis)?.summary}
                      </p>
                    </div>
                  </div>
                  {/* Visual Highlighting: Intent Score Badges */}
                  {(() => {
                    const analysis = parseAIAnalysis(post.ai_analysis);
                    const intentScore = analysis?.intent_score || 0;
                    
                    if (intentScore > 70) {
                      // 🔥 Hot Lead - Màu đỏ
                      return (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                          <span>🔥</span>
                          <span>{t("hotLead")}</span>
                          <span className="text-red-100">({intentScore}/100)</span>
                        </div>
                      );
                    } else if (intentScore >= 40 && intentScore <= 70) {
                      // ⚡ Tiềm năng - Màu vàng
                      return (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-semibold">
                          <span>⚡</span>
                          <span>{t("potential")}</span>
                          <span className="text-yellow-800">({intentScore}/100)</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {/* Sales Signal Tag - Hiển thị nếu signal là "Cơ hội bán hàng" */}
                  {(parseAIAnalysis(post.ai_analysis)?.signal === "Cơ hội bán hàng" || 
                    parseAIAnalysis(post.ai_analysis)?.signal === "Sales Opportunity") && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold ml-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      {t("salesOpportunity")}
                    </div>
                  )}
                </div>
              )}

              {/* Post Content - Minimal */}
              <div className="space-y-2">
                {post.content && (
                  <div className="rounded-lg p-3 bg-slate-50 dark:bg-gray-700/50">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                )}

                {/* AI Reason - Lý do AI chọn (Visual Highlighting) */}
                {post.ai_analysis && parseAIAnalysis(post.ai_analysis)?.reason && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2.5 border-l-2 border-blue-400">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-0.5">{t("aiReason")}:</p>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          {parseAIAnalysis(post.ai_analysis)?.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {post.image_url && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
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

              {/* AI Ice Breakers - Minimal */}
              {post.ai_suggestions && parseAISuggestions(post.ai_suggestions).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("aiSuggestions")}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                          className="flex items-start gap-2 p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-left group"
                        >
                          <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                              {label}
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
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

              {/* Post Footer - Minimal */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-gray-700 flex-wrap">
                {/* Quick CRM: Copy Ice Breaker Button */}
                {/* 🔍 UX: Hiển thị button luôn, nhưng disable nếu chưa có ai_suggestions */}
                {(() => {
                  const hasSuggestions = post.ai_suggestions && parseAISuggestions(post.ai_suggestions).length > 0;
                  return (
                    <button
                      onClick={() => {
                        if (hasSuggestions) {
                          const firstSuggestion = parseAISuggestions(post.ai_suggestions)[0];
                          if (firstSuggestion) {
                            handleCopySuggestion(firstSuggestion, `${post.id}-quick`, post.profile_id);
                          }
                        }
                      }}
                      disabled={!hasSuggestions}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-medium text-xs ${
                        hasSuggestions
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 cursor-pointer"
                          : "bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60"
                      }`}
                      title={
                        hasSuggestions
                          ? "Copy Ice Breaker đầu tiên để săn khách ngay"
                          : "Đang chuẩn bị gợi ý phản hồi..."
                      }
                    >
                      {hasSuggestions ? (
                        <>
                          <MessageCircle className="w-4 h-4" />
                          {t("copyIceBreaker")}
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("preparing")}
                        </>
                      )}
                    </button>
                  );
                })()}
                {post.post_url && (
                  <>
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-medium text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Original
                    </a>
                    <button
                      onClick={() => handleCopyLink(post.post_url, post.id, post.profile_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-xs"
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
