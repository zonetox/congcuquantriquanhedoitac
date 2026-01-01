// Types cho AI Analysis và Suggestions

export interface AIAnalysis {
  summary: string; // Tóm tắt bài viết trong 1 dòng (< 15 từ)
  signal: "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác"; // Sales Signals (tiếng Việt)
}

export interface AIAnalysisResult {
  summary: string;
  signal: "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác";
  ice_breakers: string[]; // 3 câu phản hồi: [comment, inbox, câu hỏi mở]
}

