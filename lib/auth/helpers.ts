"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * ⚠️ DEPRECATED: File này đã được thay thế bởi lib/membership.ts
 * 
 * Sử dụng lib/membership.ts thay vì file này.
 * File này được giữ lại để tương thích ngược, nhưng sẽ bị xóa trong tương lai.
 */

/**
 * @deprecated Sử dụng isPremium() từ lib/membership.ts thay thế
 */
export async function isPremium(): Promise<boolean> {
  // Forward to new implementation
  const { isPremium: newIsPremium } = await import("@/lib/membership");
  return newIsPremium();
}
