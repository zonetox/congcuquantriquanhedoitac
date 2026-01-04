"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramAlert, sendEmailAlert, formatSalesOpportunityMessage, formatBatchedSalesOpportunityMessage } from "./service";
import { logNotification } from "./monitoring";

/**
 * Cập nhật notification settings cho profile
 */
export async function updateNotificationSettings(
  profileId: string,
  settings: {
    notify_telegram_chat_id?: string | null;
    notify_on_sales_opportunity?: boolean;
  }
): Promise<{
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
      error: "You need to sign in to update notification settings.",
    };
  }

  // Update profile settings (RLS sẽ đảm bảo user chỉ update được profile của chính họ)
  const updateData: any = {};
  if (settings.notify_telegram_chat_id !== undefined) {
    updateData.notify_telegram_chat_id = settings.notify_telegram_chat_id?.trim() || null;
  }
  if (settings.notify_on_sales_opportunity !== undefined) {
    updateData.notify_on_sales_opportunity = settings.notify_on_sales_opportunity;
  }

  const { error } = await supabase
    .from("profiles_tracked")
    .update(updateData)
    .eq("id", profileId)
    .eq("user_id", user.id);

  // If error is about missing columns, return success (columns not created yet)
  if (error && (error.message?.includes("column") || error.code === "42703")) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[updateNotificationSettings] Notification columns not found, skipping update");
    }
    return {
      success: true,
      error: null,
    };
  }

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateNotificationSettings] Database error:", error);
    }
    return {
      success: false,
      error: error.message || "Unable to update notification settings.",
    };
  }

  revalidatePath("/settings");
  return {
    success: true,
    error: null,
  };
}

/**
 * Gửi test notification để kiểm tra kết nối Telegram
 */
export async function sendTestNotification(
  chatId: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  if (!chatId || chatId.trim() === "") {
    return {
      success: false,
      error: "Telegram Chat ID is required.",
    };
  }

  const testMessage = `Chúc mừng! Hệ thống đã kết nối thành công với Telegram của bạn.`;

  return await sendTelegramAlert(testMessage, chatId);
}

/**
 * Kiểm tra và gửi thông báo cho các bài đăng có Sales Opportunity
 * Được gọi sau khi syncFeed hoàn tất
 */
