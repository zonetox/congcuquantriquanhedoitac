"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Trash2, ToggleLeft, ToggleRight, Upload, AlertCircle } from "lucide-react";
import { getAllApiKeys, bulkImportApiKeys, toggleApiKeyStatus, deleteApiKey } from "@/lib/api-keys/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ApiKey } from "@/lib/api-keys/actions";

export function ApiKeyManagement() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    const result = await getAllApiKeys();
    if (result.error) {
      toast.error(result.error);
    } else {
      setKeys(result.data || []);
    }
    setLoading(false);
  }

  const handleBulkImport = async () => {
    if (!importText.trim()) {
      toast.error("Please enter API keys to import");
      return;
    }

    const result = await bulkImportApiKeys(importText);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Imported ${result.success} keys. ${result.failed} failed.`);
      setShowImportModal(false);
      setImportText("");
      loadKeys();
      router.refresh();
    }
  };

  const handleToggleStatus = async (keyId: string, currentStatus: boolean) => {
    const result = await toggleApiKeyStatus(keyId, !currentStatus);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`API key ${!currentStatus ? "activated" : "deactivated"}`);
      loadKeys();
      router.refresh();
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    const result = await deleteApiKey(keyId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("API key deleted successfully!");
      loadKeys();
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <p className="text-slate-500 dark:text-slate-400">Loading API keys...</p>
      </div>
    );
  }

  const activeKeys = keys.filter((k) => k.is_active).length;
  const totalKeys = keys.length;
  const totalUsage = keys.reduce((sum, k) => sum + k.current_usage, 0);

  return (
    <div className="space-y-6">
      {/* Header với Bulk Import */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Key Management</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeKeys}/{totalKeys} active keys • {totalUsage} total usage
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Bulk Import
        </button>
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Bulk Import API Keys</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Enter API keys, one per line. Format: <code className="bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded">provider:key</code> or just <code className="bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded">key</code> (default: RapidAPI)
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="RapidAPI:key1&#10;Apify:key2&#10;key3"
              className="w-full h-48 px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBulkImport}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                }}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="space-y-2">
                      <Key className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
                      <p className="text-slate-500 dark:text-slate-400">No API keys yet. Import your first keys to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{key.provider}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                        {key.api_key.slice(0, 20)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          key.is_active
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {key.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">
                        {key.current_usage}/{key.quota_limit}
                      </div>
                      <div className="w-24 h-2 bg-slate-200 dark:bg-gray-700 rounded-full mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            key.current_usage / key.quota_limit > 0.8
                              ? "bg-red-500"
                              : key.current_usage / key.quota_limit > 0.5
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min((key.current_usage / key.quota_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          key.error_count >= 5
                            ? "text-red-600 dark:text-red-400"
                            : key.error_count > 0
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {key.error_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(key.id, key.is_active)}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          title={key.is_active ? "Deactivate" : "Activate"}
                        >
                          {key.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">API Key Rotation</p>
            <p>
              Keys are automatically rotated when they hit quota limits or receive 429 errors. Keys with 5+ errors are automatically deactivated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


