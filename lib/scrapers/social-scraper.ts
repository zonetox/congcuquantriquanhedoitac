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

    // 🔍 API LEAK CHECK: Log khi fetchSocialPosts được gọi (chỉ khi thực sự gọi API)
    const timestamp = new Date().toISOString();
    console.log(`[SCRAPER API] ${timestamp} | Platform: ${platform} | URL: ${url} | Endpoint: ${endpoint.url}`);
    
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
      console.error(`[SCRAPER API ERROR] ${timestamp} | Platform: ${platform} | URL: ${url} | Error: ${result.error}`);
      return {
        data: null,
        error: result.error || "Failed to fetch posts from API",
      };
    }
    
    console.log(`[SCRAPER API SUCCESS] ${timestamp} | Platform: ${platform} | URL: ${url} | Posts fetched: ${mapRapidAPIResponse(result.data, platform).length}`);

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
  
  // 🔍 AI QUEUE CHECK: Collect posts cần AI analysis để xử lý batch
  interface PostNeedingAI {
    postId: string;
    text: string;
  }
  const postsNeedingAI: PostNeedingAI[] = [];

  // BƯỚC 1: Lưu tất cả posts vào database (không gọi AI ngay)
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

      // 🔍 DATA INTEGRITY: Sử dụng UPSERT để tránh duplicate posts (race condition safe)
      // UNIQUE constraint trên (profile_id, post_url) đảm bảo không có duplicate
      let postId: string | null = null;

      if (post.link) {
        // UPSERT: Insert nếu chưa có, update nếu đã có (dựa trên UNIQUE constraint)
        const { data: upsertedPost, error: upsertError } = await supabase
          .from("profile_posts")
          .upsert(
            {
              profile_id: profileId,
              content: post.text || null,
              post_url: post.link, // Required for UNIQUE constraint
              image_url: post.image || null,
              published_at: publishedAt,
            },
            {
              onConflict: "profile_id,post_url", // Conflict resolution dựa trên UNIQUE constraint
              ignoreDuplicates: false, // Update nếu đã tồn tại
            }
          )
          .select()
          .single();

        if (upsertError) {
          // Nếu lỗi do duplicate (có thể xảy ra trong race condition), skip
          if (upsertError.code === "23505" || upsertError.message?.includes("duplicate")) {
            skipped++;
            // Vẫn cần lấy postId để có thể analyze AI sau
            const { data: existing } = await supabase
              .from("profile_posts")
              .select("id")
              .eq("profile_id", profileId)
              .eq("post_url", post.link)
              .maybeSingle();
            postId = existing?.id || null;
          } else {
            errors.push(`Failed to save post: ${upsertError.message}`);
          }
          continue;
        }

        if (upsertedPost) {
          // Check xem post này là mới hay đã tồn tại (dựa trên created_at)
          const isNewPost = new Date(upsertedPost.created_at).getTime() >= Date.now() - 5000; // Nếu created_at < 5 giây trước, có thể là post mới
          // Hoặc check xem có content mới không (nếu content khác với DB)
          // Tạm thời coi như saved nếu upsert thành công
          saved++;
          postId = upsertedPost.id;
        }
      } else {
        // Nếu không có post_url, không thể dùng UPSERT (UNIQUE constraint cần post_url)
        // Insert bình thường (không có duplicate check)
        const { data: newPost, error: insertError } = await supabase
          .from("profile_posts")
          .insert({
            profile_id: profileId,
            content: post.text || null,
            post_url: null,
            image_url: post.image || null,
            published_at: publishedAt,
          })
          .select()
          .single();

        if (insertError) {
          errors.push(`Failed to save post: ${insertError.message}`);
          continue;
        }

        if (newPost) {
          saved++;
          postId = newPost.id;
        }
      }

      // 🔍 SHARED AI: Check post_url trên toàn bộ database để copy ai_analysis nếu đã có
      // Nếu post này đã được analyze bởi user khác (cùng post_url), copy kết quả
      if (postId && post.link) {
        // Tìm post khác có cùng post_url nhưng khác profile_id (có thể từ user khác)
        const { data: existingPostWithSameUrl } = await supabase
          .from("profile_posts")
          .select("ai_analysis, ai_suggestions")
          .eq("post_url", post.link)
          .neq("id", postId) // Khác post hiện tại
          .not("ai_analysis", "is", null) // Có ai_analysis
          .limit(1)
          .maybeSingle();

        // Nếu tìm thấy post có cùng post_url và đã có AI analysis, copy sang post mới
        if (existingPostWithSameUrl?.ai_analysis && typeof existingPostWithSameUrl.ai_analysis === "object") {
          // Copy AI analysis từ post cũ sang post mới (Shared AI - tiết kiệm 100% chi phí)
          await supabase
            .from("profile_posts")
            .update({
              ai_analysis: existingPostWithSameUrl.ai_analysis,
              ai_suggestions: existingPostWithSameUrl.ai_suggestions || null,
            })
            .eq("id", postId);

          if (process.env.NODE_ENV === "development") {
            console.log(`[SHARED AI] Copied AI analysis from existing post with same URL: ${post.link}`);
          }
          // Đã copy AI analysis, không cần thêm vào queue
          continue;
        }
      }

      // Collect posts cần AI analysis (sẽ xử lý batch sau)
      // 🔍 EFFICIENCY: Chỉ gửi AI những bài có text đủ dài (> 20 ký tự) để tiết kiệm chi phí
      // Những bài chỉ có ảnh hoặc quá ngắn thì bỏ qua
      if (postId && post.text && post.text.trim().length > 20) {
        // Check xem post đã có AI analysis chưa (có thể từ user khác đã phân tích)
        const { data: existingPostData } = await supabase
          .from("profile_posts")
          .select("ai_analysis")
          .eq("id", postId)
          .single();

        // Chỉ thêm vào queue nếu chưa có AI analysis
        if (!existingPostData?.ai_analysis || typeof existingPostData.ai_analysis !== "object") {
          postsNeedingAI.push({ postId, text: post.text });
        }
      } else if (postId && post.text && post.text.trim().length > 0 && post.text.trim().length <= 20) {
        // Log những bài quá ngắn để tracking
        if (process.env.NODE_ENV === "development") {
          console.log(`[AI SKIP] Post ${postId}: Text too short (${post.text.trim().length} chars), skipping AI analysis`);
        }
      }
    } catch (error: any) {
      errors.push(`Error processing post: ${error.message}`);
    }
  }

  // BƯỚC 2: Xử lý AI analysis theo batch (tránh gọi quá nhiều cùng lúc)
  // Giới hạn: Tối đa 20 posts được analyze trong một lần sync
  // Batch size: 5 posts mỗi batch
  // Delay: 500ms giữa các batches
  const MAX_AI_POSTS = 20;
  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 500;
  
  const postsToAnalyze = postsNeedingAI.slice(0, MAX_AI_POSTS);
  const totalBatches = Math.ceil(postsToAnalyze.length / BATCH_SIZE);
  
  if (postsToAnalyze.length > 0) {
    console.log(`[AI BATCH] Processing ${postsToAnalyze.length} posts in ${totalBatches} batches (max ${MAX_AI_POSTS} posts, ${BATCH_SIZE} per batch)`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, postsToAnalyze.length);
      const batch = postsToAnalyze.slice(batchStart, batchEnd);
      
      console.log(`[AI BATCH] Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} posts)`);
      
      // Xử lý batch này (tuần tự để tránh rate limit)
      for (const { postId, text } of batch) {
        try {
          const aiResult = await analyzePostWithAI(text, undefined, postId);
          if (aiResult.data) {
            // Update post với AI analysis (shared cho tất cả users)
            // Format JSON theo System Context: summary, signal, opportunity_score, intent, intent_score, reason, keywords
            await supabase
              .from("profile_posts")
              .update({
                ai_analysis: {
                  summary: aiResult.data.summary || "Chưa có tóm tắt",
                  signal: aiResult.data.signal || "Khác",
                  opportunity_score: aiResult.data.opportunity_score || 0,
                  intent: aiResult.data.intent || "Neutral", // AI Radar: Hot Lead, Warm Lead, Information, Neutral
                  intent_score: aiResult.data.intent_score || 0, // AI Radar: Độ nóng của cơ hội (1-100)
                  reason: aiResult.data.reason || "Không có giải thích", // AI Radar: Giải thích ngắn gọn
                  keywords: Array.isArray(aiResult.data.keywords) ? aiResult.data.keywords : [], // Deprecated - giữ lại để tương thích
                },
                ai_suggestions: Array.isArray(aiResult.data.ice_breakers) ? aiResult.data.ice_breakers : [],
              })
              .eq("id", postId);
          } else if (aiResult.error) {
            // Log error nhưng không block việc lưu post
            console.warn(`[AI BATCH] AI analysis failed for post ${postId}: ${aiResult.error}`);
          }
        } catch (aiError: any) {
          // Nếu AI fail, post vẫn được lưu (không có AI data)
          console.error(`[AI BATCH] Error analyzing post ${postId}:`, aiError);
          // Không push error vào errors array vì post vẫn được lưu thành công
        }
      }
      
      // Delay giữa các batches (trừ batch cuối)
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    if (postsNeedingAI.length > MAX_AI_POSTS) {
      console.warn(`[AI BATCH] Limited AI analysis to ${MAX_AI_POSTS} posts (${postsNeedingAI.length - MAX_AI_POSTS} posts skipped to save costs)`);
    }
  }

  return {
    saved,
    skipped,
    errors,
  };
}

