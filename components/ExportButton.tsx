"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ExportButtonProps {
  className?: string;
}

export function ExportButton({ className = "" }: ExportButtonProps) {
  const t = useTranslations("export");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = async (format: "excel" | "pdf") => {
    setIsExporting(format);
    setIsOpen(false);
    try {
      const response = await fetch(`/api/export/${format}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to export ${format.toUpperCase()}`);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `Sales_Opportunities_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "pdf"}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t("exportSuccess", { format: format.toUpperCase() }));
    } catch (error: any) {
      toast.error(error.message || t("exportError"));
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Actions Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting !== null}
        className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t("exporting")}</span>
          </>
        ) : (
          <>
            <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Actions</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => handleExport("excel")}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t("exportExcel")}</span>
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{t("exportPDF")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

