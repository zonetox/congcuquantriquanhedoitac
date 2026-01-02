/**
 * Relationship Health Score
 * Tính toán chỉ số thân thiết dựa trên:
 * - Số ngày không có interaction_log mới
 * - Số bài đăng mới chưa tương tác
 */

"use server";

import { createClient } from "@/lib/supabase/server";

export interface HealthScore {
  status: "healthy" | "warning" | "critical"; // healthy: < 7 days, warning: 7-14 days, critical: > 7 days + có posts mới
  daysSinceInteraction: number | null;
  newPostsCount: number; // Số bài đăng mới sau last_interacted_at
  color: {
    bg: string;
    text: string;
    border: string;
  };
}

/**
 * Tính Relationship Health Score cho một profile
 */
export async function calculateHealthScore(profileId: string): Promise<{
  data: HealthScore | null;
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
        error: "You need to sign in to calculate health score.",
      };
    }

    // Lấy profile với last_interacted_at
    const { data: profile, error: profileError } = await supabase
      .from("profiles_tracked")
      .select("id, last_interacted_at")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        data: null,
        error: "Profile not found.",
      };
    }

    // Tính số ngày từ last_interacted_at
    let daysSinceInteraction: number | null = null;
    if (profile.last_interacted_at) {
      const lastInteraction = new Date(profile.last_interacted_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastInteraction.getTime());
      daysSinceInteraction = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Đếm số bài đăng mới sau last_interacted_at
    // SHARED SCRAPING: Không còn filter theo user_id, posts được chia sẻ cho tất cả users
    let newPostsCount = 0;
    if (profile.last_interacted_at) {
      const { count, error: postsError } = await supabase
        .from("profile_posts")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profileId)
        .gt("published_at", profile.last_interacted_at);

      if (!postsError && count !== null) {
        newPostsCount = count;
      }
    } else {
      // Nếu chưa có interaction, đếm tất cả posts
      const { count, error: postsError } = await supabase
        .from("profile_posts")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profileId);

      if (!postsError && count !== null) {
        newPostsCount = count;
      }
    }

    // Tính health score status
    let status: "healthy" | "warning" | "critical";
    let color: { bg: string; text: string; border: string };

    // Logic mới: Xanh (< 3), Vàng (3-7), Đỏ (> 7)
    if (daysSinceInteraction === null) {
      // Chưa có interaction - warning (vàng)
      status = "warning";
      color = {
        bg: "bg-yellow-500",
        text: "text-yellow-700",
        border: "border-yellow-500",
      };
    } else if (daysSinceInteraction < 3) {
      // < 3 ngày - healthy (xanh)
      status = "healthy";
      color = {
        bg: "bg-emerald-500",
        text: "text-emerald-700",
        border: "border-emerald-500",
      };
    } else if (daysSinceInteraction >= 3 && daysSinceInteraction <= 7) {
      // 3-7 ngày - warning (vàng)
      status = "warning";
      color = {
        bg: "bg-yellow-500",
        text: "text-yellow-700",
        border: "border-yellow-500",
      };
    } else {
      // > 7 ngày - critical (đỏ)
      status = "critical";
      color = {
        bg: "bg-red-500",
        text: "text-red-700",
        border: "border-red-500",
      };
    }

    return {
      data: {
        status,
        daysSinceInteraction,
        newPostsCount,
        color,
      },
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[calculateHealthScore] Error:", error);
    }
    return {
      data: null,
      error: error.message || "Failed to calculate health score.",
    };
  }
}

/**
 * Tính Relationship Health Score cho nhiều profiles (batch)
 */
export async function calculateHealthScoresForProfiles(
  profileIds: string[]
): Promise<{
  data: Record<string, HealthScore> | null;
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
        error: "You need to sign in to calculate health scores.",
      };
    }

    if (profileIds.length === 0) {
      return {
        data: {},
        error: null,
      };
    }

    // Lấy tất cả profiles với last_interacted_at
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles_tracked")
      .select("id, last_interacted_at")
      .eq("user_id", user.id)
      .in("id", profileIds);

    if (profilesError) {
      return {
        data: null,
        error: profilesError.message,
      };
    }

    // Lấy số posts mới cho mỗi profile
    const healthScores: Record<string, HealthScore> = {};

    for (const profile of profiles || []) {
      let daysSinceInteraction: number | null = null;
      if (profile.last_interacted_at) {
        const lastInteraction = new Date(profile.last_interacted_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastInteraction.getTime());
        daysSinceInteraction = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Đếm số bài đăng mới sau last_interacted_at
      // SHARED SCRAPING: Không còn filter theo user_id, posts được chia sẻ cho tất cả users
      let newPostsCount = 0;
      if (profile.last_interacted_at) {
        const { count } = await supabase
          .from("profile_posts")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profile.id)
          .gt("published_at", profile.last_interacted_at);

        newPostsCount = count || 0;
      } else {
        const { count } = await supabase
          .from("profile_posts")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profile.id);

        newPostsCount = count || 0;
      }

      // Tính health score status
      let status: "healthy" | "warning" | "critical";
      let color: { bg: string; text: string; border: string };

      // Logic mới: Xanh (< 3), Vàng (3-7), Đỏ (> 7)
      if (daysSinceInteraction === null) {
        status = "warning";
        color = {
          bg: "bg-yellow-500",
          text: "text-yellow-700",
          border: "border-yellow-500",
        };
      } else if (daysSinceInteraction < 3) {
        status = "healthy";
        color = {
          bg: "bg-emerald-500",
          text: "text-emerald-700",
          border: "border-emerald-500",
        };
      } else if (daysSinceInteraction >= 3 && daysSinceInteraction <= 7) {
        status = "warning";
        color = {
          bg: "bg-yellow-500",
          text: "text-yellow-700",
          border: "border-yellow-500",
        };
      } else {
        status = "critical";
        color = {
          bg: "bg-red-500",
          text: "text-red-700",
          border: "border-red-500",
        };
      }

      healthScores[profile.id] = {
        status,
        daysSinceInteraction,
        newPostsCount,
        color,
      };
    }

    return {
      data: healthScores,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[calculateHealthScoresForProfiles] Error:", error);
    }
    return {
      data: null,
      error: error.message || "Failed to calculate health scores.",
    };
  }
}

