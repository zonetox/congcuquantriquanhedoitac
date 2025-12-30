# ✅ Premium Features Implementation

## 🎯 Các tính năng đã triển khai:

### 1. **is_premium Logic**

✅ **lib/auth/helpers.ts:**
- Function `isPremium()` kiểm tra từ `user.user_metadata?.is_premium`
- Mặc định: `false` (free user)
- Sẽ được cập nhật từ Lemon Squeezy webhook sau này

```typescript
export async function isPremium(): Promise<boolean> {
  // Check từ user.user_metadata?.is_premium
  // Mặc định: false (free user)
}
```

### 2. **Upgrade Button Component**

✅ **components/UpgradeButton.tsx:**
- Nút nổi bật với gradient vàng và icon Crown
- Khi click sẽ mở Lemon Squeezy checkout link trong tab mới
- 3 variants: default, outline, ghost
- 3 sizes: sm, md, lg

✅ **lib/config/lemon-squeezy.ts:**
- Config file cho Lemon Squeezy checkout URL
- Có thể set qua environment variable: `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL`
- Hoặc hardcode trong file

### 3. **Dashboard Header với Upgrade Button**

✅ **app/page.tsx:**
- Thêm nút "Upgrade to Premium" vào header
- Chỉ hiển thị nếu user không phải premium (`!userIsPremium`)
- Premium users sẽ không thấy nút này
- Hiển thị badge "✨ Premium" bên cạnh "Your Profiles" nếu là premium

### 4. **Logic Giới hạn Profiles**

✅ **components/AddProfileForm.tsx:**

**Free Users (is_premium = false):**
- Chỉ cho phép tối đa 5 profiles
- Nếu đạt 5 profiles:
  - Nút "Add" bị disabled
  - Hiển thị message: "Free limit reached (5 profiles). Please upgrade to Premium for unlimited tracking!"
  - Hiển thị counter: "X / 5 profiles used"

**Premium Users (is_premium = true):**
- Không giới hạn số lượng profiles
- Nút "Add" luôn enabled
- Hiển thị: "✨ Premium: Unlimited profiles"

### 5. **Premium Styling cho Profile Cards**

✅ **components/ProfileCard.tsx:**

**Premium Cards có:**
- Viền vàng mỏng: `border-2 border-yellow-400 dark:border-yellow-500`
- Shadow vàng nhẹ: `shadow-yellow-200/50 dark:shadow-yellow-900/20`
- Icon vương miện (Crown) ở góc trên bên phải với gradient vàng
- Icon Crown có shadow để nổi bật

**Free Cards:**
- Viền xám bình thường
- Không có icon vương miện

### 6. **Cập nhật Components**

✅ **components/ProfileGrid.tsx:**
- Thêm prop `isPremium` và pass vào `ProfileCard`

✅ **app/page.tsx:**
- Check `isPremium()` và pass vào các components:
  - `AddProfileForm` nhận `isPremium={userIsPremium}`
  - `ProfileGrid` nhận `isPremium={userIsPremium}`

## 🔧 Cấu hình Lemon Squeezy

### Cách 1: Environment Variable (Khuyến nghị)
Thêm vào `.env.local`:
```
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
```

### Cách 2: Hardcode trong file
Sửa `lib/config/lemon-squeezy.ts`:
```typescript
export const LEMON_SQUEEZY_CHECKOUT_URL = "https://your-actual-checkout-link";
```

## 📋 Logic Flow

### Free User Flow:
1. User đăng nhập → `isPremium()` return `false`
2. Dashboard hiển thị nút "Upgrade to Premium"
3. User có thể thêm tối đa 5 profiles
4. Khi đạt 5 profiles:
   - Nút "Add" disabled
   - Hiển thị message "Free limit reached"
5. User click "Upgrade to Premium" → Mở Lemon Squeezy checkout
6. Sau khi thanh toán, webhook sẽ cập nhật `user.user_metadata.is_premium = true`

### Premium User Flow:
1. User đăng nhập → `isPremium()` return `true`
2. Dashboard không hiển thị nút "Upgrade"
3. User có thể thêm unlimited profiles
4. Tất cả profile cards có viền vàng và icon vương miện
5. Hiển thị "✨ Premium: Unlimited profiles"

## 🎨 UI/UX Features

### Upgrade Button:
- Gradient vàng đẹp mắt
- Icon Crown và Sparkles
- Hover effect với scale transform
- Shadow để nổi bật

### Premium Cards:
- Viền vàng 2px
- Shadow vàng nhẹ
- Icon Crown ở góc trên bên phải
- Dễ phân biệt với free cards

### Messages:
- Free limit message: Màu vàng, rõ ràng
- Premium badge: Màu vàng, có icon ✨

## 🚀 Next Steps (Webhook Integration)

Để hoàn thiện, cần tạo webhook endpoint để nhận notification từ Lemon Squeezy:

1. **Tạo API Route:** `app/api/webhooks/lemon-squeezy/route.ts`
2. **Verify signature** từ Lemon Squeezy
3. **Cập nhật user metadata:**
   ```typescript
   await supabase.auth.updateUser({
     data: { is_premium: true }
   });
   ```

## ✅ Testing Checklist

- [x] isPremium() function hoạt động đúng
- [x] Upgrade button hiển thị cho free users
- [x] Upgrade button ẩn cho premium users
- [x] Free users chỉ thêm được 5 profiles
- [x] Premium users thêm được unlimited profiles
- [x] Premium cards có viền vàng và icon vương miện
- [x] Free cards không có premium styling
- [x] Messages hiển thị đúng
- [x] Counter hiển thị đúng cho free users
- [x] Unlimited message hiển thị cho premium users

