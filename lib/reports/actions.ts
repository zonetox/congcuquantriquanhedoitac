/**
 * Export & Report Actions
 * Lấy danh sách Sales Opportunities trong tuần để export
 */

"use server";

import { createClient } from "@/lib/supabase/server";

export interface SalesOpportunity {
  id: string;
  profile_title: string;
  profile_url: string;
  profile_category: string | null;
  content: string | null;
  post_url: string | null;
  published_at: string | null;
  summary: string;
  opportunity_score: number;
  keywords: string[];
  ice_breakers: string[];
}

/**
 * Lấy danh sách Sales Opportunities trong tuần (7 ngày qua)
 */
export async function getWeeklySalesOpportunities(): Promise<{
  data: SalesOpportunity[] | null;
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
        data: null,
        error: "You need to sign in to export reports.",
      };
    }

    // Tính ngày bắt đầu tuần (7 ngày trước)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();

    // SHARED SCRAPING: Lấy posts từ profiles user đang theo dõi (không còn filter theo user_id trong profile_posts)
    const { data: profiles } = await supabase
      .from("profiles_tracked")
      .select("id, title, url, category")
      .eq("user_id", user.id)
      .eq("is_in_feed", true);

    if (!profiles || profiles.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const profileIds = profiles.map((p) => p.id);

    // Lấy posts trong tuần (không còn filter theo user_id)
    const { data: posts, error: postsError } = await supabase
      .from("profile_posts")
      .select(`
        id,
        profile_id,
        content,
        post_url,
        published_at,
        ai_analysis,
        ai_suggestions
      `)
      .in("profile_id", profileIds)
      .gte("published_at", weekAgoISO)
      .not("ai_analysis", "is", null)
      .order("published_at", { ascending: false });

    if (postsError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getWeeklySalesOpportunities] Database error:", postsError);
      }
      return {
        data: null,
        error: postsError.message || "Unable to fetch sales opportunities.",
      };
    }

    // Filter posts có signal = "Cơ hội bán hàng" và transform data
    const salesOpportunities: SalesOpportunity[] = [];

    for (const post of posts || []) {
      try {
        const aiAnalysis = post.ai_analysis;
        if (!aiAnalysis || typeof aiAnalysis !== "object") continue;

        // Chỉ lấy posts có signal = "Cơ hội bán hàng"
        if (aiAnalysis.signal !== "Cơ hội bán hàng") continue;

        // Tìm profile tương ứng
        const profile = profiles.find((p) => p.id === post.profile_id);
        if (!profile) continue;

        // Parse AI suggestions
        let iceBreakers: string[] = [];
        if (Array.isArray(post.ai_suggestions)) {
          iceBreakers = post.ai_suggestions
            .filter((s) => typeof s === "string" && s.trim().length > 0)
            .slice(0, 3);
        }

        salesOpportunities.push({
          id: post.id,
          profile_title: profile.title,
          profile_url: profile.url,
          profile_category: profile.category || null,
          content: post.content || null,
          post_url: post.post_url || null,
          published_at: post.published_at || null,
          summary: aiAnalysis.summary || "",
          opportunity_score: aiAnalysis.opportunity_score || 0,
          keywords: Array.isArray(aiAnalysis.keywords) ? aiAnalysis.keywords : [],
          ice_breakers: iceBreakers,
        });
      } catch (error) {
        // Skip posts with invalid data
        if (process.env.NODE_ENV === "development") {
          console.warn("[getWeeklySalesOpportunities] Error parsing post:", error);
        }
        continue;
      }
    }

    return {
      data: salesOpportunities,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getWeeklySalesOpportunities] Unexpected error:", error);
    }
    return {
      data: null,
      error: error.message || "Failed to fetch sales opportunities.",
    };
  }
}

