"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ExportButtonProps {
  className?: string;
}

export function ExportButton({ className = "" }: ExportButtonProps) {
  const t = useTranslations("export");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);

  const handleExport = async (format: "excel" | "pdf") => {
    setIsExporting(format);
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
    <div className={`relative ${className}`}>
      {/* Export Button - Neumorphism Style */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleExport("excel")}
          disabled={isExporting !== null}
          className="px-4 py-2 neu-button bg-gradient-to-r from-emerald-400 to-blue-400 text-white rounded-lg shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isExporting === "excel" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("exporting")}
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              {t("exportExcel")}
            </>
          )}
        </button>

        <button
          onClick={() => handleExport("pdf")}
          disabled={isExporting !== null}
          className="px-4 py-2 neu-button bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-lg shadow-soft-button hover:shadow-soft-button-pressed active:shadow-soft-button-pressed transition-all transform active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isExporting === "pdf" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("exporting")}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              {t("exportPDF")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

