# 📋 SYSTEM CONTEXT & ARCHITECTURE
## Partner Relationship Management - Complete System Documentation

> **Mục đích**: Tài liệu này mô tả toàn bộ cấu trúc hệ thống hiện tại để AI (Cursor, Gemini) có thể phát triển tính năng mới mà không mắc lỗi về tên bảng, trường dữ liệu, hoặc cấu trúc code.

---

## 🎯 TỔNG QUAN DỰ ÁN

**Tên ứng dụng**: Partner Relationship Management (Partner Center)

**Mô tả**: Ứng dụng SaaS giúp quản lý danh sách các profile mạng xã hội tập trung, giúp người dùng theo dõi đối tác/đối thủ mà không bị xao nhãng bởi newsfeed giải trí.

**Mô hình kinh doanh**: Freemium
- **Free Tier**: Tối đa 5 profiles, chỉ category "General", không có notes
- **Premium Tier**: Unlimited profiles, tất cả categories, có notes, AI updates (coming soon)

**Tech Stack**:
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Authentication + Database)
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)
- **Payment**: Lemon Squeezy (Webhook integration)

---

## 🗄️ CẤU TRÚC DATABASE (SUPABASE)

### 1. Bảng `public.profiles_tracked`

**Mục đích**: Lưu trữ danh sách các profile được theo dõi của mỗi user.

**Schema chi tiết**:

