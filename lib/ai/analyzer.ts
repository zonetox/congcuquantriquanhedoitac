"use server";

import OpenAI from "openai";
import { AIAnalysisResult } from "./types";

/**
 * Phân tích bài đăng với OpenAI API
 * Trả về: Tóm tắt, Sales Signal, và 3 mẫu câu phản hồi (Ice Breakers)
 */
export async function analyzePostWithAI(
  content: string
): Promise<{
  data: AIAnalysisResult | null;
  error: string | null;
}> {
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

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const prompt = `Bạn là một chuyên gia phân tích bán hàng. Hãy đọc bài đăng sau và trả về định dạng JSON gồm:

summary: Tóm tắt bài đăng dưới 15 từ.

signal: Phân loại vào 1 trong 4 nhóm: 'Cơ hội bán hàng', 'Tin cá nhân', 'Tin thị trường', 'Khác'.

ice_breakers: Gợi ý 3 câu phản hồi: 1 câu comment, 1 câu inbox, 1 câu hỏi mở.

Bài đăng:
${content.substring(0, 2000)}${content.length > 2000 ? "..." : ""}

Trả về JSON:
{
  "summary": "Tóm tắt dưới 15 từ",
  "signal": "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác",
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
          content: "Bạn là một chuyên gia phân tích bán hàng. Luôn trả về JSON hợp lệ.",
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
      ice_breakers: iceBreakers.slice(0, 3),
    };

    return {
      data: result,
      error: null,
    };
  } catch (error: any) {
    console.error("[analyzePostWithAI] Error:", error);
    
    // Xử lý lỗi cụ thể
    let errorMessage = "Failed to analyze post with AI";
    if (error.status === 401 || error.message?.includes("api key")) {
      errorMessage = "OpenAI API key không hợp lệ";
    } else if (error.status === 429 || error.message?.includes("rate limit")) {
      errorMessage = "Đã vượt quá giới hạn API, vui lòng thử lại sau";
    } else if (error.status === 402 || error.message?.includes("insufficient_quota")) {
      errorMessage = "Tài khoản OpenAI đã hết tiền";
    }

    return {
      data: null,
      error: errorMessage,
    };
  }
}

