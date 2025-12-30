"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Kiểm tra xem user có phải premium không
 * 
 * Logic:
 * 1. Kiểm tra user.user_metadata?.is_premium (sẽ được cập nhật từ Lemon Squeezy webhook)
 * 2. Nếu không có trong metadata, mặc định là false (free user)
 * 
 * Sau này có thể mở rộng để check từ bảng users riêng trong database
 */
export async function isPremium(): Promise<boolean> {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  // Kiểm tra từ user metadata (sẽ được cập nhật từ Lemon Squeezy webhook)
  // Tạm thời: Mặc định false (free user)
  const isPremium = user.user_metadata?.is_premium === true;
  
  return isPremium;
}

