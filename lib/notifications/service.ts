/**
 * Notification Service
 * Gửi thông báo qua Telegram và Email khi phát hiện Sales Opportunity
 */

import { checkTelegramRateLimit } from "./monitoring";

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

  // Check rate limit trước khi gửi
  const rateLimitCheck = await checkTelegramRateLimit(chatId.trim());
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.error || "Rate limit exceeded. Please try again later.",
    };
  }

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload: TelegramMessage = {
      chat_id: chatId.trim(),
      text: message,
      parse_mode: "Markdown",
    };

    // Add timeout và error handling tốt hơn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let response: Response;
    try {
      response = await fetch(telegramApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return {
          success: false,
          error: "Telegram API request timeout. Please check your network connection.",
        };
      }
      throw fetchError;
    }

    // Kiểm tra response status trước khi parse JSON
    if (!response.ok) {
      // Nếu response không OK, thử parse error message
      let errorMessage = `Telegram API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.description) {
          errorMessage = errorData.description;
        }
      } catch {
        // Nếu không parse được JSON, dùng status text
        const text = await response.text().catch(() => "");
        if (text) {
          errorMessage = text.substring(0, 200); // Limit error message length
        }
      }
      
      // Xử lý các lỗi phổ biến từ Telegram
      if (response.status === 400) {
        if (errorMessage.includes("chat not found") || errorMessage.includes("chat_id")) {
          errorMessage = "Invalid Telegram Chat ID. Please check your Chat ID and make sure you've started a conversation with the bot.";
        } else if (errorMessage.includes("message is too long")) {
          errorMessage = "Message is too long. Please contact support.";
        }
      } else if (response.status === 401) {
        errorMessage = "Invalid Telegram Bot Token. Please check your TELEGRAM_BOT_TOKEN environment variable.";
      } else if (response.status === 403) {
        errorMessage = "Bot is blocked by user. Please unblock the bot and try again.";
      } else if (response.status === 429) {
        errorMessage = "Telegram API rate limit exceeded. Please try again later.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse JSON response
    let data: any;
    try {
      data = await response.json();
    } catch (jsonError: any) {
      return {
        success: false,
        error: "Failed to parse Telegram API response. The request may have succeeded, but we couldn't verify it.",
      };
    }

    // Kiểm tra data.ok từ Telegram API
    if (!data.ok) {
      const errorDescription = data.description || "Unknown Telegram API error";
      
      // Xử lý các lỗi cụ thể từ Telegram
      if (errorDescription.includes("chat not found") || errorDescription.includes("chat_id")) {
        return {
          success: false,
          error: "Invalid Telegram Chat ID. Please check your Chat ID and make sure you've started a conversation with the bot.",
        };
      } else if (errorDescription.includes("bot was blocked")) {
        return {
          success: false,
          error: "Bot is blocked by user. Please unblock the bot and try again.",
        };
      } else if (errorDescription.includes("message is too long")) {
        return {
          success: false,
          error: "Message is too long. Please contact support.",
        };
      }

      return {
        success: false,
        error: errorDescription,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    // Catch tất cả các lỗi không mong đợi
    if (process.env.NODE_ENV === "development") {
      console.error("[sendTelegramAlert] Unexpected error:", error);
    }
    
    // Xử lý các loại lỗi khác nhau
    let errorMessage = "Failed to send Telegram notification";
    if (error.name === "AbortError") {
      errorMessage = "Request timeout. Please check your network connection.";
    } else if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Gửi thông báo qua Email (sử dụng Resend)
 */
export async function sendEmailAlert(
  to: string,
  subject: string,
  htmlMessage: string
): Promise<{ success: boolean; error: string | null }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[sendEmailAlert] RESEND_API_KEY not configured. Skipping email notification.");
    }
    return {
      success: false,
      error: "RESEND_API_KEY is not configured. Please set it in environment variables.",
    };
  }

  if (!to || !to.includes("@")) {
    return {
      success: false,
      error: "Invalid email address.",
    };
  }

  try {
    const resendApiUrl = "https://api.resend.com/emails";
    
    const payload = {
      from: process.env.RESEND_FROM_EMAIL || "Partner Center <notifications@partnercenter.com>",
      to: [to.trim()],
      subject: subject,
      html: htmlMessage,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let response: Response;
    try {
      response = await fetch(resendApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        return {
          success: false,
          error: "Email API request timeout. Please check your network connection.",
        };
      }
      throw fetchError;
    }

    if (!response.ok) {
      let errorMessage = `Email API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        const text = await response.text().catch(() => "");
        if (text) {
          errorMessage = text.substring(0, 200);
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message || "Failed to send email",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[sendEmailAlert] Unexpected error:", error);
    }

    let errorMessage = "Failed to send email notification";
    if (error.name === "AbortError") {
      errorMessage = "Request timeout. Please check your network connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Format message cho Sales Opportunity alert
 */
export function formatSalesOpportunityMessage(
  profileTitle: string,
  postContent: string,
  postUrl: string | null,
  aiSummary: string | null,
  iceBreaker1: string | null
): string {
  const summary = aiSummary || "New post detected";
  const iceBreaker = iceBreaker1 || "Hãy liên hệ để tìm hiểu thêm";
  const url = postUrl || "N/A";
  
  // Format Markdown với link bài viết gốc
  const linkText = url && url !== "N/A" ? `[Mở bài viết ngay](${url})` : "N/A";
  
  return `🚀 *PARTNER CENTER - CƠ HỘI MỚI*

👤 *Khách hàng:* ${profileTitle}
📝 *Tóm tắt:* ${summary}
💡 *Gợi ý:* ${iceBreaker}

🔗 ${linkText}`;
}

