/**
 * Social Media Scraper
 * Fetch latest posts từ các social media platforms sử dụng RapidAPI
 */

"use server";

import { fetchWithRotation } from "./api-rotator";
import { createClient } from "@/lib/supabase/server";
import { analyzePostWithAI } from "@/lib/ai/analyzer";

export interface ScrapedPost {
  text: string;
  image?: string | null;
  link: string;
  timestamp: string | number | Date;
}

/**
 * Detect platform từ URL
 */
function detectPlatform(url: string): "facebook" | "linkedin" | "twitter" | "unknown" {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) {
    return "facebook";
  }
  if (lowerUrl.includes("linkedin.com")) {
    return "linkedin";
  }
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return "twitter";
  }
  return "unknown";
}

/**
 * Map RapidAPI response vào ScrapedPost format
 */
function mapRapidAPIResponse(apiResponse: any, platform: string): ScrapedPost[] {
  const posts: ScrapedPost[] = [];

  try {
    // Format response khác nhau tùy platform
    if (platform === "facebook") {
      // Facebook Public Page Scraper format
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        apiResponse.data.forEach((post: any) => {
          posts.push({
            text: post.message || post.text || post.content || "",
            image: post.image || post.picture || null,
            link: post.permalink_url || post.link || post.url || "",
            timestamp: post.created_time || post.timestamp || new Date().toISOString(),
          });
        });
      }
    } else if (platform === "linkedin") {
      // LinkedIn Scraper format
      if (apiResponse.posts && Array.isArray(apiResponse.posts)) {
        apiResponse.posts.forEach((post: any) => {
          posts.push({
            text: post.text || post.content || "",
            image: post.image || null,
            link: post.url || post.link || "",
            timestamp: post.publishedAt || post.timestamp || new Date().toISOString(),
          });
        });
      }
    } else if (platform === "twitter") {
      // Twitter Scraper format
      if (apiResponse.tweets && Array.isArray(apiResponse.tweets)) {
        apiResponse.tweets.forEach((tweet: any) => {
          posts.push({
            text: tweet.text || tweet.content || "",
            image: tweet.media?.[0]?.url || null,
            link: tweet.url || `https://twitter.com/i/web/status/${tweet.id}` || "",
            timestamp: tweet.created_at || tweet.timestamp || new Date().toISOString(),
          });
        });
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[mapRapidAPIResponse] Error mapping response:", error);
    }
  }

  return posts;
}

/**
 * Fetch latest posts từ profile URL sử dụng RapidAPI
 */
export async function fetchLatestPosts(
  profileUrl: string,
  platform?: string
): Promise<{
  data: ScrapedPost[] | null;
  error: string | null;
}> {
  const detectedPlatform = platform || detectPlatform(profileUrl);

  if (detectedPlatform === "unknown") {
    return {
      data: null,
      error: "Unsupported platform. Supported: Facebook, LinkedIn, Twitter.",
    };
  }

  try {
    // RapidAPI endpoints (cần cấu hình trong api_key_pool)
    const apiEndpoints: Record<string, { url: string; provider: string }> = {
      facebook: {
        url: "https://facebook-scraper-api.p.rapidapi.com/v1/page-posts",
        provider: "facebook-scraper-api.p.rapidapi.com",
      },
      linkedin: {
        url: "https://linkedin-api8.p.rapidapi.com/v1/posts",
        provider: "linkedin-api8.p.rapidapi.com",
      },
      twitter: {
        url: "https://twitter-api45.p.rapidapi.com/v1/timeline",
        provider: "twitter-api45.p.rapidapi.com",
      },
    };

    const endpoint = apiEndpoints[detectedPlatform];
    if (!endpoint) {
      return {
        data: null,
        error: `No API endpoint configured for platform: ${detectedPlatform}`,
      };
    }

    // Build API URL với query params
    const apiUrl = new URL(endpoint.url);
    if (detectedPlatform === "facebook") {
      apiUrl.searchParams.set("url", profileUrl);
      apiUrl.searchParams.set("limit", "10");
    } else if (detectedPlatform === "linkedin") {
      apiUrl.searchParams.set("profile_url", profileUrl);
      apiUrl.searchParams.set("limit", "10");
    } else if (detectedPlatform === "twitter") {
      apiUrl.searchParams.set("username", new URL(profileUrl).pathname.split("/").pop() || "");
      apiUrl.searchParams.set("limit", "10");
    }

    // Fetch với rotation
    const result = await fetchWithRotation(
      endpoint.provider,
      apiUrl.toString(),
      {
        method: "GET",
      },
      3
    );

    if (result.error || !result.data) {
      return {
        data: null,
        error: result.error || "Failed to fetch posts from API",
      };
    }

    // Map response
    const posts = mapRapidAPIResponse(result.data, detectedPlatform);

    return {
      data: posts,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchLatestPosts] Error:", error);
    }
    return {
      data: null,
      error: error.message || "Failed to fetch posts",
    };
  }
}

