/**
 * Notification Monitoring & Rate Limiting
 * Track notification history, rate limits, và AI usage
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Log notification vào history
 */
export async function logNotification(
  userId: string,
  postId: string,
  profileId: string,
  channel: "telegram" | "email",
  recipient: string,
  message: string,
  status: "pending" | "sent" | "failed",
  errorMessage?: string | null
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notification_history").insert({
      user_id: userId,
      post_id: postId,
      profile_id: profileId,
      channel,
      recipient,
      message,
      status,
      error_message: errorMessage || null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });

    if (error) {
      // Nếu table chưa tồn tại, không crash
      if (error.message?.includes("relation") || error.code === "42P01") {
        if (process.env.NODE_ENV === "development") {
          console.warn("[logNotification] notification_history table not found, skipping log");
        }
        return { success: true, error: null }; // Graceful fallback
      }
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[logNotification] Error:", error);
    }
    return { success: false, error: error.message || "Failed to log notification" };
  }
}

/**
 * Check và update Telegram rate limit
 * Telegram limit: 30 messages/second per chat
 * Returns: { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkTelegramRateLimit(
  chatId: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Lấy rate limit record trong 1 phút gần nhất
    const { data: rateLimit, error: fetchError } = await supabase
      .from("telegram_rate_limits")
      .select("*")
      .eq("chat_id", chatId)
      .gte("window_start", oneMinuteAgo.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError && !fetchError.message?.includes("relation") && fetchError.code !== "42P01") {
      return {
        allowed: true, // Nếu không check được, cho phép (fail open)
        remaining: 30,
        resetAt: null,
        error: fetchError.message,
      };
    }

    // Nếu table chưa tồn tại, cho phép
    if (fetchError && (fetchError.message?.includes("relation") || fetchError.code === "42P01")) {
      return {
        allowed: true,
        remaining: 30,
        resetAt: null,
        error: null,
      };
    }

    const TELEGRAM_RATE_LIMIT = 30; // 30 messages per minute per chat
    const currentCount = rateLimit?.message_count || 0;

    if (currentCount >= TELEGRAM_RATE_LIMIT) {
      // Đã vượt limit, tính thời gian reset
      const resetAt = rateLimit?.window_start
        ? new Date(new Date(rateLimit.window_start).getTime() + 60 * 1000)
        : new Date(now.getTime() + 60 * 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: `Rate limit exceeded. Please wait until ${resetAt.toISOString()}`,
      };
    }

    // Update hoặc insert rate limit record
    if (rateLimit) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("telegram_rate_limits")
        .update({
          message_count: currentCount + 1,
          last_message_at: now.toISOString(),
        })
        .eq("id", rateLimit.id);

      if (updateError && process.env.NODE_ENV === "development") {
        console.warn("[checkTelegramRateLimit] Update error:", updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase.from("telegram_rate_limits").insert({
        chat_id: chatId,
        message_count: 1,
        window_start: now.toISOString(),
        last_message_at: now.toISOString(),
      });

      if (insertError && process.env.NODE_ENV === "development") {
        console.warn("[checkTelegramRateLimit] Insert error:", insertError);
      }
    }

    return {
      allowed: true,
      remaining: TELEGRAM_RATE_LIMIT - currentCount - 1,
      resetAt: null,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[checkTelegramRateLimit] Error:", error);
    }
    // Fail open: nếu không check được, cho phép
    return {
      allowed: true,
      remaining: 30,
      resetAt: null,
      error: error.message || "Failed to check rate limit",
    };
  }
}

/**
 * Get notification history cho user
 */
export async function getNotificationHistory(
  userId: string,
  limit: number = 50
): Promise<{
  data: Array<{
    id: string;
    post_id: string;
    profile_id: string;
    channel: string;
    recipient: string;
    status: string;
    sent_at: string | null;
    created_at: string;
  }> | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notification_history")
      .select("id, post_id, profile_id, channel, recipient, status, sent_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.message?.includes("relation") || error.code === "42P01") {
        // Table chưa tồn tại
        return { data: [], error: null };
      }
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Failed to get notification history" };
  }
}

