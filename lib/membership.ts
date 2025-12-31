"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Membership & Role Management
 * 
 * File này chứa các functions để kiểm tra quyền hạn của user:
 * - Premium status
 * - User role (user/admin)
 * - Feature access
 */

/**
 * Kiểm tra xem user có phải Premium không
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

  return user.user_metadata?.is_premium === true;
}

/**
 * Kiểm tra xem user có phải Admin không
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  return user.user_metadata?.role === "admin";
}

/**
 * Lấy role của user hiện tại
 * @returns 'admin' | 'user' | null
 */
export async function getUserRole(): Promise<"admin" | "user" | null> {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const role = user.user_metadata?.role;
  return role === "admin" ? "admin" : role === "user" ? "user" : "user"; // Default to 'user'
}

/**
 * Kiểm tra xem user có thể chọn category 'Competitor' không
 * 
 * Logic:
 * - Free users: KHÔNG được chọn 'Competitor' (chỉ 'General')
 * - Premium users: Được chọn tất cả categories
 */
export async function canSelectCompetitorCategory(): Promise<boolean> {
  return await isPremium();
}

/**
 * Kiểm tra xem user có thể thêm profile mới không
 * 
 * Logic:
 * - Free users: Tối đa 5 profiles
 * - Premium users: Unlimited
 */
export async function canAddProfile(currentProfileCount: number): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const premium = await isPremium();
  const MAX_FREE_PROFILES = 5;

  if (premium) {
    return { allowed: true };
  }

  if (currentProfileCount >= MAX_FREE_PROFILES) {
    return {
      allowed: false,
      reason: `Free limit reached (${MAX_FREE_PROFILES} profiles). Please upgrade to Premium for unlimited tracking!`,
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra xem user có thể sử dụng Notes feature không
 * 
 * Logic:
 * - Free users: KHÔNG
 * - Premium users: CÓ
 */
export async function canUseNotes(): Promise<boolean> {
  return await isPremium();
}

/**
 * Lấy thông tin membership đầy đủ của user
 */
export async function getMembershipInfo(): Promise<{
  isPremium: boolean;
  role: "admin" | "user" | null;
  canSelectCompetitor: boolean;
  canUseNotes: boolean;
  maxProfiles: number | null; // null = unlimited
}> {
  const [premium, role, canCompetitor, canNotes] = await Promise.all([
    isPremium(),
    getUserRole(),
    canSelectCompetitorCategory(),
    canUseNotes(),
  ]);

  return {
    isPremium: premium,
    role,
    canSelectCompetitor: canCompetitor,
    canUseNotes: canNotes,
    maxProfiles: premium ? null : 5, // 5 for free, null (unlimited) for premium
  };
}

