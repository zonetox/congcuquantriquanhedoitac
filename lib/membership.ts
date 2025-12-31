"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Membership & Role Management
 * 
 * File này chứa các functions để kiểm tra quyền hạn của user.
 * Tất cả data được lấy từ bảng user_profiles (Single Source of Truth).
 * 
 * ⚠️ KHÔNG còn dùng user_metadata cho role và is_premium
 */

interface UserProfile {
  id: string;
  email: string | null;
  role: string;
  is_premium: boolean;
  updated_at: string;
}

/**
 * Lấy user profile từ database
 * Tối ưu: Không log trong production, chỉ log trong development
 */
async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Query từ bảng user_profiles
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // Nếu không tìm thấy profile, trả về default
    return {
      id: user.id,
      email: user.email || null,
      role: "user",
      is_premium: false,
      updated_at: new Date().toISOString(),
    };
  }

  if (!profile) {
    return {
      id: user.id,
      email: user.email || null,
      role: "user",
      is_premium: false,
      updated_at: new Date().toISOString(),
    };
  }

  return profile as UserProfile;
}

/**
 * Lấy thông tin membership và role trong 1 query (tối ưu performance)
 */
export async function getUserMembership(): Promise<{
  isPremium: boolean;
  isAdmin: boolean;
  role: "admin" | "user" | null;
}> {
  const profile = await getUserProfile();
  if (!profile) {
    return {
      isPremium: false,
      isAdmin: false,
      role: null,
    };
  }

  return {
    isPremium: profile.is_premium === true,
    isAdmin: profile.role === "admin",
    role: profile.role === "admin" ? "admin" : "user",
  };
}

/**
 * Kiểm tra xem user có phải Premium không
 * ⚠️ Nếu cần cả isPremium và isAdmin, dùng getUserMembership() để tối ưu
 */
export async function isPremium(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.is_premium === true;
}

/**
 * Kiểm tra xem user có phải Admin không
 * ⚠️ Nếu cần cả isPremium và isAdmin, dùng getUserMembership() để tối ưu
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin";
}

/**
 * Lấy role của user hiện tại
 * @returns 'admin' | 'user' | null
 */
export async function getUserRole(): Promise<"admin" | "user" | null> {
  const profile = await getUserProfile();
  if (!profile) return null;
  
  return profile.role === "admin" ? "admin" : "user";
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
