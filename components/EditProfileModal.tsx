"use client";

import { useState, useEffect } from "react";
import { updateProfile } from "@/lib/profiles/actions";
import { X, Loader2, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { getFaviconUrl, getDomainFromUrl, isValidUrl, normalizeUrl } from "@/lib/utils/url";
import { CategorySelector } from "@/components/CategorySelector";
import { useTranslations } from "next-intl";
import type { Profile } from "@/lib/profiles/types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [title, setTitle] = useState(profile.title);
  const [url, setUrl] = useState(profile.url);
  const [notes, setNotes] = useState(profile.notes || "");
  const [category, setCategory] = useState<string>(profile.category || "General");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [domainPreview, setDomainPreview] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState(false);

  // Update state when profile changes
  useEffect(() => {
    if (profile) {
      setTitle(profile.title);
      setUrl(profile.url);
      setNotes(profile.notes || "");
      setCategory(profile.category || "General");
    }
  }, [profile]);

  // Auto-detect favicon when URL changes
  useEffect(() => {
    if (url && isValidUrl(url)) {
      const normalized = normalizeUrl(url);
      const domain = getDomainFromUrl(normalized);
      setDomainPreview(domain);
      setFaviconPreview(getFaviconUrl(normalized));
    } else {
      setFaviconPreview(null);
      setDomainPreview(null);
    }
  }, [url]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setFaviconError(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    if (!url.trim()) {
      setError(t("urlRequired"));
      return;
    }

    const normalizedUrl = normalizeUrl(url.trim());

    if (!isValidUrl(normalizedUrl)) {
      setError(t("urlInvalid"));
      return;
    }

    // Validate title
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }

    setLoading(true);

    try {
      const result = await updateProfile(profile.id, {
        title: title.trim(),
        url: normalizedUrl,
        notes: notes.trim() || undefined,
        category: category || "General",
      });

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success(t("updateSuccess"));
        router.refresh();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Error updating profile:", err);
      toast.error(t("updateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleUrlBlur = () => {
    if (url) {
      const normalized = normalizeUrl(url);
      setUrl(normalized);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("edit")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("url")} *
            </label>
            <div className="relative">
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
              {faviconPreview && !faviconError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Image
                    src={faviconPreview}
                    alt={domainPreview || "Favicon"}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded"
                    unoptimized
                    onError={() => setFaviconError(true)}
                  />
                </div>
              )}
            </div>
            {domainPreview && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Domain: {domainPreview}
              </p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("title")} *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Company or Person Name"
              className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Category Select */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("category")}
            </label>
            <CategorySelector
              value={category}
              onChange={setCategory}
              isPremium={true}
              disabled={loading}
            />
          </div>

          {/* Notes Textarea */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("notes")}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notes")}
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                tCommon("save")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

