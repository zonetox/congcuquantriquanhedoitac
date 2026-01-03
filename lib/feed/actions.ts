"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { analyzePostWithAI } from "@/lib/ai/analyzer";
import { checkAndNotify } from "@/lib/notifications/actions";
import { fetchSocialPosts, saveScrapedPosts } from "@/lib/scrapers/social-scraper";

export interface ProfilePost {
  id: string;
  profile_id: string;
  content: string | null;
  post_url: string | null;
  image_url: string | null;
  published_at: string | null;
  ai_analysis: any | null;
  ai_suggestions: any | null;
  notification_sent: boolean | null;
  created_at: string;
  profile_last_contacted_at?: string | null; // Interaction Clock - last_contacted_at từ profiles_tracked
}

/**
 * Lấy tất cả posts từ profiles được bật is_in_feed = true
 * @param category - Filter theo category (null = tất cả)
 * @param salesOpportunityOnly - Chỉ lấy posts có intent_score > 70 (Cơ hội bán hàng)
 */
export async function getFeedPosts(
  category?: string | null,
  salesOpportunityOnly?: boolean
): Promise<{
  data: Array<ProfilePost & { profile_title: string; profile_url: string; profile_category: string | null; profile_last_contacted_at: string | null }> | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: "You need to sign in to view feed.",
    };
  }

  // Lấy posts từ profiles có is_in_feed = true
  // Filter theo category nếu có
  let profilesQuery = supabase
    .from("profiles_tracked")
    .select("id, category")
    .eq("user_id", user.id)
    .eq("is_in_feed", true);

  // Filter theo category nếu có
  if (category) {
    profilesQuery = profilesQuery.eq("category", category);
  }

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError || !profiles || profiles.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const profileIds = profiles.map((p) => p.id);

  // Query posts từ shared pool (không còn filter theo user_id)
  const { data, error } = await supabase
    .from("profile_posts")
    .select(`
      *,
      profiles_tracked (
        title,
        url,
        category,
        last_contacted_at
      )
    `)
    .in("profile_id", profileIds)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getFeedPosts] Database error:", error);
    }
    return {
      data: null,
      error: error.message || "Unable to fetch feed posts.",
    };
  }

  // Transform data để include profile info và filter theo intent_score nếu cần
  let posts = (data || []).map((post: any) => {
    const profile = Array.isArray(post.profiles_tracked) 
      ? post.profiles_tracked[0] 
      : post.profiles_tracked;
    
    return {
      ...post,
      profile_title: profile?.title || "Unknown",
      profile_url: profile?.url || "",
      profile_category: profile?.category || null,
      profile_last_contacted_at: profile?.last_contacted_at || null,
    };
  });

  // Filter theo intent_score > 70 nếu salesOpportunityOnly = true
  if (salesOpportunityOnly) {
    posts = posts.filter((post) => {
      try {
        const aiAnalysis = post.ai_analysis;
        if (!aiAnalysis || typeof aiAnalysis !== "object") return false;
        const intentScore = aiAnalysis.intent_score || 0;
        return intentScore > 70;
      } catch (e) {
        return false;
      }
    });
  }

  return {
    data: posts,
    error: null,
  };
}

/**
 * Sync feed - Mockup function để tạo sample posts
 * Sẽ được thay thế bằng API scraper thật sau này
 */
