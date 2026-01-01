"use client";

import { useState, useEffect, useCallback } from "react";
import { Rss, Loader2, RefreshCw, ExternalLink, Copy, Check, RotateCw, MessageCircle, Send, Lightbulb, Sparkles, AlertCircle } from "lucide-react";
import { getFeedPosts, syncFeed } from "@/lib/feed/actions";
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
}

export function FeedContent({ isPremium = false, hasValidPremium = false, trialExpired = false }: FeedContentProps) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [posts, setPosts] = useState<Array<ProfilePost & { profile_title: string; profile_url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSuggestionId, setCopiedSuggestionId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const result = await getFeedPosts();
    if (result.error) {
      toast.error(result.error);
    } else {
      setPosts(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncFeed();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("syncSuccess", { count: result.postsCreated }));
      loadPosts();
      router.refresh();
    }
    setSyncing(false);
  };

  const handleCopyLink = async (postUrl: string | null, postId: string) => {
    if (!postUrl) {
      toast.error(t("noLink"));
      return;
    }
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopiedId(postId);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleCopySuggestion = async (text: string, suggestionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuggestionId(suggestionId);
      toast.success(t("copySuggestion"));
      setTimeout(() => setCopiedSuggestionId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy suggestion");
    }
  };

  // Helper function để parse AI analysis (format mới: {summary, signal})
  const parseAIAnalysis = (analysis: any): { summary: string; signal: string } | null => {
    if (!analysis || typeof analysis !== "object") return null;
    return {
      summary: analysis.summary || "",
      signal: analysis.signal || "Khác",
    };
  };

  // Helper function để parse AI suggestions (format mới: array string đơn giản)
  const parseAISuggestions = (suggestions: any): string[] => {
    if (!Array.isArray(suggestions)) return [];
    return suggestions.filter((s) => typeof s === "string" && s.trim().length > 0);
  };

  const handleRefresh = () => {
    loadPosts();
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
      </div>

      {/* Feed Posts - Neumorphism Style */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 neu-icon-box rounded-2xl flex items-center justify-center mx-auto shadow-soft-icon">
              <Rss className="w-10 h-10 text-pastel-teal" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">
                No posts yet
              </h3>
              <p className="text-slate-600">
                Click &quot;Sync Feed&quot; to fetch posts from your tracked profiles, or enable &quot;Show in Newsfeed&quot; on profile cards.
              </p>
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
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {post.profile_title || "Unknown Profile"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {getDomainFromUrl(post.profile_url || "")}
                      </p>
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
                          onClick={() => handleCopySuggestion(suggestionText, suggestionId)}
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
                      onClick={() => handleCopyLink(post.post_url, post.id)}
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
