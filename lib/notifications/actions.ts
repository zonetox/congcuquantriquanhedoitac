"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTelegramAlert, formatSalesOpportunityMessage } from "./service";

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

  const testMessage = `Chào bạn, đây là tin nhắn thử nghiệm từ Partner Center.

Nếu bạn nhận được tin nhắn này, cấu hình Telegram của bạn đã hoạt động đúng! 🎉

⏰ <b>Thời gian:</b> ${new Date().toLocaleString()}`;

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
  // 2. notification_sent = false
  // 3. Profile có notify_on_sales_opportunity = true và có notify_telegram_chat_id
  const { data: posts, error: postsError } = await supabase
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
    .eq("user_id", user.id)
    .eq("notification_sent", false)
    .not("ai_analysis", "is", null);

  if (postsError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[checkAndNotify] Error fetching posts:", postsError);
    }
    return {
      notificationsSent: 0,
      errors: [postsError.message],
    };
  }

  if (!posts || posts.length === 0) {
    return {
      notificationsSent: 0,
      errors: [],
    };
  }

  let notificationsSent = 0;
  const errors: string[] = [];

  for (const post of posts) {
    const profile = Array.isArray(post.profiles_tracked)
      ? post.profiles_tracked[0]
      : post.profiles_tracked;

    // Kiểm tra điều kiện
    if (!profile) continue;
    if (!profile.notify_on_sales_opportunity) continue;
    if (!profile.notify_telegram_chat_id) continue;

    // Kiểm tra AI analysis
    const aiAnalysis = post.ai_analysis;
    if (!aiAnalysis || typeof aiAnalysis !== "object") continue;

    const signal = aiAnalysis.signal;
    if (signal !== "Cơ hội bán hàng") continue;

    // Format và gửi thông báo
    const message = formatSalesOpportunityMessage(
      profile.title || "Unknown Profile",
      post.content || "",
      post.post_url,
      aiAnalysis.summary || null
    );

    const result = await sendTelegramAlert(message, profile.notify_telegram_chat_id);

    if (result.success) {
      // Đánh dấu đã gửi thông báo
      await supabase
        .from("profile_posts")
        .update({ notification_sent: true })
        .eq("id", post.id);

      notificationsSent++;
    } else {
      errors.push(`Failed to notify for post ${post.id}: ${result.error}`);
    }
  }

  return {
    notificationsSent,
    errors,
  };
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

  const { data, error } = await supabase
    .from("profiles_tracked")
    .select("id, title, notify_telegram_chat_id, notify_on_sales_opportunity")
    .eq("user_id", user.id)
    .order("title", { ascending: true });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  const settings = (data || []).map((profile) => ({
    profile_id: profile.id,
    profile_title: profile.title,
    notify_telegram_chat_id: profile.notify_telegram_chat_id,
    notify_on_sales_opportunity: profile.notify_on_sales_opportunity ?? true,
  }));

  return {
    data: settings,
    error: null,
  };
}