```sql
CREATE TABLE public.profiles_tracked (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  rss_url TEXT NULL,
  category TEXT NULL DEFAULT 'General',
  notes TEXT NULL,
  has_new_update BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_tracked_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_tracked_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

**Chi tiết các trường**:

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PRIMARY KEY, NOT NULL | ID tự động, dùng `uuid_generate_v4()` |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) | ID của user sở hữu profile này |
| `title` | TEXT | NOT NULL | Tên hiển thị (Tên công ty/đối tác) |
| `url` | TEXT | NOT NULL | Link gốc profile (phải có http/https) |
| `rss_url` | TEXT | NULLABLE | Link RSS để check update (dùng cho tính năng tương lai) |
| `category` | TEXT | NULLABLE, DEFAULT 'General' | Phân loại: 'General', 'Competitor', 'Partner', 'Customer', 'Other' |
| `notes` | TEXT | NULLABLE | Ghi chú cá nhân (Premium feature) |
| `has_new_update` | BOOLEAN | NULLABLE, DEFAULT false | Flag để đánh dấu có update mới (AI feature - coming soon) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Thời gian tạo record |

**Indexes**:
- `idx_profiles_user_id` (BTREE) trên `user_id` - Tối ưu query theo user

**Row Level Security (RLS)**:
- ✅ RLS đã được bật
- Policy: "Users can manage their own tracked profiles"
- Chỉ cho phép user xem/sửa/xóa profiles của chính họ: `auth.uid() = user_id`

**⚠️ QUAN TRỌNG**: 
- **KHÔNG** tự ý thêm cột mới vào bảng này trừ khi có yêu cầu rõ ràng
- **LUÔN** sử dụng đúng tên bảng `profiles_tracked` (không phải `profiles` hay `tracked_profiles`)
- **LUÔN** kiểm tra `user_id` khi query để đảm bảo security

---

### 2. Bảng `auth.users` (Supabase Auth)

**Mục đích**: Quản lý authentication và user metadata.

**Metadata quan trọng** (lưu trong `user_metadata`):

```typescript
{
  is_premium: boolean,           // true nếu user đã upgrade Premium
  premium_activated_at: string,  // Timestamp khi activate Premium
  lemon_squeezy_order_id: string, // Order ID từ Lemon Squeezy
  role: string                    // 'admin' hoặc 'user' (default: 'user')
}
```

**Cách kiểm tra Premium**:
- Sử dụng function `isPremium()` từ `lib/membership.ts`
- Kiểm tra `user.user_metadata?.is_premium === true`

**Cách kiểm tra Role**:
- Sử dụng function `isAdmin()` từ `lib/membership.ts`
- Kiểm tra `user.user_metadata?.role === 'admin'`
- Default role là `'user'` nếu không có trong metadata

**⚠️ QUAN TRỌNG**: 
- Premium status được cập nhật tự động từ Lemon Squeezy webhook
- Không nên thay đổi `is_premium` trực tiếp trong code, chỉ thông qua webhook
- Role phải được set thủ công qua Supabase Dashboard hoặc Admin API (xem `SQL_REQUIREMENTS.md`)

---

## 📁 CẤU TRÚC THƯ MỤC (FOLDER STRUCTURE)

```
Partner Relationship Management/
├── app/                          # Next.js App Router
│   ├── admin/                    # ✅ Admin pages
│   │   └── page.tsx              # Admin dashboard (chỉ admin mới truy cập được)
│   ├── api/                      # API Routes
│   │   ├── test-connection/      # Test Supabase connection
│   │   │   └── route.ts
│   │   └── webhook/              # Webhook endpoints
│   │       └── lemon-squeezy/    # Lemon Squeezy webhook handler
│   │           └── route.ts
│   ├── auth/                     # Auth callbacks
│   │   └── callback/             # Supabase auth callback
│   │       └── route.ts
│   ├── login/                    # Login/Register page
│   │   └── page.tsx
│   ├── settings/                 # Settings page
│   │   └── page.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                 # Home page (Landing/Dashboard)
│
├── components/                   # React Components
│   ├── admin/                    # Admin components
│   │   └── AdminDashboard.tsx    # Admin dashboard với danh sách tất cả profiles
│   ├── auth/                     # Auth components
│   │   └── login-form.tsx        # Login/Register form
│   ├── AddProfileForm.tsx        # ⚠️ DEPRECATED: Dùng AddProfileModal thay thế
│   ├── AddProfileModal.tsx       # ✅ Modal form để thêm profile
│   ├── DashboardContent.tsx     # Dashboard container
│   ├── Header.tsx                # ✅ Header component (mobile + desktop)
│   ├── LandingPage.tsx           # Landing page (chưa đăng nhập)
│   ├── Navbar.tsx                # ⚠️ DEPRECATED: Dùng Sidebar/Header thay thế
│   ├── ProfileCard.tsx           # Business card style profile card
│   ├── ProfileGrid.tsx           # Grid layout cho profiles
│   ├── Sidebar.tsx               # ✅ Sidebar component (desktop)
│   └── UpgradeButton.tsx         # Button upgrade Premium
│
├── lib/                          # Shared libraries
│   ├── auth/                     # Authentication logic
│   │   ├── actions.ts            # Server actions: signUp, signIn, signOut
│   │   └── helpers.ts            # ⚠️ DEPRECATED: Dùng lib/membership.ts thay thế
│   ├── config/                   # Configuration
│   │   └── lemon-squeezy.ts      # Lemon Squeezy checkout URL
│   ├── membership.ts             # ✅ Membership & Role management
│   ├── profiles/                 # Profile management
│   │   ├── actions.ts            # Server actions: addProfile, deleteProfile, getProfiles
│   │   ├── admin-actions.ts     # ✅ Admin actions: getAllProfiles (Admin only)
│   │   └── types.ts              # TypeScript types cho Profile
│   ├── supabase/                 # Supabase clients
│   │   ├── admin.ts              # Admin client (Service Role Key)
│   │   ├── client.ts             # Browser client
│   │   ├── helpers.ts            # Helper: getUser(), getSession()
│   │   ├── server.ts             # Server client
│   │   └── types.ts              # Database types (generated)
│   ├── utils/                    # Utility functions
│   │   ├── url.ts                # URL utilities: normalizeUrl, getDomainFromUrl, getFaviconUrl, isValidUrl
│   │   └── utils.ts              # General utilities: cn() (class name merger)
│   └── supabase.ts               # ⚠️ DEPRECATED: Dùng lib/supabase/client.ts
│
├── middleware.ts                # Next.js middleware (Supabase session refresh)
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.local                    # Environment variables (⚠️ KHÔNG commit lên Git)
```

---

## 🔐 AUTHENTICATION FLOW

### 1. Sign Up / Sign In

**File**: `lib/auth/actions.ts`

**Functions**:
- `signUp(email, password)`: Đăng ký user mới
  - ✅ Email verification **ĐÃ TẮT** (user đăng nhập ngay sau sign up)
  - ✅ Tự động redirect về `/` sau khi thành công
  - ✅ Revalidate path để cập nhật UI

- `signIn(email, password)`: Đăng nhập
  - ✅ Redirect về `/` sau khi thành công
  - ✅ Revalidate path

- `signOut()`: Đăng xuất
  - ✅ Redirect về `/login`
  - ✅ Revalidate path

### 2. Session Management

**Middleware**: `middleware.ts`
- Tự động refresh session cho mọi request
- Sử dụng `@supabase/ssr` để quản lý cookies

**Helpers**: `lib/supabase/helpers.ts`
- `getUser()`: Lấy user hiện tại (server-side)
- `getSession()`: Lấy session hiện tại (server-side)

### 3. Protected Routes

**Logic**: 
- `app/page.tsx` kiểm tra `getUser()`
- Nếu không có user → hiển thị `LandingPage`
- Nếu có user → hiển thị `DashboardContent`

---

## 💎 PREMIUM / MEMBERSHIP LOGIC

### 1. Kiểm tra Premium Status

**File**: `lib/auth/helpers.ts`

```typescript
export async function isPremium(): Promise<boolean>
```

**Logic**:
1. Lấy user từ Supabase Auth
2. Kiểm tra `user.user_metadata?.is_premium === true`
3. Mặc định trả về `false` nếu không có user hoặc không phải premium

### 2. Premium Features

| Feature | Free | Premium |
|---------|------|---------|
| Max Profiles | 5 | Unlimited |
| Categories | Chỉ "General" | Tất cả categories |
| Notes | ❌ Disabled | ✅ Enabled |
| AI Updates | ❌ Coming soon | ✅ Coming soon |

### 3. Premium Activation

**Webhook**: `app/api/webhook/lemon-squeezy/route.ts`

**Flow**:
1. User click "Upgrade to Premium" → mở Lemon Squeezy checkout
2. User thanh toán thành công
3. Lemon Squeezy gửi webhook `order_created` đến `/api/webhook/lemon-squeezy`
4. Webhook handler:
   - Verify signature (HMAC SHA256)
   - Tìm user theo email từ order
   - Cập nhật `user_metadata.is_premium = true` bằng Admin Client
   - Lưu `premium_activated_at` và `lemon_squeezy_order_id`

**Environment Variables**:
- `LEMON_SQUEEZY_WEBHOOK_SECRET`: Secret để verify webhook signature
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key để update user metadata

---

## 🛠️ SERVER ACTIONS

### 1. Profile Actions (`lib/profiles/actions.ts`)

#### `addProfile(url, title, notes?, category?)`

**Mục đích**: Thêm profile mới vào database

**Parameters**:
- `url` (string, required): URL profile (phải có http/https)
- `title` (string, required): Tên hiển thị
- `notes` (string, optional): Ghi chú (Premium only). **Lưu ý**: Truyền `undefined` nếu không có, không truyền `null`
- `category` (string, optional): Category (Premium only, default: "General")

**Cách gọi** (⚠️ QUAN TRỌNG):
```typescript
// ✅ ĐÚNG: Truyền parameters riêng biệt
const result = await addProfile(
  normalizedUrl,
  title.trim(),
  notes.trim() || undefined,  // Dùng undefined, không dùng null
  isPremium ? (category || "General") : "General"
);

