"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SupabaseTest() {
  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean | null;
    message: string;
  }>({
    loading: false,
    success: null,
    message: "",
  });

  const testConnection = async () => {
    setStatus({ loading: true, success: null, message: "Đang kiểm tra..." });

    try {
      const response = await fetch("/api/test-connection");
      const data = await response.json();

      if (data.success) {
        setStatus({
          loading: false,
          success: true,
          message: data.message || "Kết nối thành công!",
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: data.message || "Kết nối thất bại",
        });
      }
    } catch (error: any) {
      setStatus({
        loading: false,
        success: false,
        message: `Lỗi: ${error.message}`,
      });
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4">Test Kết Nối Supabase</h2>
      <button
        onClick={testConnection}
        disabled={status.loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {status.loading ? "Đang kiểm tra..." : "Test Kết Nối"}
      </button>
      {status.success !== null && (
        <div
          className={`mt-4 p-3 rounded ${
            status.success
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}

