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
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  // Nếu đã có protocol, trả về nguyên bản
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  // Tự động thêm https://
  return `https://${trimmed}`;
}

