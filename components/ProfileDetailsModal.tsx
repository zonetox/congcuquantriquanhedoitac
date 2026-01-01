"use client";

import { useState, useEffect } from "react";
import { X, Loader2, MessageSquare, Phone, Mail, MessageCircle, Plus } from "lucide-react";
import { addInteractionLog, getInteractionLogs } from "@/lib/crm/actions";
import { toggleFeedStatus } from "@/lib/profiles/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Profile } from "@/lib/profiles/types";
import type { InteractionLog } from "@/lib/crm/types";

interface ProfileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export function ProfileDetailsModal({ isOpen, onClose, profile }: ProfileDetailsModalProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [content, setContent] = useState("");
  const [interactionType, setInteractionType] = useState<"note" | "call" | "message" | "comment">("note");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isInFeed, setIsInFeed] = useState(profile.is_in_feed || false);
  const [togglingFeed, setTogglingFeed] = useState(false);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const result = await getInteractionLogs(profile.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      setLogs(result.data || []);
    }
    setLoadingLogs(false);
  };

  // Load interaction logs when modal opens
  useEffect(() => {
    if (isOpen && profile.id) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, profile.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(t("notes") + " " + tCommon("error"));
      return;
    }

    setLoading(true);
    const result = await addInteractionLog(profile.id, content.trim(), interactionType);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("interactionAdded"));
      setContent("");
      setInteractionType("note");
      loadLogs(); // Reload logs
      router.refresh(); // Refresh to update last_interacted_at
    }
    setLoading(false);
  };

  const handleToggleFeed = async () => {
    setTogglingFeed(true);
    const result = await toggleFeedStatus(profile.id, !isInFeed);
    if (result.error) {
      toast.error(result.error);
    } else {
      setIsInFeed(!isInFeed);
      toast.success(isInFeed ? t("removedFromFeed") : t("addedToFeed"));
      router.refresh();
    }
    setTogglingFeed(false);
  };

  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get icon for interaction type
  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "message":
        return <MessageSquare className="w-4 h-4" />;
      case "comment":
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Get color for interaction type
  const getInteractionColor = (type: string) => {
    switch (type) {
      case "call":
        return "text-blue-500 bg-blue-50";
      case "message":
        return "text-emerald-500 bg-emerald-50";
      case "comment":
        return "text-purple-500 bg-purple-50";
      default:
        return "text-slate-500 bg-slate-50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="neu-card rounded-neu-xl shadow-soft-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Profile Details</h2>
            <p className="text-sm text-slate-600 mt-1">{profile.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 neu-icon-box rounded-xl text-slate-500 hover:text-red-500 transition-all active:shadow-soft-button-pressed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Feed Toggle - Neumorphism Style */}
          <div className="neu-card rounded-neu-lg p-6 shadow-soft-out">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">{t("showInFeed")}</h3>
                <p className="text-sm text-slate-600">{t("showInFeedDescription")}</p>
              </div>
              <button
                onClick={handleToggleFeed}
                disabled={togglingFeed}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  isInFeed
                    ? "bg-gradient-to-r from-emerald-400 to-blue-400 shadow-soft-button"
                    : "neu-icon-box shadow-soft-icon"
                } disabled:opacity-50`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-soft-button transition-transform duration-300 ${
                    isInFeed ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Add Interaction Form */}
          <div className="neu-card rounded-neu-lg p-6 shadow-soft-out">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-pastel-purple" />
              {t("addInteraction")}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Interaction Type Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInteractionType("note")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    interactionType === "note"
                      ? "neu-button shadow-soft-button text-slate-800"
                      : "neu-icon-box text-slate-500"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  {t("interactionTypes.note")}
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionType("call")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    interactionType === "call"
                      ? "neu-button shadow-soft-button text-slate-800"
                      : "neu-icon-box text-slate-500"
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t("interactionTypes.call")}
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionType("message")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    interactionType === "message"
                      ? "neu-button shadow-soft-button text-slate-800"
                      : "neu-icon-box text-slate-500"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  {t("interactionTypes.message")}
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionType("comment")}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                    interactionType === "comment"
                      ? "neu-button shadow-soft-button text-slate-800"
                      : "neu-icon-box text-slate-500"
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  {t("interactionTypes.comment")}
                </button>
              </div>

              {/* Content Input */}
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("interactionPlaceholder")}
                  rows={3}
                  disabled={loading}
                  className="w-full px-4 py-3 neu-input rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full px-6 py-3 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white rounded-lg shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {tCommon("loading")}
                  </span>
                ) : (
                  t("addInteraction")
                )}
              </button>
            </form>
          </div>

          {/* Interaction Timeline */}
          <div className="neu-card rounded-neu-lg p-6 shadow-soft-out">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{t("interactionHistory")}</h3>
            
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>{t("noInteractions")}</p>
                <p className="text-sm mt-1">{t("addFirstInteraction")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-4 p-4 neu-icon-box rounded-lg shadow-soft-icon"
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${getInteractionColor(log.interaction_type)}`}>
                      {getInteractionIcon(log.interaction_type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 uppercase">
                          {t(`interactionTypes.${log.interaction_type}`)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-800">{log.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

