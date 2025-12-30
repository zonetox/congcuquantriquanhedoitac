"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addProfile(url: string, title: string, notes?: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Debug: Log user info
  console.log("[addProfile] User check:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userError: userError?.message,
  });

  if (userError || !user) {
    console.error("[addProfile] Authentication error:", userError?.message || "No user found");
    return {
      error: "You need to sign in to add a profile. Please sign in first.",
      success: false,
    };
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error("[addProfile] Invalid URL:", url);
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
  };

  console.log("[addProfile] Inserting profile:", profileData);

  // Insert profile
  const { data, error } = await supabase
    .from("profiles_tracked")
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error("[addProfile] Database error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return {
      error: error.message || "Unable to add profile. Please try again.",
      success: false,
    };
  }

  console.log("[addProfile] Profile added successfully:", data);

  revalidatePath("/");
  return {
    data,
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
    console.log("[getProfiles] No user found, returning empty array");
    return {
      data: [],
      error: null,
    };
  }

  console.log("[getProfiles] Fetching profiles for user:", user.id);

  // Get profiles for current user
  const { data, error } = await supabase
    .from("profiles_tracked")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getProfiles] Database error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return {
      data: [],
      error: error.message,
    };
  }

  console.log("[getProfiles] Found profiles:", data?.length || 0);

  return {
    data: data || [],
    error: null,
  };
}