// ❌ SAI: Không truyền object
const result = await addProfile({
  url: normalizedUrl,
  title: title.trim(),
  notes: notes.trim() || null,  // SAI: null không được chấp nhận
  category: category
});
```

**Logic**:
1. ✅ Kiểm tra authentication (phải có user)
2. ✅ Validate URL (phải là URL hợp lệ)
3. ✅ Lấy `user_id` từ session
4. ✅ Insert vào `profiles_tracked` với đầy đủ fields
5. ✅ Revalidate path để cập nhật UI

**Return**:
```typescript
{ success: boolean, error?: string }
```

#### `deleteProfile(profileId)`

**Mục đích**: Xóa profile khỏi database

**Logic**:
1. ✅ Kiểm tra authentication
2. ✅ Xóa profile chỉ nếu `user_id` khớp (RLS sẽ tự động enforce)
3. ✅ Revalidate path

#### `getProfiles()`

**Mục đích**: Lấy danh sách profiles của user hiện tại

**Logic**:
1. ✅ Kiểm tra authentication
2. ✅ Query `profiles_tracked` với filter `user_id = current_user.id`
3. ✅ Sắp xếp theo `created_at DESC`

**Return**:
```typescript
{ data: Profile[] | null, error?: string }
```

### 2. Admin Actions (`lib/profiles/admin-actions.ts`) ✅ MỚI

**⚠️ CHỈ dùng trong admin pages**
**⚠️ PHẢI kiểm tra `isAdmin()` trước khi gọi các functions này**

#### `getAllProfiles()`

**Mục đích**: Lấy tất cả profiles trong hệ thống (Admin only)

**Logic**:
1. Sử dụng Admin Client (Service Role Key) để bypass RLS
2. Query tất cả profiles từ `profiles_tracked`
3. Sắp xếp theo `created_at DESC`

**Return**:
```typescript
{ data: Profile[] | null, error?: string }
```

**⚠️ QUAN TRỌNG**: 
- Function này bypass RLS bằng cách dùng Admin Client
- CHỈ được gọi sau khi đã verify user là admin
- Không expose ra client-side

---

## 🎨 UI COMPONENTS

### 1. Landing Page (`components/LandingPage.tsx`)

**Mục đích**: Trang chủ khi user chưa đăng nhập

**Features**:
- Hero section: "Stop Drowning in Tabs. Build Stronger Relationships."
- 3 Feature cards: Focus Mode, One-Click Access, Strategic Notes
- Social Proof section: "Trusted by Sales Teams at Top Companies"
- CTA button: "Get Started for Free" → `/login`

### 2. Dashboard (`components/DashboardContent.tsx`)

**Mục đích**: Dashboard chính sau khi đăng nhập

**Features**:
- Header với số lượng profiles
- Profile Grid (responsive)
- Floating Add Button (góc phải dưới) → mở Modal
- Upgrade Button (nếu chưa Premium)

### 3. Add Profile Modal (`components/AddProfileModal.tsx`)

**Mục đích**: Modal form để thêm profile mới

**Fields**:
- URL (required, auto-normalize)
- Title (required, auto-suggest từ domain)
- Category (Premium only, disabled cho Free)
  - **Free users**: Chỉ được chọn "General" (không được chọn "Competitor")
  - **Premium users**: Được chọn tất cả categories
- Notes (Premium only, disabled cho Free)

**Features**:
- Auto-detect favicon từ URL
- URL validation (phải có http/https)
- Free limit warning (5 profiles)
- Loading state với spinner
- Toast notifications
- Membership-based category restrictions

**Implementation Notes**:
- Gọi `addProfile()` với parameters riêng biệt (không phải object)
- Sử dụng `e.clipboardData.getData("text")` để lấy text từ clipboard (không dùng `getText()`)
- Notes phải là `undefined` nếu empty, không dùng `null`
- Free users chỉ thấy `FREE_CATEGORIES` (chỉ "General"), Premium users thấy `CATEGORIES` (tất cả)

### 4. Admin Dashboard (`components/admin/AdminDashboard.tsx`) ✅ MỚI

**Mục đích**: Admin dashboard để quản lý tất cả profiles trong hệ thống

**Features**:
- Statistics cards: Total profiles, Unique users, Categories count
- Search và filter profiles
- Table hiển thị tất cả profiles với:
  - Profile info (favicon, title, notes)
  - URL (clickable link)
  - Category badge
  - User ID (truncated)
  - Created date
- Category breakdown section

**Access Control**:
- Chỉ admin mới có thể truy cập
- Route: `/admin`

### 5. Profile Card (`components/ProfileCard.tsx`)

**Mục đích**: Hiển thị profile dưới dạng Business Card

**Features**:
- Favicon (20x20, với fallback Globe icon)
- Title (bold, center)
- Notes (faint, italic, below title)
- Domain (below notes, with border-top)
- Category badge (top-left, nếu không phải "General")
- AI Update icon (Radio icon, top-left, gray nếu `has_new_update = false`)
- Delete button (top-right, hiện khi hover)
- Premium crown icon (top-right, nếu user Premium)
- Hover effects: scale, shadow, border color change
- Click to open URL in new tab

### 5. Profile Grid (`components/ProfileGrid.tsx`)

**Mục đích**: Grid layout cho danh sách profiles

**Layout**:
- Responsive: 1 col (mobile) → 2 cols (sm) → 3 cols (lg) → 4 cols (xl) → 5 cols (2xl)
- Gap: 6 (24px)

**Features**:
- Empty state với icon và message
- Delete confirmation dialog
- Toast notifications
- Auto-refresh sau khi delete

### 7. Navbar (`components/Navbar.tsx`) ⚠️ DEPRECATED

**Mục đích**: Navigation bar ở top (Đã được thay thế bởi Sidebar/Header)

**Status**: ⚠️ DEPRECATED - Dùng `Sidebar` và `Header` thay thế

---

## 🔌 API ROUTES

### 1. `/api/webhook/lemon-squeezy` (POST)

**Mục đích**: Nhận webhook từ Lemon Squeezy khi có order mới

**Security**:
- Verify signature bằng HMAC SHA256
- Secret: `LEMON_SQUEEZY_WEBHOOK_SECRET`

**Logic**:
1. Verify signature
2. Parse payload (JSON)
3. Kiểm tra event type: `order_created`
4. Tìm user theo email từ order
5. Cập nhật `user_metadata.is_premium = true` bằng Admin Client
6. Lưu `premium_activated_at` và `lemon_squeezy_order_id`

**Return**: `200 OK` hoặc `400/401/500` với error message

### 2. `/api/test-connection` (GET)

**Mục đích**: Test kết nối Supabase

**Return**: JSON với status và message

### 3. `/auth/callback` (GET)

**Mục đích**: Handle Supabase auth callbacks (email verification, OAuth, etc.)

---

## 🔐 ROLE-BASED ACCESS CONTROL (RBAC)

### 1. Roles

**Các roles hiện có**:
- `'user'`: User thường (default)
- `'admin'`: Admin user (có quyền truy cập `/admin`)

### 2. Admin Access

**Route**: `/app/admin/page.tsx`

**Access Control**:
1. ✅ Kiểm tra authentication (phải có user)
2. ✅ Kiểm tra role: `user.user_metadata?.role === 'admin'`
3. ✅ Nếu không phải admin → redirect về `/`
4. ✅ Nếu là admin → hiển thị Admin Dashboard

**Admin Features**:
- Xem tất cả profiles trong hệ thống
- Statistics: Total profiles, Unique users, Categories breakdown
- Search và filter profiles
- Xem chi tiết từng profile (user_id, created_at, etc.)

**⚠️ QUAN TRỌNG**: 
- Admin role phải được set thủ công qua Supabase Dashboard (xem `SQL_REQUIREMENTS.md`)
- Không thể set admin role qua code thông thường (phải dùng Admin API hoặc Dashboard)

---

## 🎨 STYLING & DESIGN SYSTEM

### Color Palette

**Primary Colors**:
- Emerald: `emerald-600`, `emerald-700` (buttons, accents)
- Blue: `blue-600`, `blue-700` (gradients, links)
- Slate: `slate-50`, `slate-900` (backgrounds, text)

**Premium Colors**:
- Yellow: `yellow-400`, `yellow-500` (Premium badges, borders)

**Status Colors**:
- Success: `emerald-*`
- Error: `red-*`
- Warning: `amber-*`

### Typography

- Headings: `font-bold`
- Body: `font-medium` hoặc default
- Small text: `text-sm`, `text-xs`

### Spacing

- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section spacing: `py-8`, `py-16`, `py-20`
- Card padding: `p-6`, `p-8`

### Components Style

- **Buttons**: Rounded (`rounded-lg`, `rounded-xl`), gradient backgrounds, hover effects
- **Cards**: Rounded (`rounded-2xl`), shadow (`shadow-lg`, `shadow-2xl`), hover scale/translate
- **Modals**: Backdrop blur, centered, max-width `max-w-2xl`

---

## 🔧 UTILITY FUNCTIONS

### URL Utilities (`lib/utils/url.ts`)

#### `normalizeUrl(url: string): string`
- Thêm `https://` nếu thiếu protocol
- Loại bỏ duplicate protocol (fix bug: `https://example.com/https://example.com`)
- Trim whitespace
- **⚠️ QUAN TRỌNG**: Luôn dùng function này trước khi lưu URL vào database

