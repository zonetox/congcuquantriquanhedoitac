"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Cập nhật last_interacted_at thành thời gian hiện tại
 * Khi user nhấn nút "Đã tương tác"
 */
export async function updateInteraction(profileId: string): Promise<{
  success: boolean;
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
      success: false,
      error: "You need to sign in to update interaction.",
    };
  }

  // Update last_interacted_at (RLS sẽ đảm bảo user chỉ update được profile của chính họ)
  const { error: updateError } = await supabase
    .from("profiles_tracked")
    .update({ 
      last_interacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", profileId)
    .eq("user_id", user.id); // Double check security

  if (updateError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateInteraction] Database error:", updateError);
    }
    return {
      success: false,
      error: updateError.message || "Unable to update interaction. Please try again.",
    };
  }

  revalidatePath("/");
  return {
    success: true,
    error: null,
  };
}

/**
 * Thêm một ghi chú mới vào interaction_logs
 */
export async function addInteractionLog(
  profileId: string,
  content: string,
  interactionType: "note" | "call" | "message" | "comment" = "note"
): Promise<{
  success: boolean;
  error: string | null;
  data?: any;
}> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You need to sign in to add interaction log.",
    };
  }

  // Verify profile belongs to user (security check)
  const { data: profile, error: profileError } = await supabase
    .from("profiles_tracked")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "Profile not found or you don't have permission to add logs to this profile.",
    };
  }

  // Insert interaction log
  const { data, error } = await supabase
    .from("interaction_logs")
    .insert({
      profile_id: profileId,
      user_id: user.id,
      content: content.trim(),
      interaction_type: interactionType,
    })
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addInteractionLog] Database error:", error);
    }
    return {
      success: false,
      error: error.message || "Unable to add interaction log. Please try again.",
    };
  }

  // Also update last_interacted_at when adding a log
  await supabase
    .from("profiles_tracked")
    .update({ 
      last_interacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", profileId)
    .eq("user_id", user.id);

  revalidatePath("/");
  return {
    success: true,
    error: null,
    data,
  };
}

/**
 * Lấy lịch sử ghi chú của một profile
 */
export async function getInteractionLogs(profileId: string): Promise<{
  data: Array<{
    id: string;
    profile_id: string;
    user_id: string;
    content: string;
    interaction_type: "note" | "call" | "message" | "comment";
    created_at: string;
  }> | null;
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
      error: "You need to sign in to view interaction logs.",
    };
  }

  // Verify profile belongs to user (security check)
  const { data: profile, error: profileError } = await supabase
    .from("profiles_tracked")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      data: null,
      error: "Profile not found or you don't have permission to view logs for this profile.",
    };
  }

  // Get interaction logs
  const { data, error } = await supabase
    .from("interaction_logs")
    .select("*")
    .eq("profile_id", profileId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getInteractionLogs] Database error:", error);
    }
    return {
      data: null,
      error: error.message || "Unable to fetch interaction logs. Please try again.",
    };
  }

  return {
    data: data || [],
    error: null,
  };
}