export async function checkAndNotify(): Promise<{
  notificationsSent: number;
  errors: string[];
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
      notificationsSent: 0,
      errors: ["User not authenticated"],
    };
  }

  // Lấy tất cả posts có:
  // 1. signal = "Cơ hội bán hàng" trong ai_analysis
  // 2. notification_sent = false (nếu column tồn tại)
  // 3. Profile có notify_on_sales_opportunity = true và có notify_telegram_chat_id
  
  // SHARED SCRAPING: Query posts từ profiles user đang theo dõi (không còn filter theo user_id trong profile_posts)
  // Lấy profiles có notify_on_sales_opportunity = true
  const { data: profilesWithNotify, error: profilesError } = await supabase
    .from("profiles_tracked")
    .select("id, title, url, notify_telegram_chat_id, notify_on_sales_opportunity")
    .eq("user_id", user.id)
    .eq("notify_on_sales_opportunity", true)
    .not("notify_telegram_chat_id", "is", null);

  if (profilesError || !profilesWithNotify || profilesWithNotify.length === 0) {
    return {
      notificationsSent: 0,
      errors: [],
    };
  }

  const profileIds = profilesWithNotify.map((p) => p.id);

  // Try to query with notification_sent filter first
  let { data: posts, error: postsError } = await supabase
    .from("profile_posts")
    .select(`
      *,
      profiles_tracked (
        title,
        url,
        notify_telegram_chat_id,
        notify_on_sales_opportunity
      )
    `)
    .in("profile_id", profileIds)
    .not("ai_analysis", "is", null);

  // If error is about missing columns, try without notification columns in select
  if (postsError && (postsError.message?.includes("column") || postsError.code === "42703")) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[checkAndNotify] Notification columns not found, querying without them");
    }
    // Try again with basic query
    const { data: basicPosts, error: basicError } = await supabase
      .from("profile_posts")
      .select(`
        *,
        profiles_tracked (
          title,
          url
        )
      `)
      .in("profile_id", profileIds)
      .not("ai_analysis", "is", null);
    
    if (basicError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[checkAndNotify] Error querying posts:", basicError);
      }
      return {
        notificationsSent: 0,
        errors: [],
      };
    }
    
    // If columns don't exist, return empty (can't send notifications)
    return {
      notificationsSent: 0,
      errors: [],
    };
  }

  if (postsError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[checkAndNotify] Error fetching posts:", postsError);
    }
    return {
      notificationsSent: 0,
      errors: [postsError.message || "Failed to fetch posts"],
    };
  }

  if (!posts || posts.length === 0) {
    return {
      notificationsSent: 0,
      errors: [],
    };
  }

  // Filter posts that haven't been notified (if notification_sent column exists)
  // If column doesn't exist, we'll check all posts but only notify once per post
  const postsToNotify = posts.filter((post: any) => {
    // If notification_sent column exists and is true, skip
    if (post.notification_sent === true) return false;
    // If notification_sent is false or null/undefined, include it
    return true;
  });

  // 🔍 BATCHING NOTIFICATIONS: Group posts by chatId để gộp thành 1 tin nhắn tổng hợp
  // Thay vì gửi 10 tin rời rạc, gộp thành 1 tin nhắn cho mỗi chatId
  interface PostOpportunity {
    postId: string;
    profileId: string;
    profileTitle: string;
    postUrl: string | null;
    aiSummary: string | null;
    iceBreaker1: string | null;
    intentScore?: number;
  }

  // Group posts by chatId
  const opportunitiesByChatId = new Map<string, PostOpportunity[]>();

  // BƯỚC 1: Collect và lock posts
  const validPosts: Array<{ post: any; profile: any; opportunity: PostOpportunity }> = [];
  
  for (const post of postsToNotify) {
    // FIX RACE CONDITION: Update notification_sent = true trước khi gửi
    let canProceed = true;
    try {
      const { data: updateData, error: lockError } = await supabase
        .from("profile_posts")
        .update({ notification_sent: true })
        .eq("id", post.id)
        .eq("notification_sent", false) // Chỉ update nếu notification_sent = false
        .select("id")
        .single();

      if (lockError || !updateData) {
        // Nếu column chưa tồn tại, tiếp tục (graceful fallback)
        if (lockError && (lockError.message?.includes("column") || lockError.code === "42703")) {
          // Column doesn't exist, proceed anyway
        } else {
          // Đã có process khác đánh dấu rồi, skip post này
          canProceed = false;
          if (process.env.NODE_ENV === "development") {
            console.log(`[checkAndNotify] Post ${post.id} already being processed, skipping`);
          }
        }
      }
    } catch (lockErr: any) {
      // Nếu có lỗi khi lock, log nhưng vẫn tiếp tục (fail open)
      if (process.env.NODE_ENV === "development") {
        console.warn(`[checkAndNotify] Error locking post ${post.id}:`, lockErr);
      }
    }

    if (!canProceed) {
      continue; // Skip post này, đã có process khác xử lý
    }

    const profile = Array.isArray(post.profiles_tracked)
      ? post.profiles_tracked[0]
      : post.profiles_tracked;

    // Kiểm tra điều kiện
    if (!profile) continue;
    
    // Check if notification settings exist (may be undefined if columns don't exist)
    if (profile.notify_on_sales_opportunity === false) continue;
    if (!profile.notify_telegram_chat_id) continue;

    // Kiểm tra AI analysis
    const aiAnalysis = post.ai_analysis;
    if (!aiAnalysis || typeof aiAnalysis !== "object") continue;

    const signal = aiAnalysis.signal;
    if (signal !== "Cơ hội bán hàng") continue;

    // Lấy ice breaker đầu tiên từ ai_suggestions
    let iceBreaker1: string | null = null;
    if (post.ai_suggestions && Array.isArray(post.ai_suggestions) && post.ai_suggestions.length > 0) {
      iceBreaker1 = post.ai_suggestions[0];
    }

    // Collect opportunity
    const opportunity: PostOpportunity = {
      postId: post.id,
      profileId: post.profile_id,
      profileTitle: profile.title || "Unknown Profile",
      postUrl: post.post_url,
      aiSummary: aiAnalysis.summary || null,
      iceBreaker1: iceBreaker1,
      intentScore: typeof aiAnalysis.intent_score === "number" ? aiAnalysis.intent_score : undefined,
    };

    validPosts.push({ post, profile, opportunity });

    // Group by chatId
    const chatId = profile.notify_telegram_chat_id;
    if (!opportunitiesByChatId.has(chatId)) {
      opportunitiesByChatId.set(chatId, []);
    }
    opportunitiesByChatId.get(chatId)!.push(opportunity);
  }

  // BƯỚC 2: Gửi batched notifications
  let notificationsSent = 0;
  const errors: string[] = [];

  // Convert Map to Array để tương thích với TypeScript config
  const chatIdEntries = Array.from(opportunitiesByChatId.entries());
  
  for (const [chatId, opportunities] of chatIdEntries) {
    try {
      // Format batched message
      const batchedMessage = formatBatchedSalesOpportunityMessage(opportunities);
      
      if (!batchedMessage) {
        continue; // Skip nếu không có message
      }

      // Gửi thông báo Telegram (1 tin nhắn cho tất cả opportunities của chatId này)
      const telegramResult = await sendTelegramAlert(batchedMessage, chatId);

      if (telegramResult.success) {
        // Đánh dấu tất cả posts đã được gửi
        notificationsSent += opportunities.length;

        // Log notification history cho từng post
        for (const opp of opportunities) {
          await logNotification(
            user.id,
            opp.postId,
            opp.profileId,
            "telegram",
            chatId,
            batchedMessage,
            "sent",
            null
          ).catch((err) => {
            if (process.env.NODE_ENV === "development") {
              console.warn("[checkAndNotify] Failed to log notification:", err);
            }
          });
        }

        if (process.env.NODE_ENV === "development") {
          console.log(`[checkAndNotify] Sent batched notification to ${chatId}: ${opportunities.length} opportunities`);
        }
      } else {
        // Nếu gửi fail, rollback notification_sent = false cho tất cả posts
        for (const opp of opportunities) {
          try {
            await supabase
              .from("profile_posts")
              .update({ notification_sent: false })
              .eq("id", opp.postId);
          } catch (rollbackErr: any) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[checkAndNotify] Error rolling back notification_sent:", rollbackErr);
            }
          }

          // Log failed notification
          await logNotification(
            user.id,
            opp.postId,
            opp.profileId,
            "telegram",
            chatId,
            batchedMessage,
            "failed",
            telegramResult.error || "Unknown error"
          ).catch(() => {});
        }

        errors.push(`Failed to send batched notification to ${chatId}: ${telegramResult.error}`);
      }
    } catch (telegramError: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("[checkAndNotify] Unexpected error sending batched notification:", telegramError);
      }

      // Rollback tất cả posts trong batch này
      for (const opp of opportunities) {
        try {
          await supabase
            .from("profile_posts")
            .update({ notification_sent: false })
            .eq("id", opp.postId);
        } catch (rollbackErr: any) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[checkAndNotify] Error rolling back notification_sent:", rollbackErr);
          }
        }
      }

      errors.push(`Failed to send batched notification to ${chatId}: ${telegramError.message || "Unknown error"}`);
    }
  }

    return {
      notificationsSent,
      errors,
    };
  } catch (error: any) {
    // Catch any unexpected errors to prevent server crashes
    if (process.env.NODE_ENV === "development") {
      console.error("[checkAndNotify] Unexpected error:", error);
    }
    return {
      notificationsSent: 0,
      errors: [error.message || "An unexpected error occurred while checking notifications."],
    };
  }
}

