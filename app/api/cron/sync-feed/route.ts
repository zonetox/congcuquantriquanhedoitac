import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidApiKey, updateApiKeyUsage, markApiKeyAsInactive } from "@/lib/api-keys/actions";

/**
 * Cron job để quét feed mỗi 1 giờ
 * Được gọi bởi Vercel Cron hoặc external cron service
 * 
 * Security: Verify cron secret từ header
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (nếu có)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Lấy tất cả profiles có is_in_feed = true
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles_tracked")
      .select("id, user_id, title, url, rss_url")
      .eq("is_in_feed", true);

    if (profilesError) {
      console.error("[Cron] Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: "No profiles in feed",
        processed: 0,
      });
    }

    let processed = 0;
    let errors = 0;

    // Xử lý từng profile
    for (const profile of profiles) {
      try {
        // Lấy API key hợp lệ
        const { data: apiKey, error: keyError } = await getValidApiKey("RapidAPI");

        if (keyError || !apiKey) {
          console.error(`[Cron] No valid API key for profile ${profile.id}`);
          errors++;
          continue;
        }

        // TODO: Gọi API để lấy posts mới nhất từ profile
        // Ví dụ: RapidAPI LinkedIn Scraper, Apify, etc.
        // const posts = await fetchPostsFromAPI(profile.url, apiKey.api_key);

        // TODO: Lưu posts vào bảng feed_posts
        // await savePostsToDatabase(posts, profile.id);

        // Cập nhật usage của API key
        await updateApiKeyUsage(apiKey.id, true, false);

        processed++;
      } catch (error: any) {
        console.error(`[Cron] Error processing profile ${profile.id}:`, error);

        // Nếu là lỗi 429 (Too Many Requests), đánh dấu key là inactive
        if (error.status === 429 || error.message?.includes("429")) {
          // Cần lưu keyId từ lần gọi getValidApiKey trước đó
          // Tạm thời skip, sẽ implement đầy đủ khi có API thực tế
        }

        errors++;
      }
    }

    return NextResponse.json({
      message: "Feed sync completed",
      processed,
      errors,
      total: profiles.length,
    });
  } catch (error: any) {
    console.error("[Cron] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}


