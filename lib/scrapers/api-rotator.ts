"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface ApiKeyInfo {
  id: string;
  provider: string;
  api_key: string;
  status: "active" | "rate_limited" | "dead";
  quota_limit: number;
  current_usage: number;
  last_used_at: string | null;
}

/**
 * Lấy một API key còn hoạt động (active) từ database
 * Tự động chọn key có usage thấp nhất
 */
export async function getValidKey(provider: string): Promise<{
  key: ApiKeyInfo | null;
  error: string | null;
}> {
  const supabase = createAdminClient();

  // Lấy key active, sắp xếp theo current_usage (thấp nhất trước)
  const { data, error } = await supabase
    .from("api_key_pool")
    .select("*")
    .eq("provider", provider)
    .eq("status", "active")
    .order("current_usage", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      key: null,
      error: error?.message || "No active API key found for this provider",
    };
  }

  return {
    key: {
      id: data.id,
      provider: data.provider,
      api_key: data.api_key,
      status: data.status as "active" | "rate_limited" | "dead",
      quota_limit: data.quota_limit || 100,
      current_usage: data.current_usage || 0,
      last_used_at: data.last_used_at,
    },
    error: null,
  };
}

/**
 * Đánh dấu API key bị rate limited
 */
async function markKeyAsRateLimited(keyId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("api_key_pool")
    .update({ status: "rate_limited" })
    .eq("id", keyId);
}

/**
 * Cập nhật usage count cho API key
 */
async function updateKeyUsage(keyId: string): Promise<void> {
  const supabase = createAdminClient();
  
  // Tăng current_usage
  const { data: currentKey } = await supabase
    .from("api_key_pool")
    .select("current_usage")
    .eq("id", keyId)
    .single();

  if (currentKey) {
    await supabase
      .from("api_key_pool")
      .update({
        current_usage: (currentKey.current_usage || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", keyId);
  }
}

/**
 * Fetch với API rotation tự động
 * Nếu gặp lỗi 429 (Rate Limit), tự động đổi sang key khác và thử lại
 * 
 * @param provider - Provider name (e.g., "RapidAPI") hoặc RapidAPI Host (e.g., "facebook-scraper3.p.rapidapi.com")
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @param maxRetries - Số lần retry tối đa
 * @param rapidApiHost - (Optional) RapidAPI Host name nếu provider là "RapidAPI"
 */
export async function fetchWithRotation(
  provider: string,
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  rapidApiHost?: string
): Promise<{
  data: any;
  error: string | null;
  usedKeyId: string | null;
}> {
  let retries = 0;
  let lastError: string | null = null;
  let usedKeyId: string | null = null;

  // Xác định provider để query keys
  // Nếu provider là RapidAPI host (có .rapidapi.com), dùng provider đó
  // Nếu không, query với provider name (e.g., "RapidAPI")
  const providerForQuery = provider.includes(".rapidapi.com") ? "RapidAPI" : provider;
  const hostForHeaders = rapidApiHost || (provider.includes(".rapidapi.com") ? provider : undefined);

  while (retries < maxRetries) {
    // Lấy key hợp lệ từ database
    const { key, error: keyError } = await getValidKey(providerForQuery);
    
    if (keyError || !key) {
      return {
        data: null,
        error: keyError || "No valid API key available",
        usedKeyId: null,
      };
    }

    usedKeyId = key.id;

    // Thêm API key vào headers (RapidAPI format)
    const headers = new Headers(options.headers);
    headers.set("X-RapidAPI-Key", key.api_key);
    
    // Set RapidAPI Host nếu có
    if (hostForHeaders) {
      headers.set("X-RapidAPI-Host", hostForHeaders);
    } else if (provider.includes(".rapidapi.com")) {
      headers.set("X-RapidAPI-Host", provider);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Nếu thành công
      if (response.ok) {
        const data = await response.json();
        // Cập nhật usage
        await updateKeyUsage(key.id);
        return {
          data,
          error: null,
          usedKeyId: key.id,
        };
      }

      // Nếu bị rate limit (429)
      if (response.status === 429) {
        // Đánh dấu key này là rate_limited
        await markKeyAsRateLimited(key.id);
        lastError = `Rate limit exceeded for key ${key.id}. Trying next key...`;
        retries++;
        continue; // Thử key khác
      }

      // Các lỗi khác
      const errorText = await response.text();
      return {
        data: null,
        error: `HTTP ${response.status}: ${errorText}`,
        usedKeyId: key.id,
      };
    } catch (error: any) {
      lastError = error.message || "Network error";
      retries++;
      
      // Nếu đã hết retries, đánh dấu key là dead
      if (retries >= maxRetries) {
        const supabase = createAdminClient();
        await supabase
          .from("api_key_pool")
          .update({ status: "dead" })
          .eq("id", key.id);
      }
    }
  }

  return {
    data: null,
    error: lastError || "Max retries exceeded",
    usedKeyId: null,
  };
}

