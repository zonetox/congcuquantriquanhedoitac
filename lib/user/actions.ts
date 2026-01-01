"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { locales, type Locale } from "@/i18n/request";

/**
 * Cập nhật language preference của user
 */
export async function updateUserLocale(locale: Locale): Promise<{
  success: boolean;
  error: string | null;
}> {
  // Validate locale
  if (!locales.includes(locale)) {
    return {
      success: false,
      error: "Invalid locale",
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You need to sign in to update language preference.",
    };
  }

  // Update locale in user_profiles
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ locale })
    .eq("id", user.id);

  if (updateError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateUserLocale] Database error:", updateError);
    }
    return {
      success: false,
      error: updateError.message || "Unable to update language preference. Please try again.",
    };
  }

  revalidatePath("/");
  return {
    success: true,
    error: null,
  };
}

/**
 * Lấy locale của user từ database
 */
export async function getUserLocale(): Promise<Locale> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return "en"; // Default locale
  }

  // Query locale từ user_profiles
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("locale")
    .eq("id", user.id)
    .single();

  if (error || !profile || !profile.locale) {
    return "en"; // Default locale
  }

  // Validate locale
  const locale = profile.locale as Locale;
  return locales.includes(locale) ? locale : "en";
}