/**
 * Save scraped posts vào database với upsert (tránh trùng lặp)
 * SHARED SCRAPING: Không cần userId nữa, posts được lưu chung cho tất cả users
 */
export async function saveScrapedPosts(
  profileId: string,
  posts: ScrapedPost[]
): Promise<{
  saved: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = await createClient();
  let saved = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      // Parse timestamp
      let publishedAt: string;
      if (typeof post.timestamp === "string") {
        publishedAt = new Date(post.timestamp).toISOString();
      } else if (typeof post.timestamp === "number") {
        publishedAt = new Date(post.timestamp * 1000).toISOString();
      } else {
        publishedAt = new Date(post.timestamp).toISOString();
      }

      // Check xem post đã tồn tại chưa (dựa trên post_url và profile_id)
      let existingPost = null;
      if (post.link) {
        const { data: existing } = await supabase
          .from("profile_posts")
          .select("id")
          .eq("profile_id", profileId)
          .eq("post_url", post.link)
          .maybeSingle();
        
        existingPost = existing;
      }

      let postId: string | null = null;

      if (existingPost) {
        // Post đã tồn tại, skip
        skipped++;
        postId = existingPost.id;
      } else {
        // Insert post mới (không còn user_id - shared scraping)
        const { data: newPost, error: insertError } = await supabase
          .from("profile_posts")
          .insert({
            profile_id: profileId,
            content: post.text || null,
            post_url: post.link || null,
            image_url: post.image || null,
            published_at: publishedAt,
          })
          .select()
          .single();

        if (insertError) {
          // Nếu lỗi do duplicate (có thể xảy ra trong race condition), skip
          if (insertError.code === "23505" || insertError.message?.includes("duplicate")) {
            skipped++;
          } else {
            errors.push(`Failed to save post: ${insertError.message}`);
          }
          continue;
        }

        if (newPost) {
          saved++;
          postId = newPost.id;
        }
      }

      // Tự động phân tích với AI nếu có content và post mới được tạo
      // SHARED SCRAPING: Chỉ phân tích nếu chưa có AI analysis (tiết kiệm chi phí)
      if (postId && post.text && post.text.trim().length > 0 && !existingPost) {
        // Check xem post đã có AI analysis chưa (có thể từ user khác đã phân tích)
        const { data: existingPostData } = await supabase
          .from("profile_posts")
          .select("ai_analysis")
          .eq("id", postId)
          .single();

        // Chỉ phân tích nếu chưa có AI analysis
        if (!existingPostData?.ai_analysis) {
          const aiResult = await analyzePostWithAI(post.text, undefined, postId);
          if (aiResult.data) {
          // Update post với AI analysis (shared cho tất cả users)
          // AI Radar: Lưu intent và reason (Contextual Prompting)
          await supabase
            .from("profile_posts")
            .update({
              ai_analysis: {
                summary: aiResult.data.summary,
                signal: aiResult.data.signal,
                opportunity_score: aiResult.data.opportunity_score,
                intent_score: aiResult.data.intent_score,
                intent: aiResult.data.intent, // AI Radar: Hot Lead, Warm Lead, Information, Neutral
                reason: aiResult.data.reason, // AI Radar: Giải thích ngắn gọn
                keywords: aiResult.data.keywords, // Deprecated - giữ lại để tương thích
              },
              ai_suggestions: aiResult.data.ice_breakers,
            })
            .eq("id", postId);
          }
        }
      }
    } catch (error: any) {
      errors.push(`Error processing post: ${error.message}`);
    }
  }

  return {
    saved,
    skipped,
    errors,
  };
}

