"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addProfile(
  url: string,
  title: string,
  notes?: string,
  category?: string
) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addProfile] Authentication error:", userError?.message || "No user found");
    }
    return {
      error: "You need to sign in to add a profile. Please sign in first.",
      success: false,
    };
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error("[addProfile] Invalid URL:", url);
    }
    return {
      error: "Invalid URL. Please enter a full URL (e.g., https://example.com)",
      success: false,
    };
  }

  // Prepare data to insert
  const profileData = {
    user_id: user.id,
    url: url,
    title: title,
    notes: notes?.trim() || null,
    category: category?.trim() || "General",
  };

  // Insert profile
  const { data, error } = await supabase
    .from("profiles_tracked")
    .insert(profileData)
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addProfile] Database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
    return {
      error: error.message || "Unable to add profile. Please try again.",
      success: false,
    };
  }

  revalidatePath("/");
  return {
    data,
    success: true,
    error: null,
  };
}

export async function toggleFeedStatus(profileId: string, isInFeed: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "You need to sign in to update profile.",
      success: false,
    };
  }

  const { error } = await supabase
    .from("profiles_tracked")
    .update({ is_in_feed: isInFeed })
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message || "Unable to update profile.",
      success: false,
    };
  }

  revalidatePath("/");
  revalidatePath("/feed");
  return {
    success: true,
    error: null,
  };
}

export async function deleteProfile(profileId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "You need to sign in to delete a profile.",
      success: false,
    };
  }

  // Delete profile (only if it belongs to the user)
  const { error } = await supabase
    .from("profiles_tracked")
    .delete()
    .eq("id", profileId)
    .eq("user_id", user.id);

  if (error) {
    return {
      error: error.message || "Unable to delete profile. Please try again.",
      success: false,
    };
  }

  revalidatePath("/");
  return {
    success: true,
    error: null,
  };
}

export async function getProfiles() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: [],
      error: null,
    };
  }

  // Get profiles for current user
  const { data, error } = await supabase
    .from("profiles_tracked")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getProfiles] Database error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
    return {
      data: [],
      error: error.message,
    };
  }

  return {
    data: data || [],
    error: null,
  };
}