/**
 * Lấy notification settings của user (từ tất cả profiles)
 */
export async function getNotificationSettings(): Promise<{
  data: Array<{
    profile_id: string;
    profile_title: string;
    notify_telegram_chat_id: string | null;
    notify_on_sales_opportunity: boolean;
  }> | null;
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
        error: "You need to sign in to view notification settings.",
      };
    }

    // Try to select with notification columns, fallback to basic columns if they don't exist
    let { data, error } = await supabase
      .from("profiles_tracked")
      .select("id, title, notify_telegram_chat_id, notify_on_sales_opportunity")
      .eq("user_id", user.id)
      .order("title", { ascending: true });

    // If error is about missing columns, try again with only basic columns
    if (error && (error.message?.includes("column") || error.code === "42703")) {
      // Columns don't exist yet, return empty settings
      if (process.env.NODE_ENV === "development") {
        console.warn("[getNotificationSettings] Notification columns not found, returning empty settings");
      }
      return {
        data: [],
        error: null,
      };
    }

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getNotificationSettings] Database error:", error);
      }
      return {
        data: null,
        error: error.message || "Failed to load notification settings.",
      };
    }

    const settings = (data || []).map((profile: any) => ({
      profile_id: profile.id,
      profile_title: profile.title,
      notify_telegram_chat_id: profile.notify_telegram_chat_id || null,
      notify_on_sales_opportunity: profile.notify_on_sales_opportunity ?? true,
    }));

    return {
      data: settings,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getNotificationSettings] Unexpected error:", error);
    }
    return {
      data: null,
      error: error.message || "An unexpected error occurred.",
    };
  }
}