#### `getDomainFromUrl(url: string): string`
- Extract domain từ URL
- Ví dụ: `https://www.linkedin.com/in/user` → `linkedin.com`

#### `getFaviconUrl(url: string): string`
- Tạo Google Favicon API URL
- Format: `https://www.google.com/s2/favicons?domain={domain}&sz=64`

#### `isValidUrl(url: string): boolean`
- Kiểm tra URL có hợp lệ không (phải có http/https)

---

## 📦 ENVIRONMENT VARIABLES

**File**: `.env.local` (⚠️ KHÔNG commit lên Git)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Lemon Squeezy
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-secret
```

**⚠️ QUAN TRỌNG**: 
- `NEXT_PUBLIC_*` variables có thể truy cập từ client-side
- `SUPABASE_SERVICE_ROLE_KEY` và `LEMON_SQUEEZY_WEBHOOK_SECRET` chỉ dùng server-side

---

## 🚨 QUY TẮC CODE QUAN TRỌNG (DEVELOPMENT RULES)

### 1. Database Rules

✅ **PHẢI**:
- Sử dụng đúng tên bảng: `profiles_tracked` (không phải `profiles` hay `tracked_profiles`)
- Sử dụng đúng tên các trường như đã định nghĩa trong schema
- Luôn kiểm tra `user_id` khi query (RLS sẽ tự động enforce, nhưng nên explicit)
- Sử dụng `normalizeUrl()` trước khi lưu URL vào database

❌ **KHÔNG**:
- Tự ý thêm cột mới vào bảng `profiles_tracked` trừ khi có yêu cầu rõ ràng
- Thay đổi tên bảng hoặc trường đã có
- Bypass RLS bằng cách dùng Service Role Key trừ khi thực sự cần (như webhook)

### 2. Security Rules

✅ **PHẢI**:
- Luôn kiểm tra authentication trước khi thao tác với database
- Sử dụng Server Actions (`"use server"`) cho mutations
- Verify webhook signatures trước khi xử lý
- Sử dụng `createClient()` từ `lib/supabase/server.ts` cho server-side

❌ **KHÔNG**:
- Expose Service Role Key trong client-side code
- Bypass authentication checks
- Trust user input mà không validate

### 3. UI/UX Rules

✅ **PHẢI**:
- Form nhập liệu phải đặt trong Modal (không hiển thị trực tiếp trên page)
- Sử dụng Floating Button để mở Modal (không dùng inline form)
- Hiển thị loading state với spinner khi đang xử lý
- Sử dụng Toast notifications (Sonner) cho feedback
- Responsive design: mobile-first approach

❌ **KHÔNG**:
- Hiển thị form trực tiếp trên dashboard (phải dùng Modal)
- Quên loading state hoặc error handling

### 4. State Management

✅ **PHẢI**:
- Sau khi thêm/xóa profile, phải gọi `router.refresh()` để cập nhật UI
- Sử dụng Server Actions thay vì API routes khi có thể
- Revalidate path sau mutations
- **Gọi Server Actions với parameters riêng biệt** (không truyền object):
  ```typescript
  // ✅ ĐÚNG
  await addProfile(url, title, notes, category);
  
  // ❌ SAI
  await addProfile({ url, title, notes, category });
  ```
- **Optional parameters**: Dùng `undefined` thay vì `null` cho optional string parameters

❌ **KHÔNG**:
- Quên refresh UI sau mutations
- Sử dụng client-side state để sync với database (phải dùng Server Actions)
- Truyền object vào Server Actions (phải truyền parameters riêng biệt)
- Dùng `null` cho optional string parameters (phải dùng `undefined`)

### 5. Premium Logic

✅ **PHẢI**:
- Kiểm tra `isPremium()` trước khi enable Premium features
- Disable Category select và Notes textarea cho Free users
- Hiển thị upgrade prompt khi Free user đạt limit (5 profiles)
- Validate Premium status từ `user_metadata.is_premium`

❌ **KHÔNG**:
- Cho phép Free user chọn category khác "General"
- Cho phép Free user thêm notes
- Cho phép Free user thêm quá 5 profiles

### 6. Code Organization

✅ **PHẢI**:
- Server Actions đặt trong `lib/*/actions.ts`
- Helper functions đặt trong `lib/*/helpers.ts`
- Types đặt trong `lib/*/types.ts`
- Components đặt trong `components/`

❌ **KHÔNG**:
- Mix server và client code trong cùng file (trừ khi cần thiết)
- Đặt logic business trong components (nên tách ra Server Actions)

---

## 📝 CÁCH SỬ DỤNG TÀI LIỆU NÀY VỚI AI (CURSOR/GEMINI)

### Bước 1: Bắt đầu phiên chat mới

Khi bạn muốn phát triển tính năng mới, hãy copy câu lệnh này làm tiền đề:

```
Hãy đọc file SYSTEM_CONTEXT.md để hiểu cấu trúc database và thư mục hiện tại. 
Dựa trên các bảng và trường dữ liệu đã có, hãy thực hiện tính năng sau: [Mô tả tính năng mới]. 
Tuyệt đối không thay đổi tên biến, tên bảng, hoặc cấu trúc đã định nghĩa trong SYSTEM_CONTEXT.md.
```

**Ví dụ**:
```
Hãy đọc file SYSTEM_CONTEXT.md để hiểu cấu trúc database và thư mục hiện tại. 
Dựa trên các bảng và trường dữ liệu đã có, hãy tạo Admin Dashboard để quản lý users và profiles. 
Tuyệt đối không thay đổi tên biến, tên bảng, hoặc cấu trúc đã định nghĩa trong SYSTEM_CONTEXT.md.
```

### Bước 2: Sau khi code xong

Sau khi AI code xong một tính năng mới, bạn hãy ra lệnh:

```
Tính năng đã hoạt động tốt. Bây giờ hãy cập nhật file SYSTEM_CONTEXT.md để phản ánh những thay đổi mới nhất 
(thêm bảng mới, thêm route mới, thêm component mới, hoặc thay đổi logic quan trọng) 
để tôi sử dụng cho lần sau.
```

### Bước 3: Khi gặp lỗi về database

Nếu AI code sai tên bảng hoặc trường, hãy nhắc:

```
Bạn đã sử dụng sai tên bảng/trường. Hãy đọc lại SYSTEM_CONTEXT.md phần "CẤU TRÚC DATABASE" 
và sửa lại code cho đúng với schema đã định nghĩa.
```

---

## 🔄 QUY TRÌNH CẬP NHẬT TÀI LIỆU

**Khi nào cần cập nhật SYSTEM_CONTEXT.md**:

1. ✅ Thêm bảng mới vào database
2. ✅ Thêm cột mới vào bảng `profiles_tracked` (hoặc bảng khác)
3. ✅ Thêm API route mới
4. ✅ Thêm component mới quan trọng
5. ✅ Thay đổi logic Premium/Membership
6. ✅ Thay đổi authentication flow
7. ✅ Thêm environment variable mới
8. ✅ Thay đổi cấu trúc thư mục

**Cách cập nhật**:

1. Sau khi code xong tính năng mới
2. Yêu cầu AI: "Cập nhật SYSTEM_CONTEXT.md với thay đổi mới"
3. Review lại tài liệu để đảm bảo chính xác
4. Commit tài liệu cùng với code changes

---

## 📚 TÀI LIỆU THAM KHẢO

- **Supabase Docs**: https://supabase.com/docs
- **Next.js 14 Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lemon Squeezy Webhooks**: https://docs.lemonsqueezy.com/help/webhooks

---

## ✅ CHECKLIST KHI PHÁT TRIỂN TÍNH NĂNG MỚI

Trước khi commit code, đảm bảo:

- [ ] Đã đọc SYSTEM_CONTEXT.md
- [ ] Sử dụng đúng tên bảng và trường từ schema
- [ ] Đã kiểm tra authentication (nếu cần)
- [ ] Đã kiểm tra Premium logic (nếu liên quan)
- [ ] Đã thêm loading state và error handling
- [ ] Đã test responsive design
- [ ] Đã cập nhật SYSTEM_CONTEXT.md (nếu có thay đổi cấu trúc)
- [ ] Code không có linter errors

---

**📅 Last Updated**: 2024-12-19
**Version**: 1.0.0
**Maintained by**: Development Team

