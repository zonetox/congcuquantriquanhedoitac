"use server";

import OpenAI from "openai";
import { AIAnalysisResult } from "./types";
import { logAIUsage } from "./monitoring";
import { createClient } from "@/lib/supabase/server";
import { getUserLocale } from "@/lib/user/actions";

/**
 * Phân tích bài đăng với OpenAI API
 * Trả về: Tóm tắt, Sales Signal, và 3 mẫu câu phản hồi (Ice Breakers)
 */
export async function analyzePostWithAI(
  content: string,
  userId?: string,
  postId?: string
): Promise<{
  data: AIAnalysisResult | null;
  error: string | null;
}> {
  // SHARED SCRAPING: Nếu có postId, check xem đã có AI analysis chưa
  if (postId) {
    const supabase = await createClient();
    const { data: existingPost } = await supabase
      .from("profile_posts")
      .select("ai_analysis")
      .eq("id", postId)
      .single();

    // Nếu đã có AI analysis, return kết quả có sẵn (tiết kiệm chi phí)
    if (existingPost?.ai_analysis && typeof existingPost.ai_analysis === "object") {
      const analysis = existingPost.ai_analysis;
      return {
        data: {
          summary: analysis.summary || "Chưa có tóm tắt",
          signal: analysis.signal || "Khác",
          intent: analysis.intent || "Neutral",
          intent_score: analysis.intent_score || 0,
          opportunity_score: analysis.opportunity_score || 0,
          reason: analysis.reason || "Không có giải thích",
          keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
          ice_breakers: [], // Không có trong ai_analysis, cần lấy từ ai_suggestions nếu cần
        },
        error: null,
      };
    }
  }

  // Kiểm tra OpenAI API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[analyzePostWithAI] OPENAI_API_KEY not configured. Skipping AI analysis.");
    return {
      data: null,
      error: "OpenAI API key not configured",
    };
  }

  if (!content || content.trim().length === 0) {
    return {
      data: null,
      error: "Content is empty",
    };
  }

  const startTime = Date.now();
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let status: "success" | "error" | "rate_limited" = "success";
  let errorMessage: string | null = null;

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 🔍 DATA INTEGRITY: Lấy locale của user để đảm bảo reason bằng đúng ngôn ngữ
    let userLocale = "vi"; // Default: tiếng Việt
    if (userId) {
      try {
        userLocale = await getUserLocale();
      } catch (localeError) {
        // Nếu không lấy được locale, dùng default
        if (process.env.NODE_ENV === "development") {
          console.warn("[analyzePostWithAI] Failed to get user locale, using default 'vi'");
        }
      }
    }

    // Map locale code sang tên ngôn ngữ
    const localeNames: Record<string, string> = {
      vi: "tiếng Việt",
      en: "tiếng Anh",
      es: "tiếng Tây Ban Nha",
      fr: "tiếng Pháp",
      de: "tiếng Đức",
      ja: "tiếng Nhật",
      zh: "tiếng Trung",
    };
    const languageName = localeNames[userLocale] || "tiếng Việt";

    // AI Radar - Contextual Prompting (không dùng keywords)
    const SALES_INTENT_PROMPT = `Bạn là một chuyên gia săn tin bán hàng (Sales Intelligence) đa ngôn ngữ. 
Nhiệm vụ: Phân tích bài đăng bằng bất kỳ ngôn ngữ nào (Việt, Anh, Nhật, Trung, Tây Ban Nha, Pháp, Đức, v.v.) và trả về:
1. Intent: (Hot Lead, Warm Lead, Information, Neutral)
2. Score: 1-100 (Độ nóng của cơ hội)
3. Reason: Giải thích ngắn gọn tại sao (PHẢI bằng ${languageName}, dù bài đăng gốc là ngôn ngữ nào).

Tiêu chí "Hot Lead":
- Ngôn ngữ bất kỳ thể hiện việc: Tìm kiếm báo giá, tìm nhà cung cấp, hỏi địa chỉ mua, cần tư vấn gấp.
- Than phiền về lỗi nghiêm trọng của đối thủ cạnh tranh.
- Thể hiện nhu cầu cấp thiết, muốn mua ngay, có ngân sách sẵn sàng.

Tiêu chí "Warm Lead":
- Có dấu hiệu quan tâm đến sản phẩm/dịch vụ nhưng chưa cấp thiết.
- Đang tìm hiểu, so sánh các lựa chọn.
- Có nhu cầu trong tương lai gần.

Tiêu chí "Information":
- Chia sẻ thông tin, kiến thức, không có ý định mua.
- Cập nhật tin tức, xu hướng ngành.

Tiêu chí "Neutral":
- Bài đăng thông thường, không liên quan đến bán hàng.
- Tin cá nhân, sự kiện, không có giá trị thương mại.`;

    const prompt = `${SALES_INTENT_PROMPT}

Bạn cũng cần phân loại theo signal (để tương thích với hệ thống hiện tại):
- signal: 'Cơ hội bán hàng' (nếu Intent = Hot Lead hoặc Warm Lead), 'Tin cá nhân', 'Tin thị trường', hoặc 'Khác'

opportunity_score: Nhiệt năng cơ hội từ 1-10 (chỉ áp dụng khi Intent = Hot Lead hoặc Warm Lead):
- Hot Lead: 7-10
- Warm Lead: 4-6
- Information/Neutral: 0

ice_breakers: Gợi ý 3 câu phản hồi: 1 câu comment công khai, 1 câu tin nhắn riêng tư, 1 câu hỏi mở (bằng ngôn ngữ của bài đăng).

Bài đăng:
${content.substring(0, 2000)}${content.length > 2000 ? "..." : ""}

Trả về JSON:
{
  "summary": "Tóm tắt bài đăng dưới 15 từ (bằng ngôn ngữ của bài đăng)",
  "signal": "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác",
  "intent": "Hot Lead" | "Warm Lead" | "Information" | "Neutral",
  "intent_score": 1-100,
  "opportunity_score": 0-10,
  "reason": "Giải thích ngắn gọn tại sao phân loại như vậy (PHẢI bằng ${languageName}, dù bài đăng gốc là ngôn ngữ nào)",
  "ice_breakers": [
    "Câu comment công khai",
    "Câu tin nhắn riêng tư",
    "Câu hỏi mở để bắt đầu cuộc trò chuyện"
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert sales analyst. You can analyze posts in ANY language (English, Vietnamese, Japanese, Chinese, Spanish, French, German, etc.) and detect purchase intent regardless of language. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    // Extract usage data
    promptTokens = completion.usage?.prompt_tokens || 0;
    completionTokens = completion.usage?.completion_tokens || 0;
    totalTokens = completion.usage?.total_tokens || 0;

    const contentText = completion.choices[0]?.message?.content;

    if (!contentText) {
      return {
        data: null,
        error: "No response from OpenAI",
      };
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(contentText);
    } catch (parseError) {
      console.error("[analyzePostWithAI] JSON parse error:", parseError);
      return {
        data: null,
        error: "Failed to parse AI response",
      };
    }

    // Validate và format response
    const validSignals = ["Cơ hội bán hàng", "Tin cá nhân", "Tin thị trường", "Khác"];
    const signal = validSignals.includes(parsed.signal) ? parsed.signal : "Khác";

    // Validate intent (Hot Lead, Warm Lead, Information, Neutral)
    const validIntents = ["Hot Lead", "Warm Lead", "Information", "Neutral"];
    const intent = validIntents.includes(parsed.intent) ? parsed.intent : "Neutral";

    // Validate intent_score (1-100, độ nóng của cơ hội)
    let intentScore = 0;
    if (typeof parsed.intent_score === "number") {
      intentScore = Math.max(1, Math.min(100, Math.round(parsed.intent_score)));
    }

    // Validate opportunity_score (1-10, chỉ áp dụng cho Hot Lead hoặc Warm Lead)
    let opportunityScore = 0;
    if ((intent === "Hot Lead" || intent === "Warm Lead") && typeof parsed.opportunity_score === "number") {
      opportunityScore = Math.max(1, Math.min(10, Math.round(parsed.opportunity_score)));
    }

    // Validate reason (giải thích ngắn gọn)
    const reason = typeof parsed.reason === "string" && parsed.reason.trim().length > 0
      ? parsed.reason.trim()
      : "Không có giải thích";

    // Validate keywords (deprecated - giữ lại để tương thích)
    let keywords: string[] = [];
    if (Array.isArray(parsed.keywords)) {
      keywords = parsed.keywords
        .filter((item: any) => typeof item === "string" && item.trim().length > 0)
        .slice(0, 10);
    }

    // Đảm bảo ice_breakers là array và có đủ 3 phần tử
    let iceBreakers: string[] = [];
    if (Array.isArray(parsed.ice_breakers)) {
      iceBreakers = parsed.ice_breakers
        .filter((item: any) => typeof item === "string" && item.trim().length > 0)
        .slice(0, 3);
    }

    // Nếu thiếu, thêm placeholder
    while (iceBreakers.length < 3) {
      iceBreakers.push("Chưa có gợi ý phản hồi");
    }

    const result: AIAnalysisResult = {
      summary: parsed.summary || "Chưa có tóm tắt",
      signal: signal as "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác",
      intent: intent as "Hot Lead" | "Warm Lead" | "Information" | "Neutral",
      intent_score: intentScore,
      opportunity_score: opportunityScore,
      reason: reason,
      keywords: keywords, // Deprecated - giữ lại để tương thích
      ice_breakers: iceBreakers.slice(0, 3),
    };

    // Log AI usage (async, không block response)
    const responseTimeMs = Date.now() - startTime;
    if (userId) {
      logAIUsage(
        userId,
        postId || null,
        "gpt-4o-mini",
        promptTokens,
        completionTokens,
        totalTokens,
        "success",
        null,
        responseTimeMs
      ).catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[analyzePostWithAI] Failed to log AI usage:", err);
        }
      });
    }

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("[analyzePostWithAI] Error:", error);
    
    // Xử lý lỗi cụ thể
    let errorMsg = "Failed to analyze post with AI";
    if (error.status === 401 || error.message?.includes("api key")) {
      errorMsg = "OpenAI API key không hợp lệ";
      status = "error";
    } else if (error.status === 429 || error.message?.includes("rate limit")) {
      errorMsg = "Đã vượt quá giới hạn API, vui lòng thử lại sau";
      status = "rate_limited";
    } else if (error.status === 402 || error.message?.includes("insufficient_quota")) {
      errorMsg = "Tài khoản OpenAI đã hết tiền";
      status = "error";
    } else {
      status = "error";
    }

    errorMessage = errorMsg;

    // Log AI usage với error (async, không block response)
    const responseTimeMs = Date.now() - startTime;
    if (userId) {
      logAIUsage(
        userId,
        postId || null,
        "gpt-4o-mini",
        promptTokens,
        completionTokens,
        totalTokens,
        status,
        errorMsg,
        responseTimeMs
      ).catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[analyzePostWithAI] Failed to log AI usage:", err);
        }
      });
    }

    return {
      data: null,
      error: errorMsg,
    };
  }
}

