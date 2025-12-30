# 🔧 Cấu hình Lemon Squeezy Checkout Link

## 📝 Hướng dẫn lấy Checkout Link từ Lemon Squeezy

1. Đăng nhập vào [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
2. Vào **Products** > Chọn product của bạn
3. Vào tab **Checkout Links**
4. Copy **Checkout URL** (ví dụ: `https://your-store.lemonsqueezy.com/checkout/buy/product-id`)

## ⚙️ Cách cấu hình trong Project

### Cách 1: Environment Variable (Khuyến nghị)

Thêm vào file `.env.local`:

```env
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
```

**Lưu ý:** 
- Restart development server sau khi thêm biến môi trường
- Biến này sẽ được public (có thể thấy trong browser), nhưng không sao vì đây là checkout link công khai

### Cách 2: Hardcode trong file

Sửa file `lib/config/lemon-squeezy.ts`:

```typescript
export const LEMON_SQUEEZY_CHECKOUT_URL =
  "https://your-actual-checkout-link-here";
```

## ✅ Kiểm tra

Sau khi cấu hình:
1. Restart development server: `npm run dev`
2. Đăng nhập vào dashboard
3. Click nút "Upgrade to Premium"
4. Kiểm tra xem có mở đúng checkout link không

## 🔐 Webhook Setup (Tùy chọn - Cho tương lai)

Để tự động cập nhật `is_premium` sau khi thanh toán:

1. Vào Lemon Squeezy Dashboard > **Settings** > **Webhooks**
2. Tạo webhook mới với URL: `https://your-domain.com/api/webhooks/lemon-squeezy`
3. Chọn events: `order_created`, `subscription_created`
4. Copy webhook secret để verify signature

Sau đó tạo API route để xử lý webhook (sẽ implement sau).

