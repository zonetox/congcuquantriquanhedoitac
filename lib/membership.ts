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
  trial_started_at: string | null;
  locale: string;
  updated_at: string;
}

/**
 * Lấy user profile từ database
 * Tối ưu: Không log trong production, chỉ log trong development
 */
async function getUserProfile(): Promise<UserProfile | null> {
  try {
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
      // Nếu không tìm thấy profile, trả về default với trial_started_at = now
      return {
        id: user.id,
        email: user.email || null,
        role: "user",
        is_premium: false,
        trial_started_at: new Date().toISOString(),
        locale: "en",
        updated_at: new Date().toISOString(),
      };
    }

    if (!profile) {
      return {
        id: user.id,
        email: user.email || null,
        role: "user",
        is_premium: false,
        trial_started_at: new Date().toISOString(),
        locale: "en",
        updated_at: new Date().toISOString(),
      };
    }

    // Nếu trial_started_at chưa có, set mặc định là now (cho users cũ)
    if (!profile.trial_started_at) {
      return {
        ...profile,
        trial_started_at: new Date().toISOString(),
        locale: (profile as any).locale || "en",
      } as UserProfile;
    }

    return profile as UserProfile;
  } catch (error) {
    // Catch any unexpected errors and return null
    if (process.env.NODE_ENV === "development") {
      console.error("[getUserProfile] Unexpected error:", error);
    }
    return null;
  }
}

/**
 * Kiểm tra xem user có đang trong trial period không (15 ngày)
 */
function isInTrialPeriod(trialStartedAt: string | null): boolean {
  if (!trialStartedAt) return false;
  
  const trialStart = new Date(trialStartedAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff <= 15;
}

/**
 * Lấy số ngày còn lại của trial
 * @returns Số ngày còn lại (0-15), hoặc null nếu không có trial hoặc đã hết hạn
 */
export async function getTrialStatus(): Promise<{
  daysLeft: number | null;
  isActive: boolean;
  isExpired: boolean;
}> {
  const profile = await getUserProfile();
  if (!profile || !profile.trial_started_at) {
    return {
      daysLeft: null,
      isActive: false,
      isExpired: false,
    };
  }

  const trialStart = new Date(profile.trial_started_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 15 - daysDiff);
  const isActive = daysLeft > 0;
  const isExpired = daysDiff > 15;

  return {
    daysLeft: isActive ? daysLeft : null,
    isActive,
    isExpired,
  };
}

/**
 * Kiểm tra xem user có quyền Premium hợp lệ không
 * Premium hợp lệ = is_premium === true HOẶC đang trong trial period (<= 15 ngày)
 */
export async function hasValidPremiumAccess(): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;

  // Nếu đã là premium, return true
  if (profile.is_premium === true) return true;

  // Nếu không có trial_started_at, return false
  if (!profile.trial_started_at) return false;

  // Kiểm tra xem còn trong trial period không
  return isInTrialPeriod(profile.trial_started_at);
}

/**
 * Lấy thông tin membership và role trong 1 query (tối ưu performance)
 * Bao gồm trial status
 */
export async function getUserMembership(): Promise<{
  isPremium: boolean;
  isAdmin: boolean;
  role: "admin" | "user" | null;
  hasValidPremium: boolean; // is_premium === true HOẶC đang trong trial
  trialStatus: {
    daysLeft: number | null;
    isActive: boolean;
    isExpired: boolean;
  };
}> {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return {
        isPremium: false,
        isAdmin: false,
        role: null,
        hasValidPremium: false,
        trialStatus: {
          daysLeft: null,
          isActive: false,
          isExpired: false,
        },
      };
    }

  const hasValidPremium = profile.is_premium === true || (profile.trial_started_at ? isInTrialPeriod(profile.trial_started_at) : false);
  
  // Tính trial status
  let trialStatus = {
    daysLeft: null as number | null,
    isActive: false,
    isExpired: false,
  };

  if (profile.trial_started_at) {
    const trialStart = new Date(profile.trial_started_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 15 - daysDiff);
    trialStatus = {
      daysLeft: daysLeft > 0 ? daysLeft : null,
      isActive: daysLeft > 0,
      isExpired: daysDiff > 15,
    };
  }

    return {
      isPremium: profile.is_premium === true,
      isAdmin: profile.role === "admin",
      role: profile.role === "admin" ? "admin" : "user",
      hasValidPremium,
      trialStatus,
    };
  } catch (error) {
    // Catch any unexpected errors and return safe defaults
    if (process.env.NODE_ENV === "development") {
      console.error("[getUserMembership] Unexpected error:", error);
    }
    return {
      isPremium: false,
      isAdmin: false,
      role: null,
      hasValidPremium: false,
      trialStatus: {
        daysLeft: null,
        isActive: false,
        isExpired: false,
      },
    };
  }
}

/**
 * Kiểm tra xem user có phải Premium không (chỉ check is_premium, không tính trial)
 * ⚠️ Nếu cần cả isPremium và isAdmin, dùng getUserMembership() để tối ưu
 * ⚠️ Nếu cần check Premium hợp lệ (bao gồm trial), dùng hasValidPremiumAccess()
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
 * Logic mới: Tất cả users đều có thể chọn tất cả categories (full features)
 */
export async function canSelectCompetitorCategory(): Promise<boolean> {
  return true;
}

/**
 * Kiểm tra xem user có thể thêm profile mới không
 * 
 * Logic mới (Trial + Blur):
 * - KHÔNG chặn cứng việc thêm profile
 * - Cho phép thêm unlimited profiles
 * - Profiles từ thứ 6 trở đi sẽ bị blur nếu trial expired và không premium
 * - Trả về warning message nếu đạt giới hạn, nhưng vẫn cho phép thêm
 */
export async function canAddProfile(currentProfileCount: number): Promise<{
  allowed: boolean;
  reason?: string;
  warning?: string; // Warning message nhưng vẫn cho phép
}> {
  const hasValidPremium = await hasValidPremiumAccess();
  const MAX_FREE_PROFILES = 5;

  // Premium users: Unlimited, không có warning
  if (hasValidPremium) {
    return { allowed: true };
  }

  // Free users: Vẫn cho phép thêm, nhưng có warning nếu >= 5
  if (currentProfileCount >= MAX_FREE_PROFILES) {
    return {
      allowed: true, // Vẫn cho phép thêm
      warning: `You've reached the free limit (${MAX_FREE_PROFILES} profiles). Additional profiles will be blurred until you upgrade.`,
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra xem user có thể sử dụng Notes feature không
 * 
 * Logic mới: Tất cả users đều có thể sử dụng Notes (full features)
 */
export async function canUseNotes(): Promise<boolean> {
  return true;
}

/**
 * Lấy thông tin membership đầy đủ của user
 */
export async function getMembershipInfo(): Promise<{
  isPremium: boolean;
  role: "admin" | "user" | null;
  canSelectCompetitor: boolean;
  canUseNotes: boolean;
  maxProfiles: number | null; // null = unlimited (all users have unlimited now)
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
    maxProfiles: null, // All users have unlimited profiles (blur from 6th if trial expired)
  };
}
