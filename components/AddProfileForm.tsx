"use client";

import { useState, useEffect } from "react";
import { addProfile } from "@/lib/profiles/actions";
import { Link, Plus, Loader2, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getFaviconUrl, getDomainFromUrl, isValidUrl, normalizeUrl } from "@/lib/utils/url";
import { isPremium } from "@/lib/auth/helpers";

// Giới hạn miễn phí: 5 profiles
const MAX_PROFILES = 5;

interface AddProfileFormProps {
  currentProfileCount?: number;
  isPremium?: boolean;
}

const CATEGORIES = [
  { value: "General", label: "General" },
  { value: "Competitor", label: "Competitor" },
  { value: "Partner", label: "Partner" },
  { value: "Customer", label: "Customer" },
  { value: "Other", label: "Other" },
] as const;

export function AddProfileForm({ currentProfileCount = 0, isPremium: isPremiumProp = false }: AddProfileFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [isUserPremium, setIsUserPremium] = useState<boolean>(isPremiumProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [domainPreview, setDomainPreview] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);

  // Cập nhật premium status khi prop thay đổi
  useEffect(() => {
    setIsUserPremium(isPremiumProp);
    // Nếu không phải premium, set category về General
    if (!isPremiumProp) {
      setCategory("General");
    }
  }, [isPremiumProp]);

  // Auto-detect favicon and suggest title when URL changes
  useEffect(() => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      // Thử normalize URL nếu chưa hợp lệ
      let urlToCheck = trimmedUrl;
      if (!isValidUrl(trimmedUrl)) {
        urlToCheck = normalizeUrl(trimmedUrl);
      }
      
      if (isValidUrl(urlToCheck)) {
        const domain = getDomainFromUrl(urlToCheck);
        setFaviconPreview(getFaviconUrl(urlToCheck));
        setDomainPreview(domain);
        
        // Auto-suggest title from domain if title is empty
        if (!title.trim() && domain) {
          // Capitalize first letter and remove common TLDs for better display
          const suggestedTitle = domain
            .replace(/\.(com|net|org|io|co|ai|dev)$/i, "")
            .split(".")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          
          // Only suggest if it looks like a reasonable name
          if (suggestedTitle.length > 0 && suggestedTitle.length < 50) {
            // Don't auto-fill, just show as placeholder suggestion
          }
        }
      } else {
        setFaviconPreview(null);
        setDomainPreview(null);
        setFaviconError(false);
      }
    } else {
      setFaviconPreview(null);
      setDomainPreview(null);
      setFaviconError(false);
    }
  }, [url, title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra giới hạn miễn phí - Chỉ áp dụng cho free users
    if (!isUserPremium && currentProfileCount >= MAX_PROFILES) {
      toast.error(`Free limit reached (${MAX_PROFILES} profiles). Please upgrade to Premium for unlimited tracking!`);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate inputs
    if (!url.trim() || !title.trim()) {
      setError("Please fill in both Profile Link and Company/Partner Name");
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Validate URL format - must have http or https
    // Normalize URL trước để loại bỏ duplicate và đảm bảo có protocol
    let normalizedUrl = normalizeUrl(url.trim());
    
    // Validate sau khi normalize
    if (!isValidUrl(normalizedUrl)) {
      setError("Invalid URL. Please enter a valid URL starting with http:// or https://");
      toast.error("Invalid URL format. Must start with http:// or https://");
      setLoading(false);
      return;
    }
    
    // Cập nhật URL đã normalize (nếu khác với input ban đầu)
    if (normalizedUrl !== url.trim()) {
      setUrl(normalizedUrl);
    }

    try {
      // Validate category - Free users chỉ được chọn General
      const selectedCategory = isUserPremium ? category : "General";
      // Notes chỉ được lưu nếu user là premium
      const notesToSave = isUserPremium ? notes.trim() : undefined;

      console.log("[AddProfileForm] Submitting profile:", {
        url: normalizedUrl,
        title: title.trim(),
        category: selectedCategory,
        notes: notesToSave,
        isPremium: isUserPremium,
      });

      const result = await addProfile(
        normalizedUrl,
        title.trim(),
        notesToSave,
        selectedCategory
      );

      console.log("[AddProfileForm] Server response:", result);

      if (result.error) {
        console.error("[AddProfileForm] Error from server:", result.error);
        setError(result.error);
        toast.error(result.error);
      } else if (result.success) {
        console.log("[AddProfileForm] Profile added successfully, refreshing...");
        setSuccess(true);
        setUrl("");
        setTitle("");
        setNotes("");
        setCategory(isUserPremium ? category : "General");
        setFaviconPreview(null);
        setDomainPreview(null);
        setFaviconError(false);
        toast.success("Profile added successfully!");
        
        // Refresh để cập nhật danh sách profiles ngay lập tức
        router.refresh();
      }
    } catch (err: any) {
      console.error("[AddProfileForm] Unexpected error:", err);
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add New Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link Profile Input */}
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Link Profile
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => {
                  // Auto-fill URL from clipboard và normalize
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData("text").trim();
                  if (pastedText) {
                    // Normalize URL để loại bỏ duplicate và đảm bảo có protocol
                    const normalized = normalizeUrl(pastedText);
                    setUrl(normalized);
                  }
                }}
                onBlur={(e) => {
                  // Tự động normalize URL khi blur (rời khỏi input)
                  const currentUrl = e.target.value.trim();
                  if (currentUrl) {
                    const normalized = normalizeUrl(currentUrl);
                    // Chỉ update nếu normalized khác với current (tránh loop)
                    if (normalized !== currentUrl) {
                      setUrl(normalized);
                    }
                  }
                }}
                required
                placeholder="https://example.com or paste link directly"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Favicon Preview */}
            {domainPreview && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-3">
                {faviconError || !faviconPreview ? (
                  // Fallback icon từ lucide-react nếu không lấy được favicon
                  <div className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                ) : (
                  <img
                    src={faviconPreview}
                    alt={domainPreview}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                    onError={() => {
                      // Đánh dấu lỗi để hiển thị icon fallback
                      setFaviconError(true);
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {domainPreview}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Favicon loaded automatically
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tên công ty/đối tác Input */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Company/Partner Name
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                domainPreview
                  ? `e.g., ${domainPreview.replace(/\.(com|net|org|io|co|ai|dev)$/i, "").split(".")[0]}`
                  : "Company or partner name"
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Category Select */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Category
              {!isUserPremium && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Free: General only)
                </span>
              )}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!isUserPremium}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {!isUserPremium && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Upgrade to Premium to unlock all categories
              </p>
            )}
          </div>

          {/* Quick Notes Input */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Quick Notes
              {isUserPremium ? (
                <span className="text-gray-400 text-xs font-normal ml-2">(Optional)</span>
              ) : (
                <span className="text-gray-400 text-xs font-normal ml-2">(Premium only)</span>
              )}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isUserPremium}
              placeholder={
                isUserPremium
                  ? "Why are you tracking this competitor? (e.g., Pricing strategy, New features, Market positioning...)"
                  : "Upgrade to Premium to add notes"
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isUserPremium
                ? "Add a quick note about why you're tracking this profile" // eslint-disable-line react/no-unescaped-entities
                : "Upgrade to Premium to unlock notes feature"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}


          {/* Upgrade Message if limit reached - Chỉ hiển thị cho free users */}
          {!isUserPremium && currentProfileCount >= MAX_PROFILES && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                Free limit reached ({MAX_PROFILES} profiles). Please upgrade to Premium for unlimited tracking!
              </p>
            </div>
          )}

          {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!isUserPremium && currentProfileCount >= MAX_PROFILES)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add</span>
              </>
            )}
          </button>
          
              {/* Profile Count Info */}
              {!isUserPremium && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {currentProfileCount} / {MAX_PROFILES} profiles used
                </p>
              )}
              {isUserPremium && (
                <p className="text-xs text-center text-yellow-600 dark:text-yellow-400 font-medium">
                  ✨ Premium: Unlimited profiles
                </p>
              )}
        </form>
      </div>
    </div>
  );
}

