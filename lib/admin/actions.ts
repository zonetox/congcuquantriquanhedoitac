"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getUserMembership } from "@/lib/membership";

/**
 * Lấy tất cả users (chỉ Admin)
 */
export async function getAllUsers(): Promise<{
  data: Array<{
    id: string;
    email: string | null;
    role: string;
    is_premium: boolean;
    trial_started_at: string | null;
    locale: string;
    updated_at: string;
  }> | null;
  error: string | null;
}> {
  // Kiểm tra admin (dùng getUserMembership để tối ưu)
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    return {
      data: null,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (profileError) {
    return {
      data: null,
      error: profileError.message,
    };
  }

  return {
    data: profile as any,
    error: null,
  };
}

/**
 * Cập nhật user (chỉ Admin)
 */
export async function updateUser(
  userId: string,
  updates: {
    email?: string;
    role?: "user" | "admin";
    is_premium?: boolean;
  }
): Promise<{
  success: boolean;
  error: string | null;
}> {
  // Kiểm tra admin (dùng getUserMembership để tối ưu)
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabaseAdmin = createAdminClient();
  const supabase = await createClient();

  // Lấy admin user ID để log
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // Cập nhật user_profiles
  const { error: updateError } = await supabaseAdmin
    .from("user_profiles")
    .update(updates)
    .eq("id", userId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  // Log admin action
  if (adminUser) {
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: adminUser.id,
      action: "update_user",
      target_user_id: userId,
      details: updates as any,
    });
  }

  revalidatePath("/admin");

  return {
    success: true,
    error: null,
  };
}

/**
 * Xóa user (chỉ Admin) - Cascade delete sẽ xóa tất cả dữ liệu liên quan
 */
export async function deleteUser(userId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  // Kiểm tra admin (dùng getUserMembership để tối ưu)
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabaseAdmin = createAdminClient();
  const supabase = await createClient();

  // Lấy admin user ID để log
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // Xóa user từ auth.users (cascade sẽ xóa user_profiles, profiles_tracked, categories)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message,
    };
  }

  // Log admin action
  if (adminUser) {
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: adminUser.id,
      action: "delete_user",
      target_user_id: userId,
      details: null,
    });
  }

  revalidatePath("/admin");

  return {
    success: true,
    error: null,
  };
}

/**
 * Cập nhật profile (chỉ Admin)
 */
export async function updateProfile(
  profileId: string,
  updates: {
    title?: string;
    url?: string;
    category?: string;
    notes?: string;
  }
): Promise<{
  success: boolean;
  error: string | null;
}> {
  // Kiểm tra admin (dùng getUserMembership để tối ưu)
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabaseAdmin = createAdminClient();
  const supabase = await createClient();

  // Lấy admin user ID để log
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // Lấy profile hiện tại để log
  const { data: currentProfile } = await supabaseAdmin
    .from("profiles_tracked")
    .select("user_id")
    .eq("id", profileId)
    .single();

  // Cập nhật profile
  const { error: updateError } = await supabaseAdmin
    .from("profiles_tracked")
    .update(updates)
    .eq("id", profileId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    };
  }

  // Log admin action
  if (adminUser && currentProfile) {
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: adminUser.id,
      action: "update_profile",
      target_user_id: currentProfile.user_id,
      details: { profile_id: profileId, updates } as any,
    });
  }

  revalidatePath("/admin");

  return {
    success: true,
    error: null,
  };
}

/**
 * Xóa profile (chỉ Admin)
 */
export async function deleteProfileAsAdmin(profileId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  // Kiểm tra admin (dùng getUserMembership để tối ưu)
  const membership = await getUserMembership();
  if (!membership.isAdmin) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabaseAdmin = createAdminClient();
  const supabase = await createClient();

  // Lấy admin user ID để log
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // Lấy profile hiện tại để log
  const { data: currentProfile } = await supabaseAdmin
    .from("profiles_tracked")
    .select("user_id")
    .eq("id", profileId)
    .single();

  // Xóa profile
  const { error: deleteError } = await supabaseAdmin
    .from("profiles_tracked")
    .delete()
    .eq("id", profileId);

  if (deleteError) {
    return {
      success: false,
      error: deleteError.message,
    };
  }

  // Log admin action
  if (adminUser && currentProfile) {
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: adminUser.id,
      action: "delete_profile",
      target_user_id: currentProfile.user_id,
      details: { profile_id: profileId } as any,
    });
  }

  revalidatePath("/admin");

  return {
    success: true,
    error: null,
  };
}

