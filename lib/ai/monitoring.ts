/**
 * AI Usage Monitoring
 * Track OpenAI API usage và cost
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Calculate cost cho OpenAI API call
 * Pricing cho gpt-4o-mini (as of 2024):
 * - Input: $0.15 per 1M tokens
 * - Output: $0.60 per 1M tokens
 */
function calculateCost(
  promptTokens: number,
  completionTokens: number
): number {
  const INPUT_COST_PER_MILLION = 0.15;
  const OUTPUT_COST_PER_MILLION = 0.60;

  const inputCost = (promptTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (completionTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Log AI usage vào database
 */
export async function logAIUsage(
  userId: string,
  postId: string | null,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalTokens: number,
  status: "success" | "error" | "rate_limited",
  errorMessage: string | null,
  responseTimeMs: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const estimatedCost = calculateCost(promptTokens, completionTokens);

    const { error } = await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      post_id: postId,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCost,
      status,
      error_message: errorMessage,
      response_time_ms: responseTimeMs,
    });

    if (error) {
      // Nếu table chưa tồn tại, không crash
      if (error.message?.includes("relation") || error.code === "42P01") {
        if (process.env.NODE_ENV === "development") {
          console.warn("[logAIUsage] ai_usage_logs table not found, skipping log");
        }
        return { success: true, error: null }; // Graceful fallback
      }
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[logAIUsage] Error:", error);
    }
    return { success: false, error: error.message || "Failed to log AI usage" };
  }
}

/**
 * Get AI usage stats cho user
 */
export async function getAIUsageStats(
  userId: string,
  days: number = 30
): Promise<{
  data: {
    total_requests: number;
    total_tokens: number;
    total_cost_usd: number;
    avg_response_time_ms: number;
    error_count: number;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Sử dụng function từ database nếu có, nếu không thì query trực tiếp
    const { data, error } = await supabase.rpc("get_ai_usage_stats", {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      // Nếu function chưa tồn tại, query trực tiếp
      if (error.message?.includes("function") || error.code === "42883") {
        const { data: directData, error: directError } = await supabase
          .from("ai_usage_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

        if (directError) {
          if (directError.message?.includes("relation") || directError.code === "42P01") {
            return {
              data: {
                total_requests: 0,
                total_tokens: 0,
                total_cost_usd: 0,
                avg_response_time_ms: 0,
                error_count: 0,
              },
              error: null,
            };
          }
          return { data: null, error: directError.message };
        }

        const logs = directData || [];
        const totalRequests = logs.length;
        const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
        const totalCost = logs.reduce((sum, log) => sum + Number(log.estimated_cost_usd || 0), 0);
        const avgResponseTime =
          logs.length > 0
            ? logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length
            : 0;
        const errorCount = logs.filter((log) => log.status === "error").length;

        return {
          data: {
            total_requests: totalRequests,
            total_tokens: totalTokens,
            total_cost_usd: totalCost,
            avg_response_time_ms: avgResponseTime,
            error_count: errorCount,
          },
          error: null,
        };
      }

      return { data: null, error: error.message };
    }

    return {
      data: data?.[0] || {
        total_requests: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        avg_response_time_ms: 0,
        error_count: 0,
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message || "Failed to get AI usage stats" };
  }
}

