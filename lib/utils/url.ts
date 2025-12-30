/**
 * Extract domain from URL
 */
export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Get favicon URL from domain
 */
export function getFaviconUrl(url: string): string {
  try {
    const domain = getDomainFromUrl(url);
    // Use Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "/default-favicon.png";
  }
}

/**
 * Validate URL format - must have http or https protocol
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Chỉ chấp nhận http hoặc https
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize URL - thêm https:// nếu thiếu protocol
 * Đảm bảo URL không bị duplicate
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;
  
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  // Loại bỏ các khoảng trắng thừa
  let cleanUrl = trimmed.replace(/\s+/g, "");
  
  // Nếu đã có protocol, trả về nguyên bản (đã clean)
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }
  
  // Kiểm tra xem có phải là URL đã bị duplicate không (có 2 lần https://)
  // Ví dụ: https://example.com/https://example.com
  const httpsIndex = cleanUrl.indexOf("https://");
  if (httpsIndex > 0) {
    // Có https:// ở giữa, lấy phần đầu tiên
    cleanUrl = cleanUrl.substring(0, httpsIndex);
  }
  
  const httpIndex = cleanUrl.indexOf("http://");
  if (httpIndex > 0) {
    // Có http:// ở giữa, lấy phần đầu tiên
    cleanUrl = cleanUrl.substring(0, httpIndex);
  }
  
  // Tự động thêm https:// nếu chưa có
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    return `https://${cleanUrl}`;
  }
  
  return cleanUrl;
}

