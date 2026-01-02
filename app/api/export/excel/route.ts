/**
 * API Route: Export Sales Opportunities to Excel
 * GET /api/export/excel
 */

import { NextRequest, NextResponse } from "next/server";
import { getWeeklySalesOpportunities } from "@/lib/reports/actions";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  try {
    // Get sales opportunities
    const result = await getWeeklySalesOpportunities();

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch sales opportunities" },
        { status: 500 }
      );
    }

    const opportunities = result.data;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Opportunities");

    // Define columns
    worksheet.columns = [
      { header: "STT", key: "index", width: 5 },
      { header: "Khách hàng", key: "profile_title", width: 30 },
      { header: "Danh mục", key: "category", width: 15 },
      { header: "Ngày đăng", key: "published_at", width: 20 },
      { header: "Tóm tắt", key: "summary", width: 40 },
      { header: "Điểm cơ hội", key: "opportunity_score", width: 12 },
      { header: "Từ khóa", key: "keywords", width: 30 },
      { header: "Gợi ý phản hồi 1", key: "ice_breaker_1", width: 40 },
      { header: "Gợi ý phản hồi 2", key: "ice_breaker_2", width: 40 },
      { header: "Gợi ý phản hồi 3", key: "ice_breaker_3", width: 40 },
      { header: "Link bài đăng", key: "post_url", width: 50 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // Add data rows
    opportunities.forEach((opp, index) => {
      const row = worksheet.addRow({
        index: index + 1,
        profile_title: opp.profile_title,
        category: opp.profile_category || "N/A",
        published_at: opp.published_at
          ? new Date(opp.published_at).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
        summary: opp.summary,
        opportunity_score: opp.opportunity_score,
        keywords: opp.keywords.join(", ") || "N/A",
        ice_breaker_1: opp.ice_breakers[0] || "N/A",
        ice_breaker_2: opp.ice_breakers[1] || "N/A",
        ice_breaker_3: opp.ice_breakers[2] || "N/A",
        post_url: opp.post_url || "N/A",
      });

      // Style data rows
      row.alignment = { vertical: "top", wrapText: true };
      
      // Highlight high opportunity scores (>= 7)
      if (opp.opportunity_score >= 7) {
        row.getCell("opportunity_score").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFC000" },
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.width) {
        column.width = Math.min(column.width || 10, 50);
      }
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    const filename = `Sales_Opportunities_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[export/excel] Error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to export Excel file" },
      { status: 500 }
    );
  }
}

