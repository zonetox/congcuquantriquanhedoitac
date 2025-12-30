/**
 * Lemon Squeezy Configuration
 * 
 * Thay đổi CHECKOUT_URL bằng link checkout thực tế từ Lemon Squeezy
 * Bạn có thể lấy link này từ Lemon Squeezy Dashboard > Products > Checkout Links
 */
export const LEMON_SQUEEZY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
  "https://your-store.lemonsqueezy.com/checkout/buy/your-product-id";

