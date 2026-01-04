"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Loader2, CheckCircle, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
} from "@/lib/notifications/actions";

interface NotificationSetting {
  profile_id: string;
  profile_title: string;
  notify_telegram_chat_id: string | null;
  notify_on_sales_opportunity: boolean;
}

export function NotificationSettings() {
  const t = useTranslations("settings.notifications");
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [globalChatId, setGlobalChatId] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const result = await getNotificationSettings();
    if (result.error) {
      toast.error(result.error);
    } else {
      const data = result.data || [];
      setSettings(data);
      // Set global chat ID from first profile (if all profiles have same chat ID)
      if (data.length > 0 && data[0].notify_telegram_chat_id) {
        const allSame = data.every((s) => s.notify_telegram_chat_id === data[0].notify_telegram_chat_id);
        if (allSame) {
          setGlobalChatId(data[0].notify_telegram_chat_id);
        }
      }
    }
    setLoading(false);
  };

  const handleGlobalChatIdSave = async () => {
    if (!globalChatId.trim()) {
      toast.error(t("saveError"));
      return;
    }

    setSavingGlobal(true);
    try {
      // Update all profiles with global chat ID
      const updatePromises = settings.map((setting) =>
        updateNotificationSettings(setting.profile_id, {
          notify_telegram_chat_id: globalChatId.trim(),
        })
      );

      await Promise.all(updatePromises);
      toast.success(t("saveSuccess"));
      loadSettings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update global chat ID");
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleTestNotification = async () => {
    if (!globalChatId || globalChatId.trim() === "") {
      toast.error(t("testError"));
      return;
    }

    setTesting(true);
    const result = await sendTestNotification(globalChatId.trim());
    setTesting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("testSuccess"));
    }
  };

  const handleToggle = async (profileId: string, enabled: boolean) => {
    setSaving((prev) => ({ ...prev, [profileId]: true }));
    const result = await updateNotificationSettings(profileId, {
      notify_on_sales_opportunity: enabled,
    });
    setSaving((prev) => ({ ...prev, [profileId]: false }));

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("updateSuccess"));
      loadSettings();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          {t("title")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("description")}
        </p>
      </div>

      {/* Global Telegram Chat ID - At the top */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("globalChatId")}
              </label>
              {/* Help Button - Tooltip trigger */}
              <button
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                title={t("howToGetChatId")}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t("howToGetChatId")}</span>
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={globalChatId}
                onChange={(e) => setGlobalChatId(e.target.value)}
                placeholder={t("chatIdPlaceholder")}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleGlobalChatIdSave}
                disabled={savingGlobal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingGlobal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("save")
                )}
              </button>
              <button
                onClick={handleTestNotification}
                disabled={testing || !globalChatId.trim()}
                className="px-4 py-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("test")}
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {t("chatIdHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Profile List with Toggle */}
      {settings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t("noProfiles")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("noProfilesDescription")}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-gray-700">
            {settings.map((setting) => (
              <div
                key={setting.profile_id}
                className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {setting.profile_title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {setting.notify_on_sales_opportunity
                        ? t("notificationsEnabled")
                        : t("notificationsDisabled")}
                    </p>
                  </div>
                  {/* Toggle Switch - Compact */}
                  <button
                    onClick={() =>
                      handleToggle(
                        setting.profile_id,
                        !setting.notify_on_sales_opportunity
                      )
                    }
                    disabled={saving[setting.profile_id] || !globalChatId.trim()}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-all
                      ${
                        setting.notify_on_sales_opportunity && globalChatId.trim()
                          ? "bg-emerald-500"
                          : "bg-slate-300 dark:bg-gray-600"
                      }
                      ${saving[setting.profile_id] || !globalChatId.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    title={!globalChatId.trim() ? "Please set Global Telegram Chat ID first" : ""}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                        ${
                          setting.notify_on_sales_opportunity && globalChatId.trim()
                            ? "translate-x-6"
                            : "translate-x-1"
                        }
                      `}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                  {t("modalTitle")}
                </h3>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-medium mb-2">{t("guideTitle")}</p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
                      <li>{t("guideStep1")}</li>
                      <li>{t("guideStep2")}</li>
                      <li>{t("guideStep3")}</li>
                      <li>{t("guideStep4")}</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  {t("modalClose")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-2">{t("guideTitle")}</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>{t("guideStep1")}</li>
              <li>{t("guideStep2")}</li>
              <li>{t("guideStep3")}</li>
              <li>{t("guideStep4")}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

