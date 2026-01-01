"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Đếm số lượng posts có Sales Opportunity chưa được gửi thông báo
 * Dùng để hiển thị notification badge trên Sidebar
 */
export async function getUnreadSalesOpportunitiesCount(): Promise<number> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return 0;
    }

    // Lấy tất cả posts có:
    // 1. signal = "Cơ hội bán hàng" trong ai_analysis
    // 2. notification_sent = false
    // 3. user_id = current user
    let { data: posts, error } = await supabase
      .from("profile_posts")
      .select("id, ai_analysis")
      .eq("user_id", user.id)
      .eq("notification_sent", false)
      .not("ai_analysis", "is", null);

    // If error is about missing column, try without notification_sent filter
    if (error && (error.message?.includes("column") || error.code === "42703")) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[getUnreadSalesOpportunitiesCount] notification_sent column not found, querying without filter");
      }
      // Try again without notification_sent filter
      const { data: allPosts, error: retryError } = await supabase
        .from("profile_posts")
        .select("id, ai_analysis")
        .eq("user_id", user.id)
        .not("ai_analysis", "is", null);

      if (retryError || !allPosts) {
        return 0;
      }
      posts = allPosts;
    } else if (error || !posts) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getUnreadSalesOpportunitiesCount] Error:", error);
      }
      return 0;
    }

    // Filter posts có signal = "Cơ hội bán hàng"
    const salesOpportunities = posts.filter((post) => {
      try {
        const aiAnalysis = post.ai_analysis;
        if (!aiAnalysis || typeof aiAnalysis !== "object") return false;
        return aiAnalysis.signal === "Cơ hội bán hàng";
      } catch (e) {
        // Skip posts with invalid ai_analysis
        return false;
      }
    });

    return salesOpportunities.length;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getUnreadSalesOpportunitiesCount] Unexpected error:", error);
    }
    return 0;
  }
}

