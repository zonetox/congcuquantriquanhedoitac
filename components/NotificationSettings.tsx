"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
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
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const result = await getNotificationSettings();
    if (result.error) {
      toast.error(result.error);
    } else {
      setSettings(result.data || []);
    }
    setLoading(false);
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
      toast.success("Notification settings updated");
      loadSettings();
    }
  };

  const handleChatIdChange = async (
    profileId: string,
    chatId: string
  ) => {
    setSaving((prev) => ({ ...prev, [profileId]: true }));
    const result = await updateNotificationSettings(profileId, {
      notify_telegram_chat_id: chatId.trim() || null,
    });
    setSaving((prev) => ({ ...prev, [profileId]: false }));

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Telegram Chat ID updated");
      loadSettings();
    }
  };

  const handleTestNotification = async (profileId: string, chatId: string) => {
    if (!chatId || chatId.trim() === "") {
      toast.error("Please enter a Telegram Chat ID first");
      return;
    }

    setTesting((prev) => ({ ...prev, [profileId]: true }));
    const result = await sendTestNotification(chatId);
    setTesting((prev) => ({ ...prev, [profileId]: false }));

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Test notification sent! Check your Telegram.");
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
          Cấu hình thông báo
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Nhận cảnh báo tức thì khi AI phát hiện cơ hội bán hàng từ các profile bạn theo dõi.
        </p>
      </div>

      {settings.length === 0 ? (
        <div className="neu-card rounded-lg p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No profiles available. Add profiles to configure notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.profile_id}
              className="neu-card rounded-lg p-6 shadow-soft-out"
            >
              <div className="space-y-4">
                {/* Profile Title */}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {setting.profile_title}
                  </h3>
                </div>

                {/* Telegram Chat ID Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Telegram Chat ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue={setting.notify_telegram_chat_id || ""}
                      placeholder="Enter your Telegram Chat ID"
                      onBlur={(e) => {
                        if (e.target.value !== setting.notify_telegram_chat_id) {
                          handleChatIdChange(setting.profile_id, e.target.value);
                        }
                      }}
                      className="flex-1 px-4 py-2 neu-input rounded-lg shadow-soft-in border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-gray-700"
                    />
                    <button
                      onClick={() =>
                        handleTestNotification(
                          setting.profile_id,
                          setting.notify_telegram_chat_id || ""
                        )
                      }
                      disabled={
                        testing[setting.profile_id] ||
                        !setting.notify_telegram_chat_id
                      }
                      className="px-4 py-2 neu-button rounded-lg shadow-soft-out hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {testing[setting.profile_id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Gửi tin thử nghiệm
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Nhấn vào @userinfobot để lấy ID của bạn
                  </p>
                </div>

                {/* Toggle Switch - Neumorphism Style */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bật thông báo khi có cơ hội bán hàng
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Nhận thông báo khi AI phát hiện cơ hội bán hàng
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleToggle(
                        setting.profile_id,
                        !setting.notify_on_sales_opportunity
                      )
                    }
                    disabled={saving[setting.profile_id]}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${
                        setting.notify_on_sales_opportunity
                          ? "bg-emerald-600"
                          : "bg-slate-300 dark:bg-gray-600"
                      }
                      ${saving[setting.profile_id] ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${
                          setting.notify_on_sales_opportunity
                            ? "translate-x-6"
                            : "translate-x-1"
                        }
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="neu-card rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Hướng dẫn lấy Telegram Chat ID:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>Mở Telegram và tìm @userinfobot</li>
              <li>Bắt đầu cuộc trò chuyện và gửi /start</li>
              <li>Sao chép Chat ID từ phản hồi của bot</li>
              <li>Dán vào ô trên và nhấn &quot;Gửi tin thử nghiệm&quot; để xác nhận</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

