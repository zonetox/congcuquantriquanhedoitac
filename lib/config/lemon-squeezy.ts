/**
 * Lemon Squeezy Configuration
 * 
 * Thay đổi CHECKOUT_URL bằng link checkout thực tế từ Lemon Squeezy
 * Bạn có thể lấy link này từ Lemon Squeezy Dashboard > Products > Checkout Links
 */
export const LEMON_SQUEEZY_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ||
  "https://your-store.lemonsqueezy.com/checkout/buy/your-product-id";

/**
 * Lemon Squeezy Customer Portal URL
 * 
 * URL để user quản lý subscription (cancel, update payment method, etc.)
 * Có thể lấy từ Lemon Squeezy Dashboard > Settings > Customer Portal
 * Hoặc sử dụng: https://app.lemonsqueezy.com/my-account
 */
export const LEMON_SQUEEZY_CUSTOMER_PORTAL_URL =
  process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL ||
  "https://app.lemonsqueezy.com/my-account";

