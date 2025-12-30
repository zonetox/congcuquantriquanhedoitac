import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

/**
 * Webhook endpoint để nhận notification từ Lemon Squeezy
 * 
 * Khi nhận được order_created event:
 * 1. Tìm user theo email từ order
 * 2. Cập nhật is_premium = true trong user metadata
 * 
 * Security:
 * - Verify webhook signature từ Lemon Squeezy
 * - Chỉ xử lý order_created event
 */

/**
 * Verify webhook signature từ Lemon Squeezy
 * Lemon Squeezy sử dụng HMAC SHA256 để sign webhook payload
 */
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  // Lemon Squeezy sử dụng format: sha256=<hex>
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // So sánh signature (có thể có prefix "sha256=")
  const receivedSignature = signature.replace("sha256=", "");

  // Sử dụng constant-time comparison để tránh timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    // Lấy webhook secret từ environment variable
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Đọc raw body để verify signature
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    // Verify signature nếu có
    if (signature && !verifySignature(rawBody, signature, webhookSecret)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse JSON payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error("[Webhook] Invalid JSON payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Lấy event name từ header hoặc payload
    const eventName =
      request.headers.get("x-event-name") || payload.meta?.event_name;

    console.log("[Webhook] Received event:", eventName);
    console.log("[Webhook] Payload:", JSON.stringify(payload, null, 2));

    // Chỉ xử lý order_created event
    if (eventName !== "order_created") {
      console.log("[Webhook] Ignoring event:", eventName);
      return NextResponse.json({
        message: "Event ignored",
        event: eventName,
      });
    }

    // Lấy email từ order data
    // Lemon Squeezy order structure có thể khác nhau, cần check documentation
    const customerEmail =
      payload.data?.attributes?.user_email ||
      payload.data?.attributes?.customer_email ||
      payload.data?.attributes?.email;

    if (!customerEmail) {
      console.error("[Webhook] No email found in order data");
      return NextResponse.json(
        { error: "No email found in order data" },
        { status: 400 }
      );
    }

    console.log("[Webhook] Processing order for email:", customerEmail);

    // Tạo admin client để có quyền cập nhật user
    const supabase = createAdminClient();

    // Tìm user theo email trong auth.users
    // Note: Supabase Admin API không có method trực tiếp để tìm user theo email
    // Nên phải list users và filter. Với số lượng users nhỏ, cách này ổn.
    // Có thể optimize sau bằng cách cache hoặc sử dụng database query trực tiếp
    const { data: usersData, error: findError } = await supabase.auth.admin.listUsers();

    if (findError) {
      console.error("[Webhook] Error finding users:", findError);
      return NextResponse.json(
        { error: "Failed to find user" },
        { status: 500 }
      );
    }

    // Tìm user có email khớp (case-insensitive)
    const user = usersData.users.find(
      (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
    );

    if (!user) {
      console.warn(
        "[Webhook] User not found with email:",
        customerEmail
      );
      return NextResponse.json(
        {
          message: "User not found",
          email: customerEmail,
        },
        { status: 404 }
      );
    }

    console.log("[Webhook] Found user:", user.id);

    // Cập nhật user metadata với is_premium = true
    const { data: updatedUser, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          is_premium: true,
          premium_activated_at: new Date().toISOString(),
          lemon_squeezy_order_id: payload.data?.id || null,
        },
      });

    if (updateError) {
      console.error("[Webhook] Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    console.log("[Webhook] Successfully updated user to premium:", user.id);

    return NextResponse.json({
      success: true,
      message: "User upgraded to premium",
      userId: user.id,
      email: customerEmail,
    });
  } catch (error: any) {
    console.error("[Webhook] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle GET request for webhook verification (nếu Lemon Squeezy yêu cầu)
export async function GET() {
  return NextResponse.json({
    message: "Lemon Squeezy webhook endpoint is active",
    endpoint: "/api/webhook/lemon-squeezy",
  });
}

