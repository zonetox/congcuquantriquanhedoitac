"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/membership";
import { revalidatePath } from "next/cache";

export interface ApiKey {
  id: string;
  provider: string;
  api_key: string;
  is_active: boolean;
  quota_limit: number;
  current_usage: number;
  last_used_at: string | null;
  error_count: number;
  created_at: string;
}

/**
 * Lấy tất cả API keys (chỉ Admin)
 */
export async function getAllApiKeys(): Promise<{
  data: ApiKey[] | null;
  error: string | null;
}> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return {
      data: null,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("api_key_pool")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data as ApiKey[],
    error: null,
  };
}

/**
 * Bulk import API keys (mỗi dòng 1 key, format: provider:key)
 */
export async function bulkImportApiKeys(
  keysText: string
): Promise<{
  success: number;
  failed: number;
  error: string | null;
}> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return {
      success: 0,
      failed: 0,
      error: "Unauthorized. Admin access required.",
    };
  }

  const lines = keysText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const supabase = createAdminClient();
  let success = 0;
  let failed = 0;

  for (const line of lines) {
    // Format: "provider:key" hoặc chỉ "key" (default provider: RapidAPI)
    const parts = line.split(":");
    const provider = parts.length > 1 ? parts[0].trim() : "RapidAPI";
    const apiKey = parts.length > 1 ? parts.slice(1).join(":").trim() : parts[0].trim();

    if (!apiKey) {
      failed++;
      continue;
    }

    const { error } = await supabase.from("api_key_pool").insert({
      provider,
      api_key: apiKey,
      is_active: true,
      quota_limit: 100,
      current_usage: 0,
      error_count: 0,
    });

    if (error) {
      failed++;
    } else {
      success++;
    }
  }

  revalidatePath("/admin");
  return {
    success,
    failed,
    error: null,
  };
}

/**
 * Toggle active status của API key
 */
export async function toggleApiKeyStatus(
  keyId: string,
  isActive: boolean
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("api_key_pool")
    .update({ is_active: isActive })
    .eq("id", keyId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/admin");
  return {
    success: true,
    error: null,
  };
}

/**
 * Xóa API key
 */
export async function deleteApiKey(keyId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return {
      success: false,
      error: "Unauthorized. Admin access required.",
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("api_key_pool").delete().eq("id", keyId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/admin");
  return {
    success: true,
    error: null,
  };
}

/**
 * Lấy một API key hợp lệ để sử dụng (xoay vòng)
 * Tìm key có is_active = true và current_usage < quota_limit
 */
export async function getValidApiKey(provider?: string): Promise<{
  data: ApiKey | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  let query = supabase
    .from("api_key_pool")
    .select("*")
    .eq("is_active", true);

  if (provider) {
    query = query.eq("provider", provider);
  }

  const { data: allKeys, error: fetchError } = await query;

  if (fetchError) {
    return {
      data: null,
      error: fetchError.message,
    };
  }

  // Filter keys where current_usage < quota_limit
  const validKeys = (allKeys || []).filter((key: any) => key.current_usage < key.quota_limit);

  if (validKeys.length === 0) {
    return {
      data: null,
      error: "No valid API key available",
    };
  }

  // Sort by usage and get the first one
  const sortedKeys = validKeys.sort((a: any, b: any) => a.current_usage - b.current_usage);
  const data = [sortedKeys[0]];

  if (!data || data.length === 0) {
    return {
      data: null,
      error: "No valid API key available",
    };
  }

  return {
    data: data[0] as ApiKey,
    error: null,
  };
}

/**
 * Cập nhật usage và error count của API key sau khi sử dụng
 */
export async function updateApiKeyUsage(
  keyId: string,
  incrementUsage: boolean = true,
  incrementError: boolean = false
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Lấy key hiện tại để tính toán
  const { data: currentKey, error: fetchError } = await supabase
    .from("api_key_pool")
    .select("*")
    .eq("id", keyId)
    .single();

  if (fetchError || !currentKey) {
    return {
      success: false,
      error: fetchError?.message || "Key not found",
    };
  }

  const updates: any = {
    last_used_at: new Date().toISOString(),
  };

  if (incrementUsage) {
    updates.current_usage = (currentKey.current_usage || 0) + 1;
  }

  if (incrementError) {
    const newErrorCount = (currentKey.error_count || 0) + 1;
    updates.error_count = newErrorCount;
    // Tự động khóa nếu error_count >= 5
    updates.is_active = newErrorCount < 5;
  }

  const { error } = await supabase
    .from("api_key_pool")
    .update(updates)
    .eq("id", keyId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

/**
 * Đánh dấu API key là inactive khi nhận lỗi 429 (Too Many Requests)
 */
export async function markApiKeyAsInactive(keyId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Lấy key hiện tại để tính toán error_count
  const { data: currentKey, error: fetchError } = await supabase
    .from("api_key_pool")
    .select("error_count")
    .eq("id", keyId)
    .single();

  if (fetchError || !currentKey) {
    return {
      success: false,
      error: fetchError?.message || "Key not found",
    };
  }

  const { error } = await supabase
    .from("api_key_pool")
    .update({
      is_active: false,
      error_count: (currentKey.error_count || 0) + 1,
    })
    .eq("id", keyId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

