/**
 * API Route: Export Sales Opportunities to PDF
 * GET /api/export/pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { getWeeklySalesOpportunities } from "@/lib/reports/actions";
import PDFDocument from "pdfkit";

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

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("BÁO CÁO CƠ HỘI BÁN HÀNG TRONG TUẦN", { align: "center" });

    doc.moveDown();
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Ngày xuất: ${new Date().toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        { align: "center" }
      );

    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Tổng số cơ hội: ${opportunities.length}`, { align: "center" });

    doc.moveDown(2);

    // Table header
    let yPosition = doc.y;
    const tableTop = yPosition;
    const itemHeight = 20;
    const pageWidth = doc.page.width - 100;
    const colWidths = {
      stt: 40,
      customer: 120,
      date: 80,
      score: 50,
      summary: pageWidth - 290,
    };

    // Draw table header
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .rect(50, tableTop, pageWidth, itemHeight)
      .fill("#4472C4")
      .fillColor("#FFFFFF")
      .text("STT", 55, tableTop + 5, { width: colWidths.stt })
      .text("Khách hàng", 95, tableTop + 5, { width: colWidths.customer })
      .text("Ngày", 215, tableTop + 5, { width: colWidths.date })
      .text("Điểm", 295, tableTop + 5, { width: colWidths.score })
      .text("Tóm tắt", 345, tableTop + 5, { width: colWidths.summary });

    doc.fillColor("#000000");

    // Add data rows
    opportunities.forEach((opp, index) => {
      yPosition = doc.y + 5;

      // Check if need new page
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
      }

      // Draw row background (alternating colors)
      if (index % 2 === 0) {
        doc
          .rect(50, yPosition, pageWidth, itemHeight)
          .fill("#F2F2F2");
      }

      // Draw row border
      doc
        .rect(50, yPosition, pageWidth, itemHeight)
        .stroke();

      // Add row content
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#000000")
        .text((index + 1).toString(), 55, yPosition + 5, {
          width: colWidths.stt,
        })
        .text(opp.profile_title, 95, yPosition + 5, {
          width: colWidths.customer,
        })
        .text(
          opp.published_at
            ? new Date(opp.published_at).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              })
            : "N/A",
          215,
          yPosition + 5,
          { width: colWidths.date }
        )
        .text(opp.opportunity_score.toString(), 295, yPosition + 5, {
          width: colWidths.score,
        })
        .text(opp.summary || "N/A", 345, yPosition + 5, {
          width: colWidths.summary,
        });

      // Add details for each opportunity (on new page if needed)
      if (index < opportunities.length - 1) {
        doc.moveDown(0.5);
      }
    });

    // Add detailed information for each opportunity
    doc.addPage();
    doc.fontSize(16).font("Helvetica-Bold").text("CHI TIẾT CƠ HỘI", {
      align: "center",
    });
    doc.moveDown();

    opportunities.forEach((opp, index) => {
      // Check if need new page
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`${index + 1}. ${opp.profile_title}`, { underline: true });

      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      if (opp.profile_category) {
        doc.text(`Danh mục: ${opp.profile_category}`);
      }

      if (opp.published_at) {
        doc.text(
          `Ngày đăng: ${new Date(opp.published_at).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      }

      doc.text(`Điểm cơ hội: ${opp.opportunity_score}/10`);
      doc.text(`Tóm tắt: ${opp.summary}`);

      if (opp.keywords.length > 0) {
        doc.text(`Từ khóa: ${opp.keywords.join(", ")}`);
      }

      if (opp.content) {
        doc.moveDown(0.5);
        doc.text("Nội dung:", { underline: true });
        doc.text(opp.content.substring(0, 500) + (opp.content.length > 500 ? "..." : ""), {
          indent: 20,
        });
      }

      if (opp.ice_breakers.length > 0) {
        doc.moveDown(0.5);
        doc.text("Gợi ý phản hồi:", { underline: true });
        opp.ice_breakers.forEach((breaker, idx) => {
          doc.text(`${idx + 1}. ${breaker}`, { indent: 20 });
        });
      }

      if (opp.post_url) {
        doc.moveDown(0.5);
        doc.text(`Link: ${opp.post_url}`, { link: opp.post_url });
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(pageWidth + 50, doc.y).stroke();
      doc.moveDown(1);
    });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated and combine chunks
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", reject);
    });

    // Set response headers
    const filename = `Sales_Opportunities_${new Date().toISOString().split("T")[0]}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[export/pdf] Error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to export PDF file" },
      { status: 500 }
    );
  }
}

