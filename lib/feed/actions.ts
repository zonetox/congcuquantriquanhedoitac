"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProfilePost {
  id: string;
  profile_id: string;
  user_id: string;
  content: string | null;
  post_url: string | null;
  image_url: string | null;
  published_at: string | null;
  ai_analysis: any | null;
  ai_suggestions: any | null;
  created_at: string;
}

/**
 * Lấy tất cả posts từ profiles được bật is_in_feed = true
 */
export async function getFeedPosts(): Promise<{
  data: Array<ProfilePost & { profile_title: string; profile_url: string }> | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Get current user
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

  // Lấy posts từ profiles có is_in_feed = true
  // Sử dụng join để filter
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles_tracked")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_in_feed", true);

  if (profilesError || !profiles || profiles.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const profileIds = profiles.map((p) => p.id);

  const { data, error } = await supabase
    .from("profile_posts")
    .select(`
      *,
      profiles_tracked (
        title,
        url
      )
    `)
    .eq("user_id", user.id)
    .in("profile_id", profileIds)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getFeedPosts] Database error:", error);
    }
    return {
      data: null,
      error: error.message || "Unable to fetch feed posts.",
    };
  }

  // Transform data để include profile info
  const posts = (data || []).map((post: any) => {
    const profile = Array.isArray(post.profiles_tracked) 
      ? post.profiles_tracked[0] 
      : post.profiles_tracked;
    
    return {
      ...post,
      profile_title: profile?.title || "Unknown",
      profile_url: profile?.url || "",
    };
  });

  return {
    data: posts,
    error: null,
  };
}

/**
 * Sync feed - Mockup function để tạo sample posts
 * Sẽ được thay thế bằng API scraper thật sau này
 */
export async function syncFeed(): Promise<{
  success: boolean;
  postsCreated: number;
  error: string | null;
}> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      postsCreated: 0,
      error: "You need to sign in to sync feed.",
    };
  }

  // Lấy tất cả profiles có is_in_feed = true
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles_tracked")
    .select("id, title, url")
    .eq("user_id", user.id)
    .eq("is_in_feed", true);

  if (profilesError || !profiles || profiles.length === 0) {
    return {
      success: false,
      postsCreated: 0,
      error: "No profiles enabled for feed. Enable 'Show in Newsfeed' in profile settings.",
    };
  }

  // Tạo 2-3 bài đăng mẫu cho mỗi profile
  const samplePosts = [
    {
      content: "Excited to announce our new product launch! 🚀 This is a game-changer for our industry.",
      image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f81?w=800",
    },
    {
      content: "Thank you to all our partners for making this year a success. Looking forward to 2024!",
      image_url: null,
    },
    {
      content: "Just published a new blog post about industry trends. Check it out!",
      image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    },
  ];

  let postsCreated = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    // Tạo 2-3 posts ngẫu nhiên cho mỗi profile
    const numPosts = Math.floor(Math.random() * 2) + 2; // 2-3 posts
    
    for (let i = 0; i < numPosts; i++) {
      const samplePost = samplePosts[Math.floor(Math.random() * samplePosts.length)];
      const publishedAt = new Date();
      publishedAt.setHours(publishedAt.getHours() - Math.floor(Math.random() * 24)); // Random trong 24h qua

      const { error } = await supabase.from("profile_posts").insert({
        profile_id: profile.id,
        user_id: user.id,
        content: samplePost.content,
        post_url: `${profile.url}/post-${Date.now()}`,
        image_url: samplePost.image_url,
        published_at: publishedAt.toISOString(),
      });

      if (error) {
        errors.push(error.message);
      } else {
        postsCreated++;
      }
    }
  }

  revalidatePath("/feed");
  revalidatePath("/");

  return {
    success: postsCreated > 0,
    postsCreated,
    error: errors.length > 0 ? errors.join(", ") : null,
  };
}
