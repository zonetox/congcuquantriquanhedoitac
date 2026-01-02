// Types cho AI Analysis và Suggestions

export interface AIAnalysis {
  summary: string; // Tóm tắt bài viết trong 1 dòng (< 15 từ)
  signal: "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác"; // Sales Signals (tiếng Việt)
  opportunity_score?: number; // Nhiệt năng cơ hội từ 1-10 (Sales Intent v2)
  keywords?: string[]; // Từ khóa phát hiện: "tìm đối tác", "báo giá", "không hài lòng", "cần tư vấn"
  intent?: "Hot Lead" | "Warm Lead" | "Information" | "Neutral"; // AI Radar - Intent classification
  reason?: string; // AI Radar - Giải thích ngắn gọn tại sao (bằng ngôn ngữ của người dùng)
}

export interface AIAnalysisResult {
  summary: string;
  signal: "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác";
  opportunity_score: number; // Nhiệt năng cơ hội từ 1-10
  intent_score: number; // Ý định mua hàng từ 1-100 (đa ngôn ngữ) - Score độ nóng
  intent: "Hot Lead" | "Warm Lead" | "Information" | "Neutral"; // AI Radar - Intent classification
  reason: string; // AI Radar - Giải thích ngắn gọn tại sao (bằng ngôn ngữ của người dùng)
  keywords: string[]; // Từ khóa phát hiện (deprecated - dùng Contextual Prompting)
  ice_breakers: string[]; // 3 câu phản hồi: [comment, inbox, câu hỏi mở]
}

