# 🔗 Lemon Squeezy Webhook Setup

## 📋 Tổng quan

Webhook endpoint này nhận notification từ Lemon Squeezy khi có order được tạo. Khi nhận được `order_created` event, hệ thống sẽ tự động cập nhật user thành premium.

## 🔧 Cấu hình Environment Variables

Thêm vào file `.env.local`:

```env
# Supabase Service Role Key (lấy từ Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Lemon Squeezy Webhook Secret (lấy từ Lemon Squeezy Dashboard > Settings > Webhooks)
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Lấy Supabase Service Role Key:

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **API**
4. Copy **service_role** key (KHÔNG phải anon key)
5. ⚠️ **QUAN TRỌNG:** Service Role Key có quyền admin, KHÔNG BAO GIỜ expose ra client-side

### Lấy Lemon Squeezy Webhook Secret:

1. Vào [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
2. Vào **Settings** > **Webhooks**
3. Tạo webhook mới hoặc xem webhook hiện tại
4. Copy **Signing Secret**

## 🚀 Thiết lập Webhook trong Lemon Squeezy

1. Vào **Settings** > **Webhooks** trong Lemon Squeezy Dashboard
2. Click **Create Webhook**
3. Điền thông tin:
   - **URL:** `https://your-domain.com/api/webhook/lemon-squeezy`
     - Development: `http://localhost:3000/api/webhook/lemon-squeezy` (chỉ để test)
     - Production: `https://your-actual-domain.com/api/webhook/lemon-squeezy`
   - **Signing Secret:** Tạo một secret ngẫu nhiên và lưu vào `.env.local`
   - **Events:** Chọn `order_created`
4. Click **Save**

## 📝 Webhook Flow

1. User thanh toán thành công trên Lemon Squeezy
2. Lemon Squeezy gửi POST request đến webhook endpoint
3. Endpoint verify signature
4. Nếu event là `order_created`:
   - Tìm user theo email từ order data
   - Cập nhật `user_metadata.is_premium = true`
   - Lưu thêm thông tin: `premium_activated_at`, `lemon_squeezy_order_id`
5. Trả về response success

## 🔒 Security

### Signature Verification:

Webhook endpoint verify signature từ Lemon Squeezy để đảm bảo request đến từ nguồn tin cậy:

```typescript
// Lemon Squeezy sử dụng HMAC SHA256
const signature = request.headers.get("x-signature");
verifySignature(rawBody, signature, webhookSecret);
```

### Service Role Key:

- Chỉ sử dụng trong server-side code (API routes)
- KHÔNG BAO GIỜ expose ra client-side
- Có quyền admin, có thể cập nhật bất kỳ user nào

## 🧪 Testing

### Test với ngrok (Development):

1. Cài đặt ngrok: `npm install -g ngrok`
2. Chạy ngrok: `ngrok http 3000`
3. Copy HTTPS URL (ví dụ: `https://abc123.ngrok.io`)
4. Set webhook URL trong Lemon Squeezy: `https://abc123.ngrok.io/api/webhook/lemon-squeezy`
5. Test order trong Lemon Squeezy
6. Check logs trong terminal để xem webhook có nhận được không

### Test với curl:

```bash
curl -X POST http://localhost:3000/api/webhook/lemon-squeezy \
  -H "Content-Type: application/json" \
  -H "x-event-name: order_created" \
  -d '{
    "data": {
      "id": "test-order-123",
      "attributes": {
        "user_email": "test@example.com"
      }
    }
  }'
```

## 📊 Logging

Webhook endpoint log các thông tin sau:
- Event name
- Payload data
- User email
- Update status
- Errors (nếu có)

Check console/terminal để debug.

## ⚠️ Lưu ý

1. **Email Matching:**
   - Webhook tìm user theo email từ order
   - Email trong order phải khớp chính xác với email user đã đăng ký
   - Nếu không tìm thấy user, webhook sẽ trả về 404

2. **Event Structure:**
   - Lemon Squeezy có thể thay đổi structure của webhook payload
   - Nếu không tìm thấy email, cần check lại structure trong Lemon Squeezy docs
   - Có thể cần điều chỉnh code để match với structure thực tế

3. **Error Handling:**
   - Webhook sẽ log tất cả errors
   - Nếu update thất bại, cần check logs để debug
   - Có thể cần retry manually nếu webhook fail

## 🔄 Cập nhật User Metadata

Sau khi webhook chạy thành công, user sẽ có:
```typescript
user_metadata: {
  is_premium: true,
  premium_activated_at: "2024-01-01T00:00:00.000Z",
  lemon_squeezy_order_id: "order-123"
}
```

Function `isPremium()` trong `lib/auth/helpers.ts` sẽ check `user.user_metadata?.is_premium` và return `true`.

## ✅ Checklist

- [ ] Thêm `SUPABASE_SERVICE_ROLE_KEY` vào `.env.local`
- [ ] Thêm `LEMON_SQUEEZY_WEBHOOK_SECRET` vào `.env.local`
- [ ] Tạo webhook trong Lemon Squeezy Dashboard
- [ ] Set webhook URL (production hoặc ngrok cho development)
- [ ] Test với một order thực tế
- [ ] Verify user được upgrade thành premium
- [ ] Check logs để đảm bảo không có errors

