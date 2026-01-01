"use client";

import { useState, useEffect, useCallback } from "react";
import { Rss, Loader2, RefreshCw } from "lucide-react";
import { getFeedPosts } from "@/lib/feed/actions";
import { toast } from "sonner";
import Image from "next/image";
import { getFaviconUrl, getDomainFromUrl } from "@/lib/utils/url";
import type { FeedPost } from "@/lib/feed/types";

export function FeedContent() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const result = await getFeedPosts(pageNum);
    if (result.error) {
      toast.error(result.error);
    } else {
      const newPosts = result.data || [];
      if (append) {
        setPosts((prev) => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      setHasMore(newPosts.length === 20); // Giả sử mỗi page có 20 posts
    }

    if (append) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(1);
    setPosts([]);
    loadPosts(1, false);
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Rss className="w-8 h-8 text-emerald-600" />
              Newsfeed
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Latest updates from your tracked profiles
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Feed Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
              <Rss className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                No posts yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Add profiles to your feed by toggling the RSS icon on profile cards.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
            >
              {/* Post Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <Image
                    src={getFaviconUrl(post.profile_url)}
                    alt={getDomainFromUrl(post.profile_url)}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-slate-200 dark:border-gray-700"
                    loading="lazy"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {post.profile_title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {getDomainFromUrl(post.profile_url)}
                      </p>
                    </div>
                    <time className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-3">
                {post.title && (
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    {post.title}
                  </h4>
                )}
                {post.content && (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">
                    {post.content}
                  </p>
                )}
                {post.image_url && (
                  <div className="rounded-lg overflow-hidden">
                    <Image
                      src={post.image_url}
                      alt={post.title || "Post image"}
                      width={800}
                      height={400}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                )}
                {post.link && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-sm"
                  >
                    Read more →
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}


