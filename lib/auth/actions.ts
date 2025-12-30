"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUp(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Email verification đã được tắt, không cần emailRedirectTo
      // User sẽ được đăng nhập ngay sau khi sign up
    },
  });

  if (error) {
    console.error("[signUp] Error:", error);
    return { error: error.message };
  }

  // Nếu email verification đã tắt, user sẽ được đăng nhập ngay
  // Redirect về trang chủ
  if (data.user) {
    console.log("[signUp] User created and logged in:", data.user.id);
    revalidatePath("/", "layout");
    redirect("/");
  }

  return { data, error: null };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

