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
 * Module 4.4: Hỗ trợ nhiều format response từ các RapidAPI providers khác nhau
 */
function mapRapidAPIResponse(apiResponse: any, platform: string): ScrapedPost[] {
  const posts: ScrapedPost[] = [];

  try {
    // Format response khác nhau tùy platform
    if (platform === "facebook") {
      // Facebook Public Page Scraper format (facebook-scraper3.p.rapidapi.com)
      // Có thể có nhiều format khác nhau tùy API provider
      
      // Format 1: { data: [...] }
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        apiResponse.data.forEach((post: any) => {
          posts.push({
            text: post.message || post.text || post.content || post.description || "",
            image: post.image || post.picture || post.full_picture || null,
            link: post.permalink_url || post.link || post.url || post.id ? `https://www.facebook.com/${post.id}` : "",
            timestamp: post.created_time || post.timestamp || post.created_at || new Date().toISOString(),
          });
        });
      }
      // Format 2: { posts: [...] }
      else if (apiResponse.posts && Array.isArray(apiResponse.posts)) {
        apiResponse.posts.forEach((post: any) => {
          posts.push({
            text: post.message || post.text || post.content || post.description || "",
            image: post.image || post.picture || post.full_picture || null,
            link: post.permalink_url || post.link || post.url || post.id ? `https://www.facebook.com/${post.id}` : "",
            timestamp: post.created_time || post.timestamp || post.created_at || new Date().toISOString(),
          });
        });
      }
      // Format 3: Array trực tiếp
      else if (Array.isArray(apiResponse)) {
        apiResponse.forEach((post: any) => {
          posts.push({
            text: post.message || post.text || post.content || post.description || "",
            image: post.image || post.picture || post.full_picture || null,
            link: post.permalink_url || post.link || post.url || post.id ? `https://www.facebook.com/${post.id}` : "",
            timestamp: post.created_time || post.timestamp || post.created_at || new Date().toISOString(),
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
 * Fetch social posts từ URL sử dụng RapidAPI Facebook Public Page Scraper
 * Module 4.4: Scraper Engine thực tế với Shared Logic
 * 
 * @param url - Facebook Page URL (e.g., https://www.facebook.com/PageName)
 * @returns ScrapedPost[] hoặc error
 */
export async function fetchSocialPosts(
  url: string
): Promise<{
  data: ScrapedPost[] | null;
  error: string | null;
}> {
  try {
    // Detect platform từ URL
    const platform = detectPlatform(url);
    
    if (platform === "unknown") {
      return {
        data: null,
        error: "Unsupported platform. Supported: Facebook, LinkedIn, Twitter.",
      };
    }

    // RapidAPI endpoints configuration
    // Provider trong api_key_pool nên là "RapidAPI"
    // Host sẽ được truyền vào fetchWithRotation
    const apiEndpoints: Record<string, { url: string; host: string; params: Record<string, string> }> = {
      facebook: {
        url: "https://facebook-scraper3.p.rapidapi.com/page/posts",
        host: "facebook-scraper3.p.rapidapi.com",
        params: {
          url: url,
          limit: "10",
        },
      },
      linkedin: {
        url: "https://linkedin-api8.p.rapidapi.com/v1/posts",
        host: "linkedin-api8.p.rapidapi.com",
        params: {
          profile_url: url,
          limit: "10",
        },
      },
      twitter: {
        url: "https://twitter-api45.p.rapidapi.com/v1/timeline",
        host: "twitter-api45.p.rapidapi.com",
        params: {
          username: new URL(url).pathname.split("/").pop() || "",
          limit: "10",
        },
      },
    };

    const endpoint = apiEndpoints[platform];
    if (!endpoint) {
      return {
        data: null,
        error: `No API endpoint configured for platform: ${platform}`,
      };
    }

    // Build API URL với query params
    const apiUrl = new URL(endpoint.url);
    Object.entries(endpoint.params).forEach(([key, value]) => {
      apiUrl.searchParams.set(key, value);
    });

    // Fetch với rotation (provider = "RapidAPI", host = endpoint.host)
    const result = await fetchWithRotation(
      "RapidAPI", // Provider name trong api_key_pool
      apiUrl.toString(),
      {
        method: "GET",
      },
      3, // maxRetries
      endpoint.host // RapidAPI Host
    );

    if (result.error || !result.data) {
      return {
        data: null,
        error: result.error || "Failed to fetch posts from API",
      };
    }

    // Map response
    const posts = mapRapidAPIResponse(result.data, platform);

    return {
      data: posts,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchSocialPosts] Error:", error);
    }
    return {
      data: null,
      error: error.message || "Failed to fetch posts",
    };
  }
}

/**
 * Fetch latest posts từ profile URL sử dụng RapidAPI
 * @deprecated - Dùng fetchSocialPosts() thay thế (Module 4.4)
 */
export async function fetchLatestPosts(
  profileUrl: string,
  platform?: string
): Promise<{
  data: ScrapedPost[] | null;
  error: string | null;
}> {
  // Delegate to fetchSocialPosts
  return fetchSocialPosts(profileUrl);
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

