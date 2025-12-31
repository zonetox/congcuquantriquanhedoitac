"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Admin Actions for Profile Management
 * 
 * ⚠️ CHỈ dùng trong admin pages
 * ⚠️ PHẢI kiểm tra isAdmin() trước khi gọi các functions này
 */

/**
 * Lấy tất cả profiles trong hệ thống (Admin only)
 */
export async function getAllProfiles() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles_tracked")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllProfiles] Error:", error);
    return {
      data: null,
      error: error.message || "Failed to fetch profiles",
    };
  }

  return {
    data,
    error: null,
  };
}

/**
 * Lấy số lượng profiles theo user
 */
export async function getProfilesCountByUser() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles_tracked")
    .select("user_id")
    .then((result) => {
      if (result.error) return result;
      
      // Count profiles by user_id
      const counts: Record<string, number> = {};
      result.data?.forEach((profile) => {
        counts[profile.user_id] = (counts[profile.user_id] || 0) + 1;
      });

      return {
        data: Object.entries(counts).map(([user_id, count]) => ({
          user_id,
          count,
        })),
        error: null,
      };
    });

  if (error) {
    console.error("[getProfilesCountByUser] Error:", error);
    return {
      data: null,
      error: error.message || "Failed to count profiles",
    };
  }

  return {
    data,
    error: null,
  };
}

