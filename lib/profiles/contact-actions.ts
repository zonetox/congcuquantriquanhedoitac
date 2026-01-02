"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Cập nhật last_contacted_at khi user click Ice Breaker hoặc Copy
 * Được gọi từ FeedContent khi user tương tác với post
 */
export async function updateLastContactedAt(
  profileId: string
): Promise<{
  success: boolean;
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
        success: false,
        error: "User not authenticated",
      };
    }

    // Verify profile belongs to user
    const { data: profile, error: profileError } = await supabase
      .from("profiles_tracked")
      .select("id, user_id")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: "Profile not found or access denied",
      };
    }

    // Update last_contacted_at
    const { error: updateError } = await supabase
      .from("profiles_tracked")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", profileId)
      .eq("user_id", user.id);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[updateLastContactedAt] Error:", updateError);
      }
      return {
        success: false,
        error: updateError.message || "Failed to update last_contacted_at",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateLastContactedAt] Unexpected error:", error);
    }
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

