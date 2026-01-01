/**
 * Notification Service
 * Gửi thông báo qua Telegram và Email khi phát hiện Sales Opportunity
 */

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: "HTML" | "Markdown";
}

/**
 * Gửi thông báo qua Telegram Bot API
 */
export async function sendTelegramAlert(
  message: string,
  chatId: string
): Promise<{ success: boolean; error: string | null }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return {
      success: false,
      error: "TELEGRAM_BOT_TOKEN is not configured. Please set it in environment variables.",
    };
  }

  if (!chatId || chatId.trim() === "") {
    return {
      success: false,
      error: "Telegram Chat ID is required.",
    };
  }

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload: TelegramMessage = {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    };

    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || `Telegram API error: ${response.statusText}`,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[sendTelegramAlert] Error:", error);
    }
    return {
      success: false,
      error: error.message || "Failed to send Telegram notification",
    };
  }
}

/**
 * Gửi thông báo qua Email (sử dụng Resend hoặc SMTP)
 * TODO: Implement email service khi cần
 */
export async function sendEmailAlert(
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error: string | null }> {
  // Placeholder - sẽ implement sau nếu cần
  // Có thể dùng Resend, SendGrid, hoặc SMTP
  
  if (process.env.NODE_ENV === "development") {
    console.log("[sendEmailAlert] Email notification (not implemented):", {
      to,
      subject,
      message,
    });
  }

  return {
    success: false,
    error: "Email notifications are not yet implemented",
  };
}

/**
 * Format message cho Sales Opportunity alert
 */
export function formatSalesOpportunityMessage(
  profileTitle: string,
  postContent: string,
  postUrl: string | null,
  aiSummary: string | null
): string {
  const summary = aiSummary || "New post detected";
  const url = postUrl || "N/A";
  
  // Format Markdown với link bài viết gốc
  const postContentPreview = postContent.substring(0, 200) + (postContent.length > 200 ? "..." : "");
  const linkText = url && url !== "N/A" ? `[Xem bài viết gốc](${url})` : "N/A";
  
  return `🚨 *CẢNH BÁO CƠ HỘI*

📊 *Profile:* ${profileTitle}
📝 *Tóm tắt:* ${summary}

💬 *Nội dung bài đăng:*
${postContentPreview}

🔗 *Link bài viết:* ${linkText}

⏰ *Thời gian:* ${new Date().toLocaleString()}

💡 _Đừng bỏ lỡ cơ hội này! Kiểm tra dashboard để xem gợi ý từ AI._`;
}

