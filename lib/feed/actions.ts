"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Lấy feed posts từ profiles có is_in_feed = true
 */
export async function getFeedPosts(page: number = 1, limit: number = 20): Promise<{
  data: any[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: "You need to sign in to view feed.",
    };
  }

  // Lấy profiles có is_in_feed = true của user
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles_tracked")
    .select("id, title, url")
    .eq("user_id", user.id)
    .eq("is_in_feed", true);

  if (profilesError) {
    return {
      data: null,
      error: profilesError.message,
    };
  }

  if (!profiles || profiles.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  // TODO: Lấy posts từ feed_posts table (sẽ được tạo bởi cron job)
  // Hiện tại trả về empty array vì chưa có bảng feed_posts
  // Cron job sẽ populate bảng này

  return {
    data: [],
    error: null,
  };
}