export async function syncFeed(): Promise<{
  success: boolean;
  postsCreated: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        postsCreated: 0,
        error: "You need to sign in to sync feed.",
      };
    }

    // Lấy tất cả profiles có is_in_feed = true
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles_tracked")
      .select("id, title, url, last_synced_at")
      .eq("user_id", user.id)
      .eq("is_in_feed", true);

    if (profilesError || !profiles || profiles.length === 0) {
      return {
        success: false,
        postsCreated: 0,
        error: "No profiles enabled for feed. Enable 'Show in Newsfeed' in profile settings.",
      };
    }

    // SHARED SCRAPING: Chỉ sync profiles chưa được sync trong 1 giờ qua
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const profilesToSync = profiles.filter((profile) => {
      // Nếu chưa có last_synced_at, cần sync
      if (!profile.last_synced_at) return true;
      // Nếu đã sync > 1 giờ trước, cần sync lại
      return new Date(profile.last_synced_at) < oneHourAgo;
    });

    if (profilesToSync.length === 0) {
      // Tất cả profiles đã được sync gần đây, không cần gọi API
      return {
        success: true,
        postsCreated: 0,
        error: null,
      };
    }

    // Sử dụng scraper thực tế để fetch posts
    let totalSaved = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // Fetch posts từ mỗi profile cần sync
    for (const profile of profilesToSync) {
      try {
        // Fetch latest posts từ scraper (Module 4.4: Scraper Engine thực tế)
        const scrapedResult = await fetchSocialPosts(profile.url);
        
        if (scrapedResult.error || !scrapedResult.data || scrapedResult.data.length === 0) {
          if (scrapedResult.error) {
            errors.push(`${profile.title}: ${scrapedResult.error}`);
          }
          continue;
        }

        // Save posts vào database (không cần userId nữa - shared scraping)
        const saveResult = await saveScrapedPosts(
          profile.id,
          scrapedResult.data
        );

        totalSaved += saveResult.saved;
        totalSkipped += saveResult.skipped;
        
        if (saveResult.errors.length > 0) {
          errors.push(...saveResult.errors.map((e) => `${profile.title}: ${e}`));
        }

        // Update last_synced_at sau khi sync thành công
        await supabase
          .from("profiles_tracked")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", profile.id);
      } catch (error: any) {
        errors.push(`${profile.title}: ${error.message || "Unknown error"}`);
      }
    }

    // Nếu scraper thành công, return kết quả
    if (totalSaved > 0) {
      // Sau khi sync xong, kiểm tra và gửi thông báo cho Sales Opportunities
      try {
        const notifyResult = await checkAndNotify();
        if (notifyResult.notificationsSent > 0 && process.env.NODE_ENV === "development") {
          console.log(`[syncFeed] Sent ${notifyResult.notificationsSent} notifications`);
        }
      } catch (error) {
        // Không block sync process nếu notification fail
        if (process.env.NODE_ENV === "development") {
          console.error("[syncFeed] Error checking notifications:", error);
        }
      }

      revalidatePath("/feed");
      revalidatePath("/");

      let finalError = null;
      if (errors.length > 0) {
        finalError = errors.slice(0, 3).join(", ");
        if (errors.length > 3) {
          finalError += ` and ${errors.length - 3} more errors`;
        }
      }

      return {
        success: true,
        postsCreated: totalSaved,
        error: finalError,
      };
    }

    // Fallback: Nếu scraper không hoạt động, tạo sample posts (tạm thời)
    // Chỉ chạy nếu không có posts nào được tạo từ scraper
    const samplePosts = [
      {
        content: "Excited to announce our new product launch! 🚀 This is a game-changer for our industry.",
        image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f81?w=800",
      },
      {
        content: "Thank you to all our partners for making this year a success. Looking forward to 2024!",
        image_url: null,
      },
      {
        content: "Just published a new blog post about industry trends. Check it out!",
        image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
      },
    ];

    let postsCreated = 0;
    let aiErrors = 0;

    for (const profile of profiles) {
      // Tạo 2-3 posts ngẫu nhiên cho mỗi profile
      const numPosts = Math.floor(Math.random() * 2) + 2; // 2-3 posts
      
      for (let i = 0; i < numPosts; i++) {
        const samplePost = samplePosts[Math.floor(Math.random() * samplePosts.length)];
        const publishedAt = new Date();
        publishedAt.setHours(publishedAt.getHours() - Math.floor(Math.random() * 24)); // Random trong 24h qua

        // Tự động phân tích với AI nếu có content
        // SHARED SCRAPING: Không cần userId, AI analysis được lưu chung
        let aiAnalysis = null;
        let aiSuggestions = null;
        
        if (samplePost.content) {
          const aiResult = await analyzePostWithAI(samplePost.content, undefined, undefined);
          if (aiResult.data) {
            // Format mới: lưu đầy đủ AI analysis với opportunity_score và keywords
            aiAnalysis = {
              summary: aiResult.data.summary,
              signal: aiResult.data.signal,
              opportunity_score: aiResult.data.opportunity_score,
              intent_score: aiResult.data.intent_score,
              keywords: aiResult.data.keywords,
            };
            aiSuggestions = aiResult.data.ice_breakers;
          } else if (aiResult.error) {
            // Nếu AI fail, vẫn tạo post nhưng không có AI data
            aiErrors++;
            console.warn(`[syncFeed] AI analysis failed for post: ${aiResult.error}`);
            // Post vẫn được tạo bình thường, chỉ không có AI data
          }
        }

        // Prepare insert data (không còn user_id - shared scraping)
        const insertData: any = {
          profile_id: profile.id,
          content: samplePost.content,
          post_url: `${profile.url}/post-${Date.now()}`,
          image_url: samplePost.image_url,
          published_at: publishedAt.toISOString(),
          ai_analysis: aiAnalysis,
          ai_suggestions: aiSuggestions,
        };

        // Only include notification_sent if column exists (will be handled by DB default if not)
        // We don't explicitly set it to avoid errors if column doesn't exist yet
        
        const { error } = await supabase.from("profile_posts").insert(insertData);

        // If error is about missing columns, log but continue (columns not created yet)
        if (error) {
          if (error.message?.includes("column") || error.code === "42703") {
            if (process.env.NODE_ENV === "development") {
              console.warn(`[syncFeed] Database column error (may not exist yet): ${error.message}`);
            }
            // Try again without optional columns
            const { error: retryError } = await supabase.from("profile_posts").insert({
              profile_id: profile.id,
              content: samplePost.content,
              post_url: `${profile.url}/post-${Date.now()}`,
              image_url: samplePost.image_url,
              published_at: publishedAt.toISOString(),
              ai_analysis: aiAnalysis,
              ai_suggestions: aiSuggestions,
            });
            if (retryError) {
              errors.push(retryError.message);
            } else {
              postsCreated++;
            }
          } else {
            errors.push(error.message);
          }
        } else {
          postsCreated++;
        }
      }
    }

    // Sau khi sync xong, kiểm tra và gửi thông báo cho Sales Opportunities
    if (postsCreated > 0) {
      try {
        const notifyResult = await checkAndNotify();
        if (notifyResult.notificationsSent > 0) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[syncFeed] Sent ${notifyResult.notificationsSent} notifications`
            );
          }
        }
        if (notifyResult.errors.length > 0) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[syncFeed] Notification errors:", notifyResult.errors);
          }
        }
      } catch (error) {
        // Không block sync process nếu notification fail
        if (process.env.NODE_ENV === "development") {
          console.error("[syncFeed] Error checking notifications:", error);
        }
      }
    }

    revalidatePath("/feed");
    revalidatePath("/");

    let finalError = null;
    if (errors.length > 0) {
      finalError = errors.join(", ");
    } else if (aiErrors > 0) {
      // Nếu chỉ có lỗi AI, thông báo nhẹ nhàng
      finalError = `Hệ thống AI đang bảo trì. ${postsCreated} bài đăng đã được tạo nhưng chưa có phân tích AI.`;
    }

    return {
      success: postsCreated > 0,
      postsCreated,
      error: finalError,
    };
  } catch (error: any) {
    // Catch any unexpected errors to prevent server crashes
    if (process.env.NODE_ENV === "development") {
      console.error("[syncFeed] Unexpected error:", error);
    }
    return {
      success: false,
      postsCreated: 0,
      error: error.message || "An unexpected error occurred while syncing feed.",
    };
  }
}

/**
 * Sync feed cho một category cụ thể
 * Sử dụng scraper thực tế từ RapidAPI
 */
export async function syncFeedByCategory(
  category: string | null
): Promise<{
  success: boolean;
  postsCreated: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        postsCreated: 0,
        error: "You need to sign in to sync feed.",
      };
    }

    // Lấy profiles có is_in_feed = true và category (nếu có)
    let profilesQuery = supabase
      .from("profiles_tracked")
      .select("id, title, url, category, last_synced_at")
      .eq("user_id", user.id)
      .eq("is_in_feed", true);

    if (category) {
      profilesQuery = profilesQuery.eq("category", category);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError || !profiles || profiles.length === 0) {
      return {
        success: false,
        postsCreated: 0,
        error: category
          ? `No profiles in category "${category}" enabled for feed.`
          : "No profiles enabled for feed.",
      };
    }

    // SHARED SCRAPING: Chỉ sync profiles chưa được sync trong 1 giờ qua
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const profilesToSync = profiles.filter((profile) => {
      if (!profile.last_synced_at) return true;
      return new Date(profile.last_synced_at) < oneHourAgo;
    });

    if (profilesToSync.length === 0) {
      return {
        success: true,
        postsCreated: 0,
        error: null,
      };
    }

    let totalSaved = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // Fetch posts từ mỗi profile cần sync
    for (const profile of profilesToSync) {
      try {
        // Fetch latest posts từ scraper (Module 4.4: Scraper Engine thực tế)
        const scrapedResult = await fetchSocialPosts(profile.url);
        
        if (scrapedResult.error || !scrapedResult.data || scrapedResult.data.length === 0) {
          if (scrapedResult.error) {
            errors.push(`${profile.title}: ${scrapedResult.error}`);
          }
          continue;
        }

        // Save posts vào database (không cần userId - shared scraping)
        const saveResult = await saveScrapedPosts(
          profile.id,
          scrapedResult.data
        );

        totalSaved += saveResult.saved;
        totalSkipped += saveResult.skipped;
        
        if (saveResult.errors.length > 0) {
          errors.push(...saveResult.errors.map((e) => `${profile.title}: ${e}`));
        }

        // Update last_synced_at
        await supabase
          .from("profiles_tracked")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", profile.id);
      } catch (error: any) {
        errors.push(`${profile.title}: ${error.message || "Unknown error"}`);
      }
    }

    // Sau khi sync xong, kiểm tra và gửi thông báo cho Sales Opportunities
    if (totalSaved > 0) {
      try {
        const notifyResult = await checkAndNotify();
        if (notifyResult.notificationsSent > 0 && process.env.NODE_ENV === "development") {
          console.log(`[syncFeedByCategory] Sent ${notifyResult.notificationsSent} notifications`);
        }
      } catch (error) {
        // Không block sync process nếu notification fail
        if (process.env.NODE_ENV === "development") {
          console.error("[syncFeedByCategory] Error checking notifications:", error);
        }
      }
    }

    revalidatePath("/feed");
    revalidatePath("/");

    let finalError = null;
    if (errors.length > 0) {
      finalError = errors.slice(0, 3).join(", "); // Limit error messages
      if (errors.length > 3) {
        finalError += ` and ${errors.length - 3} more errors`;
      }
    }

    return {
      success: totalSaved > 0,
      postsCreated: totalSaved,
      error: finalError,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[syncFeedByCategory] Unexpected error:", error);
    }
    return {
      success: false,
      postsCreated: 0,
      error: error.message || "An unexpected error occurred while syncing feed.",
    };
  }
}

/**
 * Lấy số lượng profiles có is_in_feed = true
 */
export async function getFeedProfilesCount(): Promise<{
  count: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        count: 0,
        error: "You need to sign in.",
      };
    }

    const { count, error } = await supabase
      .from("profiles_tracked")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_in_feed", true);

    if (error) {
      return {
        count: 0,
        error: error.message,
      };
    }

    return {
      count: count || 0,
      error: null,
    };
  } catch (error: any) {
    return {
      count: 0,
      error: error.message || "Failed to get profiles count",
    };
  }
}
