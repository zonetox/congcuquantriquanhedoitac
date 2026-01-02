/**
 * Simple Test Suite cho Notification System
 * Chạy manual tests để verify functionality
 */

import { sendTelegramAlert } from "./service";
import { checkTelegramRateLimit, logNotification } from "./monitoring";
import { analyzePostWithAI } from "@/lib/ai/analyzer";

/**
 * Test 1: Telegram Alert
 */
export async function testTelegramAlert(chatId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const testMessage = "🧪 Test notification từ Partner Center\n\nĐây là tin nhắn thử nghiệm.";
  return await sendTelegramAlert(testMessage, chatId);
}

/**
 * Test 2: Rate Limiting
 */
export async function testRateLimit(chatId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
  error: string | null;
}> {
  return await checkTelegramRateLimit(chatId);
}

/**
 * Test 3: Notification History Logging
 */
export async function testNotificationLogging(
  userId: string,
  postId: string,
  profileId: string,
  chatId: string
): Promise<{ success: boolean; error: string | null }> {
  return await logNotification(
    userId,
    postId,
    profileId,
    "telegram",
    chatId,
    "Test notification message",
    "sent",
    null
  );
}

/**
 * Test 4: AI Analysis với Monitoring
 */
export async function testAIAnalysis(
  content: string,
  userId: string
): Promise<{
  data: any | null;
  error: string | null;
}> {
  return await analyzePostWithAI(content, userId);
}

/**
 * Run all tests
 */
export async function runAllTests(
  chatId: string,
  userId: string,
  postId: string,
  profileId: string
): Promise<{
  telegramTest: { success: boolean; error: string | null };
  rateLimitTest: { allowed: boolean; remaining: number; resetAt: Date | null; error: string | null };
  loggingTest: { success: boolean; error: string | null };
  aiTest: { data: any | null; error: string | null };
}> {
  const telegramTest = await testTelegramAlert(chatId);
  const rateLimitTest = await testRateLimit(chatId);
  const loggingTest = await testNotificationLogging(userId, postId, profileId, chatId);
  const aiTest = await testAIAnalysis("Test post content for AI analysis", userId);

  return {
    telegramTest,
    rateLimitTest,
    loggingTest,
    aiTest,
  };
}

