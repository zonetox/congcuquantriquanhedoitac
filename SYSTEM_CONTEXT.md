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
- **Styling**: Tailwind CSS + Custom CSS animations
- **Backend**: Supabase (Authentication + Database)
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast notifications)
- **Payment**: Lemon Squeezy (Webhook integration)
- **Animations**: CSS keyframes (fadeInSlideUp) - không dùng framer-motion

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
  is_in_feed BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
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
| `category` | TEXT | NULLABLE, DEFAULT 'General' | Phân loại: Có thể là default categories hoặc custom categories từ bảng `categories` |
| `notes` | TEXT | NULLABLE | Ghi chú cá nhân (Premium feature) |
| `has_new_update` | BOOLEAN | NULLABLE, DEFAULT false | Flag để đánh dấu có update mới (AI feature - coming soon) |
| `is_in_feed` | BOOLEAN | NULLABLE, DEFAULT false | User có muốn đưa profile này vào Newsfeed không (v3.2) |
| `last_interacted_at` | TIMESTAMP WITH TIME ZONE | NULLABLE, DEFAULT now() | Ngày tương tác cuối cùng (CRM Module v1.0) |
| `relationship_score` | INTEGER | NULLABLE, DEFAULT 100 | Điểm sức khỏe mối quan hệ (0-100) (CRM Module v1.0) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Thời gian tạo record |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NULLABLE, DEFAULT now() | Thời gian cập nhật record (tự động cập nhật bởi trigger) (v3.2) |

**Indexes** (v3.2):
- `profiles_tracked_pkey` (UNIQUE) trên `id` - Primary key index
- `idx_profiles_user_id` (BTREE) trên `user_id` - Tối ưu query theo user
- `idx_profiles_created_at` (BTREE) trên `created_at DESC` - Tối ưu sorting theo thời gian tạo
- `idx_profiles_tracked_category` (BTREE) trên `category` WHERE `category IS NOT NULL` - Tối ưu filter theo category (v3.2)
- `idx_profiles_tracked_is_in_feed` (BTREE) trên `(user_id, is_in_feed)` WHERE `is_in_feed = true` - Tối ưu Newsfeed queries (v3.2)
- `idx_profiles_tracked_updated_at` (BTREE) trên `updated_at DESC` - Tối ưu sorting theo thời gian update (v3.2)
- `idx_profiles_tracked_last_interacted_at` (BTREE) trên `last_interacted_at DESC NULLS LAST` - Tối ưu CRM queries (CRM v1.0)
- `idx_profiles_tracked_relationship_score` (BTREE) trên `relationship_score DESC NULLS LAST` - Tối ưu sort theo điểm sức khỏe (CRM v1.0)
- `idx_profiles_tracked_user_interaction` (BTREE) trên `(user_id, last_interacted_at DESC NULLS LAST)` - Tối ưu query theo user và ngày tương tác (CRM v1.0)

**Row Level Security (RLS)**:
- ✅ RLS đã được bật
- Policy: "Users can manage their own tracked profiles" (ALL operations)
  - SELECT: Users chỉ thấy profiles của chính họ
  - INSERT: Users chỉ có thể tạo profiles cho chính họ
  - UPDATE: Users chỉ có thể update profiles của chính họ
  - DELETE: Users chỉ có thể xóa profiles của chính họ
- Policy: "Profiles access policy" (ALL operations với admin support)
  - Cho phép admin truy cập tất cả profiles thông qua `is_admin_user()` function
- Condition: `auth.uid() = user_id` hoặc `is_admin_user() = true`

**Triggers** (v3.2):
- ✅ `update_profiles_tracked_updated_at`: Tự động cập nhật `updated_at = NOW()` mỗi khi có UPDATE
  - Function: `update_profiles_tracked_updated_at()`
  - Event: `BEFORE UPDATE ON profiles_tracked`
  - Logic: Set `NEW.updated_at = timezone('utc'::text, now())`

**⚠️ QUAN TRỌNG**: 
- **KHÔNG** tự ý thêm cột mới vào bảng này trừ khi có yêu cầu rõ ràng
- **LUÔN** sử dụng đúng tên bảng `profiles_tracked` (không phải `profiles` hay `tracked_profiles`)
- **LUÔN** kiểm tra `user_id` khi query để đảm bảo security
- **Trigger tự động**: `updated_at` được tự động cập nhật bởi trigger, không cần set thủ công
- **Indexes**: Đã được tối ưu cho category filter và Newsfeed queries (v3.2)

---

### 2. Bảng `public.user_profiles` ✅ Single Source of Truth

**Mục đích**: Lưu trữ thông tin membership và role của user. **Đây là nguồn dữ liệu duy nhất** cho membership và role, thay thế hoàn toàn `user_metadata`.

**Schema chi tiết**:

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'user' hoặc 'admin'
  is_premium BOOLEAN DEFAULT false,
  trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Ngày bắt đầu trial (15 ngày)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Chi tiết các trường**:

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PRIMARY KEY, FOREIGN KEY → auth.users(id) | ID của user (khớp với auth.users) |
| `email` | TEXT | NULLABLE | Email của user (để dễ query) |
| `role` | TEXT | DEFAULT 'user' | Role: 'user' hoặc 'admin' |
| `is_premium` | BOOLEAN | DEFAULT false | Premium status (trả phí) |
| `trial_started_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Ngày bắt đầu trial (15 ngày miễn phí) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời gian cập nhật |

**Indexes**:
- `idx_user_profiles_email` (BTREE) trên `email` - Tối ưu query theo email
- `idx_user_profiles_role` (BTREE) trên `role` - Tối ưu admin queries

**Row Level Security (RLS)**:
- ✅ RLS đã được bật
- Policy: "Users can view their own profile" - User chỉ thấy profile của chính họ
- Policy: "Admins can view all profiles" - Admin thấy tất cả (sử dụng function `is_admin_user()`)
- Policy: "Users can update their own profile" - User chỉ update profile của chính họ (không được đổi role)
- Policy: "Admins can update all profiles" - Admin update tất cả

**Trigger tự động**:
- `handle_new_user()`: Tự động tạo profile khi user mới đăng ký
- Trigger: `on_auth_user_created` trên `auth.users`

**Function hỗ trợ**:
- `is_admin_user()`: Function để check admin role (dùng trong policies, tránh circular dependency)

**Cách kiểm tra Premium**:
- `isPremium()`: Chỉ check `is_premium === true` (không tính trial)
- `hasValidPremiumAccess()`: Check Premium hợp lệ = `is_premium === true` HOẶC đang trong trial period (<= 15 ngày)
- `getTrialStatus()`: Lấy số ngày còn lại của trial
- Query từ bảng `user_profiles`: `SELECT is_premium, trial_started_at FROM user_profiles WHERE id = user.id`

**Cách kiểm tra Role**:
- Sử dụng function `isAdmin()` từ `lib/membership.ts`
- Query từ bảng `user_profiles`: `SELECT role FROM user_profiles WHERE id = user.id`
- Default role là `'user'` nếu không tìm thấy profile

**⚠️ QUAN TRỌNG**: 
- **Bảng `user_profiles` là Single Source of Truth** cho membership và role
- **KHÔNG** còn dùng `user_metadata` cho role và is_premium
- Premium status được cập nhật tự động từ Lemon Squeezy webhook (update vào `user_profiles`)
- Role phải được set thủ công qua SQL (xem `SQL_REQUIREMENTS.md`)
- Trigger tự động tạo profile khi user mới đăng nhập

### 3. Bảng `public.categories` ✅ Dynamic Categories

**Mục đích**: Lưu trữ các categories tùy chỉnh do user tạo. Categories là **dynamic** (động), không còn hardcoded.

**Schema chi tiết**:

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name) -- Tránh trùng tên danh mục cho cùng 1 user
);
```

**Chi tiết các trường**:

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PRIMARY KEY | ID tự động |
| `user_id` | UUID | FOREIGN KEY → auth.users(id) | ID của user sở hữu category |
| `name` | TEXT | NOT NULL, UNIQUE(user_id, name) | Tên category (không trùng trong cùng user) |
| `color` | TEXT | DEFAULT '#3b82f6' | Màu sắc của category (hex color) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời gian tạo |

**Row Level Security (RLS)**:
- ✅ RLS đã được bật
- Policy: "Categories access policy" - User quản lý categories của họ, Admin quản lý tất cả

**Giới hạn Categories**:
- **Free users**: Tối đa 3 categories
- **Premium/Trial users**: Unlimited categories

**Default Categories** (không lưu trong database, hiển thị mặc định):
- General (Slate)
- Competitor (Red)
- Partner (Green)
- Customer (Blue)
- Other (Violet)

### 4. Bảng `public.api_key_pool` ✅ Newsfeed Module - API Key Pool

**Mục đích**: Lưu trữ kho API keys để xoay vòng khi gọi API Scraper (Newsfeed Module v2A).

**Schema chi tiết**:

```sql
CREATE TABLE public.api_key_pool (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  provider TEXT NOT NULL, -- 'RapidAPI', 'Apify', v.v.
  api_key TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active', -- 'active', 'rate_limited', 'dead'
  quota_limit INT DEFAULT 100,
  current_usage INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Chi tiết các trường**:

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PRIMARY KEY | ID tự động |
| `provider` | TEXT | NOT NULL | Tên provider (e.g., 'RapidAPI', 'Apify') |
| `api_key` | TEXT | NOT NULL, UNIQUE | API key string |
| `status` | TEXT | DEFAULT 'active' | Trạng thái: 'active', 'rate_limited', 'dead' |
| `quota_limit` | INT | DEFAULT 100 | Giới hạn quota cho key này |
| `current_usage` | INT | DEFAULT 0 | Số lần đã sử dụng |
| `last_used_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời gian sử dụng cuối cùng |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời gian tạo |

**Indexes** (Newsfeed v2A):
- `idx_api_key_pool_provider_status` (BTREE) trên `(provider, status, current_usage)` - Tối ưu query getValidKey
- `idx_api_key_pool_status` (BTREE) trên `status` WHERE `status = 'active'` - Tối ưu filter active keys
- `idx_api_key_pool_last_used` (BTREE) trên `last_used_at DESC NULLS LAST` - Tối ưu sort theo thời gian sử dụng

**Row Level Security (RLS)**:
- ✅ RLS đã được bật
- Policy: "Admin manage keys" (ALL operations)
- Chỉ admin mới có thể quản lý API keys: `is_admin_user() = true`

**⚠️ QUAN TRỌNG**: 
- API keys được xoay vòng tự động khi gặp lỗi 429 (Rate Limit)
- Key tự động chuyển sang `rate_limited` khi vượt quota
- Key tự động chuyển sang `dead` sau nhiều lần lỗi

### 5. Bảng `public.profile_posts` ✅ Newsfeed Module - Posts

**Mục đích**: Lưu trữ các bài đăng từ profiles được theo dõi (Newsfeed Module v2A).

**Schema chi tiết**:

```sql
CREATE TABLE public.profile_posts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles_tracked(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  post_url TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  ai_analysis JSONB, -- Lưu tóm tắt và Sales Signals sau này
  ai_suggestions JSONB, -- Lưu Ice Breakers sau này
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Chi tiết các trường**:

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `id` | UUID | PRIMARY KEY | ID tự động |
| `profile_id` | UUID | FOREIGN KEY → profiles_tracked(id) | ID của profile tạo post này |
| `user_id` | UUID | FOREIGN KEY → auth.users(id) | ID của user sở hữu profile |
| `content` | TEXT | NULLABLE | Nội dung bài đăng |
| `post_url` | TEXT | NULLABLE | Link đến bài đăng gốc |
| `image_url` | TEXT | NULLABLE | Link đến hình ảnh bài đăng (nếu có) |
| `published_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | Thời gian đăng bài (từ source) |
| `ai_analysis` | JSONB | NULLABLE | Phân tích AI (tóm tắt, Sales Signals) - coming soon |
| `ai_suggestions` | JSONB | NULLABLE | Gợi ý AI (Ice Breakers) - coming soon |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT now() | Thời gian tạo record |

**Indexes** (Newsfeed v2A):
- `idx_profile_posts_profile_id` (BTREE) trên `profile_id` - Tối ưu query posts theo profile
- `idx_profile_posts_user_id` (BTREE) trên `user_id` - Tối ưu query posts theo user
- `idx_profile_posts_user_published` (BTREE) trên `(user_id, published_at DESC NULLS LAST)` - Tối ưu Newsfeed queries
- `idx_profile_posts_created_at` (BTREE) trên `created_at DESC` - Tối ưu sort theo thời gian tạo

**Row Level Security (RLS)**:
- ✅ RLS đã được bật
- Policy: "Users view own posts" (SELECT)
- Chỉ cho phép user xem posts của chính họ: `auth.uid() = user_id`

**⚠️ QUAN TRỌNG**: 
- Posts được tự động xóa khi profile bị xóa (CASCADE)
- Chỉ hiển thị posts từ profiles có `is_in_feed = true`
- `published_at` có thể NULL nếu không lấy được từ source

### 6. Bảng `public.admin_logs` ✅ Admin Activity Logging

**Mục đích**: Lưu trữ log các hành động của Admin để audit và theo dõi.

**Schema chi tiết**:

```sql
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Chi tiết các trường**:

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | UUID | PRIMARY KEY |
| `admin_id` | UUID | ID của admin thực hiện hành động |
| `action` | TEXT | Loại hành động (e.g., "update_user", "delete_profile") |
| `target_user_id` | UUID | ID của user bị ảnh hưởng (nếu có) |
| `details` | JSONB | Chi tiết hành động (JSON) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Thời gian thực hiện |

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
│   ├── feed/                     # ✅ Newsfeed page (Newsfeed v2A)
│   │   └── page.tsx              # Newsfeed với Neumorphism UI
│   ├── solutions/                # ✅ Solutions page (v3.1)
│   │   └── page.tsx              # Deep-dive solutions page for prospects
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
│   ├── admin/                    # Admin components
│   │   ├── AdminDashboard.tsx    # Admin dashboard với danh sách tất cả profiles
│   │   └── ApiKeyManagement.tsx  # ✅ API Key Management component (Newsfeed v2A)
│   ├── AddProfileModal.tsx       # ✅ Modal form để thêm profile
│   ├── EditProfileModal.tsx      # ✅ Modal form để chỉnh sửa profile (v3.2)
│   ├── ProfileDetailsModal.tsx   # ✅ Modal hiển thị chi tiết profile và interaction logs (CRM v1.0)
│   ├── FeedContent.tsx           # ✅ Newsfeed content component (Newsfeed v2A)
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
│   ├── membership.ts             # ✅ Membership & Role management (Single Source of Truth)
│   ├── profiles/                 # Profile management
│   │   ├── actions.ts            # Server actions: addProfile, deleteProfile, getProfiles
│   │   ├── admin-actions.ts     # ✅ Admin actions: getAllProfiles (Admin only)
│   │   └── types.ts              # TypeScript types cho Profile
│   ├── categories/               # ✅ Category management
│   │   └── actions.ts            # Server actions: getCategories, createCategory, updateCategory, deleteCategory
│   ├── feed/                     # ✅ Newsfeed management (Newsfeed v2A)
│   │   ├── actions.ts            # Server actions: getFeedPosts, syncFeed
│   │   └── types.ts              # Types cho FeedPost
│   ├── api-keys/                 # ✅ API Key management (Newsfeed v2A)
│   │   └── actions.ts            # Server actions: getAllApiKeys, bulkImportApiKeys, toggleApiKeyStatus, deleteApiKey
│   ├── scrapers/                 # ✅ API Scraper utilities (Newsfeed v2A)
│   │   └── api-rotator.ts        # API rotation logic: getValidKey, fetchWithRotation
│   ├── admin/                    # ✅ Admin management
│   │   └── actions.ts            # Admin actions: getAllUsers, updateUser, deleteUser, updateProfile, deleteProfileAsAdmin
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
├── SQL_REQUIREMENTS.md           # ✅ SQL commands cần chạy thủ công
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
  - ✅ Trigger tự động tạo profile trong `user_profiles` với `role = 'user'` và `is_premium = false`

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

### 1. Membership Management

**File**: `lib/membership.ts` ✅ **Single Source of Truth**

**⚠️ QUAN TRỌNG**: Tất cả membership và role data được lấy từ bảng `user_profiles`, **KHÔNG** còn dùng `user_metadata`.

**Functions chính**:

#### `getUserMembership(): Promise<{isPremium: boolean, isAdmin: boolean, role: 'admin' | 'user' | null, hasValidPremium: boolean, trialStatus: {...}}>` ✅ TỐI ƯU
- **Tối ưu performance**: Gộp `isPremium()` và `isAdmin()` thành 1 query
- **Khuyến nghị**: Dùng function này thay vì gọi `isPremium()` và `isAdmin()` riêng biệt
- Logic: Query từ `user_profiles` một lần, trả về cả `is_premium`, `role`, và `trial_started_at`
- **hasValidPremium**: `is_premium === true` HOẶC đang trong trial period (<= 15 ngày)
- **trialStatus**: `{daysLeft: number | null, isActive: boolean, isExpired: boolean}`
- **Sử dụng**: `app/page.tsx`, `app/admin/page.tsx`, `app/settings/page.tsx`

#### `getTrialStatus(): Promise<{daysLeft: number | null, isActive: boolean, isExpired: boolean}>`
- Lấy số ngày còn lại của trial (0-15 ngày)
- `daysLeft`: Số ngày còn lại (null nếu không có trial hoặc đã hết hạn)
- `isActive`: Trial còn hoạt động không
- `isExpired`: Trial đã hết hạn chưa

#### `hasValidPremiumAccess(): Promise<boolean>`
- Kiểm tra xem user có quyền Premium hợp lệ không
- Logic: `is_premium === true` HOẶC đang trong trial period (<= 15 ngày)
- **Sử dụng**: Để check quyền truy cập features (category, notes, v.v.)

#### `isPremium(): Promise<boolean>`
- Kiểm tra xem user có phải Premium không
- Logic: Query từ `user_profiles.is_premium` (KHÔNG dùng metadata)
- ⚠️ **Nếu cần cả isPremium và isAdmin, dùng `getUserMembership()` để tối ưu**

#### `isAdmin(): Promise<boolean>`
- Kiểm tra xem user có phải Admin không
- Logic: Query từ `user_profiles.role === 'admin'` (KHÔNG dùng metadata)
- ⚠️ **Nếu cần cả isPremium và isAdmin, dùng `getUserMembership()` để tối ưu**

#### `getUserRole(): Promise<'admin' | 'user' | null>`
- Lấy role của user hiện tại
- Default: `'user'` nếu không tìm thấy profile

#### `canSelectCompetitorCategory(): Promise<boolean>`
- Free users (không premium và không trong trial): KHÔNG được chọn 'Competitor' (chỉ 'General')
- Premium users HOẶC đang trong trial: Được chọn tất cả categories
- **Logic**: Dùng `hasValidPremiumAccess()` thay vì `isPremium()`

#### `canAddProfile(currentProfileCount): Promise<{allowed: boolean, reason?: string, warning?: string}>`
- **Logic mới (Trial + Blur)**: KHÔNG chặn cứng việc thêm profile
- Cho phép thêm unlimited profiles
- Profiles từ thứ 6 trở đi sẽ bị blur nếu trial expired và không premium
- Trả về `warning` message nếu đạt giới hạn, nhưng vẫn `allowed: true`
- **Sử dụng**: `hasValidPremiumAccess()` để check quyền

#### `canUseNotes(): Promise<boolean>`
- Free users (không premium và không trong trial): KHÔNG
- Premium users HOẶC đang trong trial: CÓ
- **Logic**: Dùng `hasValidPremiumAccess()` thay vì `isPremium()`

#### `getMembershipInfo(): Promise<MembershipInfo>`
- Lấy thông tin membership đầy đủ của user

### 2. Premium Features

| Feature | Free | Trial (15 days) | Premium |
|---------|------|-----------------|---------|
| Max Profiles | Unlimited (5 đầu hiển thị, từ thứ 6 blur) | Unlimited (full access) | Unlimited |
| Categories | Chỉ "General" | Tất cả categories | Tất cả categories |
| Notes | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| AI Updates | ❌ Coming soon | ✅ Coming soon | ✅ Coming soon |
| Profile Blur | ✅ Từ profile thứ 6 | ❌ Không blur | ❌ Không blur |

### 3. Premium Activation

**Webhook**: `app/api/webhook/lemon-squeezy/route.ts`

**Flow**:
1. User click "Upgrade to Premium" → mở Lemon Squeezy checkout (từ `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL`)
2. User thanh toán thành công
3. Lemon Squeezy gửi webhook đến `/api/webhook/lemon-squeezy` với các events:
   - `order_created`: Khi order được tạo (one-time payment)
   - `subscription_created`: Khi subscription được tạo (recurring payment)
   - `subscription_cancelled`: Khi subscription bị hủy
4. Webhook handler:
   - **Xác thực**: Verify signature (HMAC SHA256) từ header `x-signature` với `LEMON_SQUEEZY_WEBHOOK_SECRET`
   - **Tìm user**: Tìm user theo email từ payload (`customer_email`, `user_email`, hoặc `email`)
   - **Cập nhật Premium**:
     - `order_created` hoặc `subscription_created`: Set `user_profiles.is_premium = true`
     - `subscription_cancelled`: Set `user_profiles.is_premium = false`
   - **Bảo mật**: Sử dụng Admin Client (`SUPABASE_SERVICE_ROLE_KEY`) để bypass RLS
   - Update `updated_at` timestamp

**Supported Events**:
- ✅ `order_created`: One-time payment → Activate Premium
- ✅ `subscription_created`: Recurring subscription → Activate Premium
- ✅ `subscription_cancelled`: Cancel subscription → Deactivate Premium

**Environment Variables**:
- `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL`: Checkout URL từ Lemon Squeezy Dashboard
- `NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL`: Customer Portal URL (default: `https://app.lemonsqueezy.com/my-account`)
- `LEMON_SQUEEZY_WEBHOOK_SECRET`: Secret để verify webhook signature (từ Lemon Squeezy Dashboard > Settings > Webhooks)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key để update user_profiles (bypass RLS)

**Thank You Page**: `app/thank-you/page.tsx`
- Hiển thị sau khi thanh toán thành công
- Thông báo "Payment Successful!" và list Premium features
- CTA button "Go to Dashboard"

---

## 🛠️ SERVER ACTIONS

### 1. Profile Actions (`lib/profiles/actions.ts`)

**User Actions** (cho regular users):

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

#### `updateProfile(profileId, updates)` ✅ MỚI (v3.2)

**Mục đích**: Cập nhật profile (cho regular users)

**Parameters**:
- `profileId` (string, required): ID của profile cần update
- `updates` (object, required): Object chứa các field cần update
  - `title?` (string, optional): Tên hiển thị mới
  - `url?` (string, optional): URL mới (phải validate)
  - `category?` (string, optional): Category mới
  - `notes?` (string, optional): Notes mới

**Logic**:
1. ✅ Kiểm tra authentication
2. ✅ Validate URL nếu có update URL
3. ✅ Update vào `profiles_tracked` với filter `user_id = current_user.id` (RLS đảm bảo security)
4. ✅ Revalidate path để cập nhật UI

**Return**:
```typescript
{ success: boolean, error?: string }
```

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
- **4 Pain Point & Solution Cards** (v3.1):
  1. **Lost in Newsfeed**: Facebook/LinkedIn algorithms hide posts → Partner Center scans profiles directly
  2. **Time Waste**: 2 hours daily on 5 platforms → Just 5 minutes on focused Newsfeed
  3. **High Cost**: $200+/month for bulky systems → $5-$10/month lean tool
  4. **Missed Opportunities**: Don't know what to say or miss buying signals → AI Ice Breaker + AI Sales Signals
- Social Proof section: "Trusted by Sales Teams at Top Companies"
- CTA button: "Get Started for Free" → `/login`

**4 Core Values** (v3.1):
1. **100% Visibility**: Direct profile scanning bypasses algorithm limitations
2. **Time Efficiency**: Reduce daily monitoring from 120-180 minutes to 5-10 minutes
3. **Cost Optimization**: Affordable pricing ($5-$10/month) vs. expensive alternatives ($200+/month)
4. **AI-Powered Engagement**: AI suggests responses and detects sales signals automatically

### 1.5. Solutions Page (`app/solutions/page.tsx`) ✅ MỚI (v3.1)

**Mục đích**: Trang giải pháp chuyên sâu để gửi cho khách hàng mục tiêu (qua Zalo/Messenger)

**Features**:
- **Hero Section**: "Partner Center: Your AI Assistant to Care for the Right People, Close Deals at the Right Time."
- **Why You Need Us Section**: Chi tiết về cách thuật toán mạng xã hội đang làm hại mối quan hệ kinh doanh
- **Comparison Table**: So sánh Traditional Method vs. Partner Center (AI)
  - Post Visibility Rate: < 20% vs. 100%
  - Daily Time Investment: 120-180 min vs. 5-10 min
  - Monthly Cost: $200+ vs. $5-$10
  - Conversation Response: Manual vs. AI-suggested templates
- **CTA Section**: "Start Your 15-Day Free Trial" button → `/login`
- **Responsive Design**: Tối ưu cho mobile để gửi qua Zalo/Messenger

### 2. Dashboard (`components/DashboardContent.tsx`)

**Mục đích**: Dashboard chính sau khi đăng nhập

**Features**:
- Header với số lượng profiles
- **Category Tabs** (v3.2): 
  - Tab "All" hiển thị tất cả profiles
  - Tabs theo từng category với số lượng profiles và màu nền theo category color
  - Click tab để filter profiles theo category
  - Màu nền tab active = màu category
- Profile Grid (responsive, filtered theo category được chọn)
- **Floating Add Button** (góc phải dưới, fixed position) → mở `AddProfileModal`
  - Icon: Plus với rotate animation khi hover
  - Gradient background: emerald-600 to blue-600
  - Z-index: 40 (trên các elements khác)
- Upgrade Button (nếu chưa Premium)
- **Modals**: 
  - `AddProfileModal`: Thêm profile mới
  - `EditProfileModal`: Chỉnh sửa profile (v3.2)

### 2.5. Sidebar (`components/Sidebar.tsx`) ✅ MỚI

**Mục đích**: Sidebar navigation cho desktop (lg breakpoint trở lên)

**Features**:
- Logo "Partner Center" với Target icon
- Navigation links: Dashboard, Settings, Admin (nếu là admin)
- **Quick Add Button**: Icon Plus nhỏ ngay cạnh menu "Dashboard" để mở Add Profile Modal nhanh
  - Chỉ hiển thị ở menu Dashboard
  - Mở `AddProfileModal` khi click
  - Tooltip: "Quick Add Profile"
- **Trial Status**: Hiển thị "Trial: X days left" hoặc "Plan: Free" dưới menu Dashboard (chỉ khi không Premium)
  - Props: `trialStatus` (từ parent component)
- **Usage Indicator**: Hiển thị "Usage: X/5 profiles" dưới Trial Status (chỉ khi không Premium)
  - Màu đỏ khi đạt giới hạn (4/5 hoặc 5/5)
  - Props: `currentProfileCount` (từ parent component)
- Premium badge (nếu Premium)
- Sign Out button
- Fixed position, chỉ hiển thị trên desktop (lg+)
- **Responsive**: Ẩn trên mobile (`hidden lg:flex`), dùng Header mobile menu thay thế

### 2.6. Header (`components/Header.tsx`) ✅ MỚI

**Mục đích**: Header navigation cho mobile và desktop

**Features**:
- Logo "Partner Center"
- Navigation links: Dashboard, Settings, Admin (nếu là admin)
- **Trial Status**: Hiển thị "Trial: X days left" hoặc "Plan: Free" trong mobile menu dưới Dashboard (chỉ khi không Premium)
  - Props: `trialStatus` (từ parent component)
- **Usage Indicator**: Hiển thị "Usage: X/5 profiles" trong mobile menu dưới Trial Status (chỉ khi không Premium)
  - Màu đỏ khi đạt giới hạn (4/5 hoặc 5/5)
  - Props: `currentProfileCount` (từ parent component)
- Mobile menu với hamburger icon
- Responsive: Sidebar trên desktop, Header trên mobile

### 3. Add Profile Modal (`components/AddProfileModal.tsx`)

**Mục đích**: Modal form để thêm profile mới

**Fields**:
- URL (required, auto-normalize)
- Title (required, auto-suggest từ domain)
- Category (v3.2: Tất cả users có thể chọn tất cả categories)
- Notes (v3.2: Tất cả users có thể sử dụng)

**Features**:
- Auto-detect favicon từ URL
- URL validation (phải có http/https)
- Loading state với spinner
- Toast notifications
- **Logic mới (v3.2)**: Tất cả users có full features, không còn giới hạn

**Implementation Notes**:
- Gọi `addProfile()` với parameters riêng biệt (không phải object)
- Sử dụng `e.clipboardData.getData("text")` để lấy text từ clipboard (không dùng `getText()`)
- Notes phải là `undefined` nếu empty, không dùng `null`

### 3.5. Edit Profile Modal (`components/EditProfileModal.tsx`) ✅ MỚI (v3.2)

**Mục đích**: Modal form để chỉnh sửa profile đã có

**Fields**:
- URL (required, auto-normalize)
- Title (required)
- Category (có thể thay đổi)
- Notes (có thể thay đổi)

**Features**:
- Pre-fill form với data hiện tại của profile
- Auto-detect favicon từ URL khi URL thay đổi
- URL validation (phải có http/https)
- Loading state với spinner
- Toast notifications
- Gọi `updateProfile()` để cập nhật database

**Implementation Notes**:
- Nhận `profile` prop để pre-fill form
- Gọi `updateProfile(profileId, updates)` với object chứa các field cần update
- Revalidate path sau khi update thành công

### 4. Admin Dashboard (`components/admin/AdminDashboard.tsx`) ✅ MỚI

**Mục đích**: Admin dashboard để quản lý users và profiles trong hệ thống

**Tabs**:
- **Profiles Tab**: Quản lý tất cả profiles
- **Users Tab**: Quản lý tất cả users

**Profiles Tab Features**:
- Statistics cards: Total profiles, Unique users, Categories count
- Search profiles by title, URL, category
- **Filter by User**: Dropdown để lọc profiles theo user cụ thể
- **Empty State**: Hiển thị icon và message thân thiện khi không có profiles hoặc không tìm thấy kết quả
  - Icon: Globe icon trong gradient box
  - Message khác nhau cho "No profiles yet" vs "No profiles found"
- Table hiển thị tất cả profiles với:
  - Profile info (favicon, title, notes)
  - URL (clickable link)
  - Category badge
  - User ID (truncated)
  - Created date
  - **Actions**: Edit, Delete buttons
- **Inline Edit**: Click Edit để chỉnh sửa profile trực tiếp trong table
- **Delete Profile**: Xóa profile của bất kỳ user nào
- Category breakdown section

**Users Tab Features**:
- Sử dụng `UserManagement` component
- Table hiển thị tất cả users với:
  - Email
  - Role (User/Admin badge)
  - Premium status
  - **Actions**: Edit, Delete buttons
- **Edit User**: Thay đổi Email, Role (User/Admin), Premium status
- **Delete User**: Xóa user và tất cả dữ liệu liên quan (Cascade)

**Access Control**:
- Chỉ admin mới có thể truy cập
- Route: `/admin`
- Tất cả actions được log vào `admin_logs` table

### 5. Profile Card (`components/ProfileCard.tsx`)

**Mục đích**: Hiển thị profile dưới dạng Business Card

**Performance Optimizations**:
- ✅ **Memoization**: Sử dụng `React.memo()` để tránh re-render không cần thiết
- ✅ **Image Optimization**: Sử dụng Next.js `Image` component với lazy loading
- ✅ **Lazy Loading**: Favicons được load khi vào viewport (`loading="lazy"`)

**Features**:
- **Card Animation**: Fade in và slide up khi load Dashboard
  - CSS animation: `fadeInSlideUp` (0.5s ease-out)
  - Stagger delay: Mỗi card có delay khác nhau (0ms, 50ms, 100ms, ... max 500ms)
  - Props: `animationDelay` (ms)
- Favicon (80x80, sử dụng Next.js `Image` component, lazy loading)
- Title (bold, center)
- Notes (faint, italic, below title)
- Domain (below notes, with border-top)
- **Category badge** (top-left, nếu không phải "General"):
  - **Dynamic Color**: Màu nền nhạt (15% opacity) và màu chữ đậm từ `categoryColor` prop
  - **Default categories**: Competitor (#ef4444), Partner (#10b981), Customer (#3b82f6), Other (#8b5cf6)
  - **Custom categories**: Màu sắc từ `categories.color` trong database (pass từ ProfileGrid)
  - Border với 30% opacity của category color
  - Props: `categoryColor` (hex color string)
- **RSS Icon** (v3.2): Luôn hiển thị ở góc trên bên phải
  - Màu emerald-600 khi đã add vào feed (`is_in_feed = true`)
  - Màu slate-400 khi chưa add vào feed
  - Click để toggle feed status
- **Edit Button** (v3.2): Hiển thị khi hover, mở `EditProfileModal`
- **Delete Button**: Hiển thị khi hover
- AI Update icon (Radio icon, top-left, gray nếu `has_new_update = false`)
- Premium crown icon (top-right, nếu user Premium)
- Hover effects: scale, shadow, border color change
- Click to open URL in new tab

### 6. Profile Grid (`components/ProfileGrid.tsx`)

**Mục đích**: Grid layout cho danh sách profiles

**Trial + Blur Logic**:
- ✅ **Sorting**: Profiles được sắp xếp theo `created_at DESC` (mới nhất lên đầu) - đã được sort trong `getProfiles()`
- ✅ **Blur Logic**: Nếu `trialExpired === true` và `isPremium === false`, profiles từ index 5 trở đi (từ thứ 6) sẽ bị blur
- ✅ **Props**: Nhận `hasValidPremium` và `trialExpired` từ parent component
- ✅ **Conditional Blur**: Chỉ blur khi `trialExpired && !isPremium && index >= 5`

**Layout**:
- Responsive: 1 col (mobile) → 2 cols (sm) → 3 cols (lg) → 4 cols (xl) → 5 cols (2xl)
- Gap: 6 (24px)

**Features**:
- **Category Color Map**: Tạo map từ categories để pass màu vào ProfileCard
  - Default colors cho default categories
  - User-defined categories từ `categories` prop override defaults
  - Props: `categories` (array of Category objects)
- Empty state với icon và message
- Delete confirmation dialog
- Toast notifications (Sonner)
- Auto-refresh sau khi delete
- Pass `isBlurred`, `categoryColor`, và `animationDelay` props cho ProfileCard
- **Stagger Animation**: Mỗi card có animation delay khác nhau (index * 50ms, max 500ms)

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
4. Tìm user theo email từ `user_profiles` (tối ưu hơn list all users)
5. **Cập nhật `user_profiles.is_premium = true`** bằng Admin Client (KHÔNG còn dùng metadata)
6. Update `updated_at` timestamp

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
2. ✅ Kiểm tra role: Query từ `user_profiles.role === 'admin'` (KHÔNG dùng metadata)
3. ✅ Nếu không phải admin → redirect về `/`
4. ✅ Nếu là admin → hiển thị Admin Dashboard

**Admin Features**:
- **Tabs**: Profiles và Users tabs để quản lý riêng biệt
- **Profiles Tab**:
  - Xem tất cả profiles trong hệ thống
  - Statistics: Total profiles, Unique users, Categories breakdown
  - Search profiles by title, URL, category
  - **Filter by User**: Dropdown để lọc profiles theo user cụ thể
  - **Inline Edit**: Click Edit để chỉnh sửa profile trực tiếp trong table
  - **Delete Profile**: Xóa profile của bất kỳ user nào
- **Users Tab**:
  - Xem tất cả users trong hệ thống
  - **Edit User**: Thay đổi Email, Role (User/Admin), Premium status
  - **Delete User**: Xóa user và tất cả dữ liệu liên quan (Cascade)
- **Admin Logs**: Tất cả actions được log vào `admin_logs` table
- Search và filter profiles
- Xem chi tiết từng profile (user_id, created_at, etc.)

**⚠️ QUAN TRỌNG**: 
- Admin role được lưu trong bảng `user_profiles.role` (KHÔNG dùng metadata)
- Role phải được set thủ công qua SQL (xem `SQL_REQUIREMENTS.md`)
- Không thể set admin role qua code thông thường (phải dùng SQL hoặc Admin API với Service Role Key)

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
- **Images**: Sử dụng Next.js `Image` component với lazy loading cho tối ưu performance

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
- **Lưu ý**: Sử dụng với Next.js `Image` component và `loading="lazy"` để tối ưu performance

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
# Lemon Squeezy
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL=https://app.lemonsqueezy.com/my-account
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
- Sử dụng đúng tên bảng: `user_profiles` (không phải `users` hay `user_profile`)
- Sử dụng đúng tên các trường như đã định nghĩa trong schema
- Luôn kiểm tra `user_id` khi query (RLS sẽ tự động enforce, nhưng nên explicit)
- Sử dụng `normalizeUrl()` trước khi lưu URL vào database
- **Query membership và role từ `user_profiles`** (KHÔNG dùng `user_metadata`)

❌ **KHÔNG**:
- Tự ý thêm cột mới vào bảng `profiles_tracked` hoặc `user_profiles` trừ khi có yêu cầu rõ ràng
- Thay đổi tên bảng hoặc trường đã có
- Bypass RLS bằng cách dùng Service Role Key trừ khi thực sự cần (như webhook, admin actions)
- Dùng `user_metadata` cho role và is_premium (phải dùng `user_profiles`)

### 2. Security Rules

✅ **PHẢI**:
- Luôn kiểm tra authentication trước khi thao tác với database
- Sử dụng Server Actions (`"use server"`) cho mutations
- Verify webhook signatures trước khi xử lý
- Sử dụng `createClient()` từ `lib/supabase/server.ts` cho server-side
- Kiểm tra `isAdmin()` trước khi cho phép truy cập admin routes

❌ **KHÔNG**:
- Expose Service Role Key trong client-side code
- Bypass authentication checks
- Trust user input mà không validate
- Cho phép non-admin users truy cập admin routes

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
- Validate Premium status từ `user_profiles.is_premium` (KHÔNG dùng metadata)
- Free users chỉ được chọn "General", không được chọn "Competitor"

❌ **KHÔNG**:
- Cho phép Free user chọn category khác "General" (đặc biệt là "Competitor")
- Cho phép Free user thêm notes
- Cho phép Free user thêm quá 5 profiles
- Dùng `user_metadata` để check premium hoặc role

### 5.5. Role-Based Access Control

✅ **PHẢI**:
- Kiểm tra `isAdmin()` trước khi cho phép truy cập `/admin`
- Sử dụng Admin Client chỉ trong admin actions
- Verify role từ `user_profiles.role === 'admin'` (KHÔNG dùng metadata)

❌ **KHÔNG**:
- Cho phép non-admin users truy cập admin routes
- Expose Admin Client ra client-side
- Hardcode admin emails trong code
- Dùng `user_metadata.role` để check admin

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
2. ✅ Thêm cột mới vào bảng `profiles_tracked` hoặc `user_profiles` (hoặc bảng khác)
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
- [ ] Đã kiểm tra Admin role (nếu liên quan)
- [ ] Đã thêm loading state và error handling
- [ ] Đã test responsive design
- [ ] Đã cập nhật SYSTEM_CONTEXT.md (nếu có thay đổi cấu trúc)
- [ ] Code không có linter errors
- [ ] **KHÔNG dùng `user_metadata` cho role và is_premium** (phải dùng `user_profiles`)

---

**📅 Last Updated**: 2024-12-19
**Version**: 3.2.0 (Dashboard Category Tabs & Profile Editing)
**Maintained by**: Development Team

**🔄 Recent Updates** (2024-12-19):

**Database Setup Complete** (v3.2.0):
- ✅ **Schema Updates**: Thêm `updated_at` và `is_in_feed` columns vào `profiles_tracked` table
- ✅ **Indexes Created**: Tạo 6 indexes để tối ưu performance
  - Primary key index
  - User ID index
  - Created at index (DESC sorting)
  - Category index (partial index cho filter)
  - Is in feed index (composite index cho Newsfeed queries)
  - Updated at index (DESC sorting)
- ✅ **Trigger Created**: Trigger tự động cập nhật `updated_at` mỗi khi profile được update
- ✅ **RLS Policies Verified**: Policies đã được kiểm tra và hoạt động đúng
- ✅ **Database Ready**: Database đã sẵn sàng cho production với đầy đủ tính năng v3.2

**Dashboard Category Tabs & Profile Editing** (v3.2.0):
- ✅ **Category Tabs**: Dashboard hiển thị tabs theo category với số lượng profiles và màu nền theo category color
  - Tab "All" hiển thị tất cả profiles
  - Mỗi category có tab riêng với count và màu nền
  - Click tab để filter profiles theo category
- ✅ **Edit Profile Feature**: Thêm tính năng chỉnh sửa profile
  - EditProfileModal component để edit title, URL, category, notes
  - updateProfile() action cho regular users (không chỉ admin)
  - Edit button trên ProfileCard (hiện khi hover)
- ✅ **RSS Icon Always Visible**: Icon RSS luôn hiển thị trên ProfileCard
  - Màu emerald-600 khi đã add vào feed
  - Màu slate-400 khi chưa add vào feed
  - Không cần hover để thấy icon
- ✅ **Full Features for All Users**: Tất cả users có đầy đủ tính năng (categories, notes, unlimited profiles)
  - Chỉ giới hạn: blur profiles từ thứ 6 trở đi khi trial expired

**Landing Page & Solutions Page Update** (v3.1.0):
- ✅ **Landing Page Features Update**: Thay thế 3 feature cards bằng 4 pain point & solution cards
  - Lost in Newsfeed: Algorithm hiding posts → Direct profile scanning
  - Time Waste: 2 hours daily → 5 minutes focused Newsfeed
  - High Cost: $200+/month → $5-$10/month lean tool
  - Missed Opportunities: Manual responses → AI Ice Breaker + AI Sales Signals
- ✅ **Solutions Page**: Tạo trang `/solutions` chuyên sâu cho prospects
  - Hero section với value proposition rõ ràng
  - "Why You Need Us" section giải thích vấn đề thuật toán
  - Comparison table: Traditional vs. AI-powered approach
  - CTA: "Start Your 15-Day Free Trial" → `/login`
  - Responsive design tối ưu cho mobile (Zalo/Messenger)
- ✅ **4 Core Values**: Documented trong SYSTEM_CONTEXT.md
  1. 100% Visibility (bypass algorithm)
  2. Time Efficiency (120-180 min → 5-10 min)
  3. Cost Optimization ($200+ → $5-$10)
  4. AI-Powered Engagement (auto responses & signals)

**UX Enhancements** (v2.5.0):

**Dynamic Categories + Advanced Admin Features** (v2.4.0):
- ✅ **Dynamic Categories**: Thay thế hardcoded categories bằng bảng `categories` trong database
- ✅ **Category Management**: User có thể tạo, sửa, xóa categories tùy chỉnh với màu sắc
- ✅ **Category Limits**: Free users tối đa 3 categories, Premium/Trial unlimited
- ✅ **Add Category in Modal**: Thêm category mới ngay trong Add Profile Modal
- ✅ **Settings Page**: Manage Categories section để quản lý categories
- ✅ **Admin User Management**: Admin có thể Edit/Delete users, thay đổi Email, Role, Premium status
- ✅ **Admin Profile Management**: Admin có thể Edit/Delete profiles của bất kỳ user nào
- ✅ **Admin Filter**: Filter profiles theo user trong Admin Dashboard
- ✅ **Admin Logs**: Bảng `admin_logs` để ghi lại các hành động của Admin
- ✅ **Admin Tabs**: Admin Dashboard có tabs cho Profiles và Users

**Trial 15 Days + Blur Data** (v2.3.0):
- ✅ **Trial Logic**: Thêm `trial_started_at` vào `user_profiles` table
- ✅ **Premium Access**: `hasValidPremiumAccess()` = `is_premium === true` HOẶC đang trong trial (<= 15 ngày)
- ✅ **Trial Status**: `getTrialStatus()` trả về số ngày còn lại, isActive, isExpired
- ✅ **Profile Blur**: Profiles từ thứ 6 trở đi bị blur nếu trial expired và không premium
- ✅ **Blur Overlay**: ProfileCard hiển thị overlay với Lock icon và "Upgrade to Unlock" khi bị blur
- ✅ **Trial Display**: Sidebar và Header hiển thị "Trial: X days left" hoặc "Plan: Free"
- ✅ **No Hard Limit**: Không chặn cứng việc thêm profile, chỉ blur từ profile thứ 6
- ✅ **Profile Sorting**: ProfileGrid sắp xếp theo `created_at DESC` (mới nhất lên đầu)
- ✅ **Add Button**: Nút "Add New Profile" nổi bật ở đầu trang Dashboard

**Performance Optimizations** (v2.2.0):
- ✅ **Query Optimization**: Tạo `getUserMembership()` để gộp `isPremium()` và `isAdmin()` thành 1 query
  - Giảm số lượng database queries từ 2 xuống 1
  - Tất cả pages (`app/page.tsx`, `app/admin/page.tsx`, `app/settings/page.tsx`) đã được cập nhật
- ✅ **Image Optimization**: 
  - Sử dụng Next.js `Image` component thay vì `<img>` tag
  - Lazy loading cho favicons (`loading="lazy"`)
  - Memoization cho `ProfileCard` component (`React.memo`)
  - Next.js config: Thêm `remotePatterns` cho Google Favicon API
- ✅ **Logging Cleanup**: 
  - Loại bỏ `console.log` trong production code
  - Chỉ log trong development mode (`process.env.NODE_ENV === "development"`)
- ✅ **Next.js Config**: 
  - Enable compression (`compress: true`)
  - Remove `X-Powered-By` header (`poweredByHeader: false`)
  - Image optimization config

**UI Improvements** (v2.1.0):
- ✅ **Category Badge Colors**: Thêm màu phân biệt cho category badges trong ProfileCard
  - Competitor: Red (`bg-red-100`, `text-red-700`)
  - Partner: Green (`bg-emerald-100`, `text-emerald-700`)
  - Customer: Blue (`bg-blue-100`, `text-blue-700`)
  - Other: Slate (màu mặc định)
- ✅ **Usage Indicator**: Thêm "Usage: X/5 profiles" trong Sidebar và Header mobile menu
  - Chỉ hiển thị khi không Premium
  - Màu đỏ khi đạt giới hạn (4/5 hoặc 5/5)
  - Props: `currentProfileCount` được pass từ parent components
- ✅ **Responsive Mobile**: 
  - ProfileGrid: `grid-cols-1` trên mobile → hiển thị 1 cột
  - Sidebar: `hidden lg:flex` → ẩn trên mobile, dùng Header hamburger menu
  - Header mobile menu: Có usage indicator và đầy đủ navigation links
- ✅ **Modal Implementation**: Xác nhận DashboardContent đã sử dụng AddProfileModal với floating button

**UX Enhancements** (v2.5.0):
- ✅ **Dynamic Category Badges**: 
  - Category badges sử dụng màu động từ `categories.color` trong database
  - Màu nền nhạt (15% opacity) và màu chữ đậm từ category color
  - Border với 30% opacity của category color
  - Default colors cho default categories (Competitor, Partner, Customer, Other)
  - User-defined categories override defaults
- ✅ **Card Animations**: 
  - CSS animation `fadeInSlideUp` (fade in + slide up) khi load Dashboard
  - Stagger effect: Mỗi card có delay khác nhau (0ms, 50ms, 100ms, ... max 500ms)
  - Animation duration: 0.5s ease-out
  - Defined in `app/globals.css`
- ✅ **Quick Add Button**: 
  - Icon Plus nhỏ trong Sidebar ngay cạnh menu "Dashboard"
  - Mở `AddProfileModal` nhanh từ bất kỳ đâu
  - Tooltip: "Quick Add Profile"
- ✅ **Empty States**: 
  - Admin Dashboard: Icon và message thân thiện khi không có profiles hoặc không tìm thấy kết quả
  - Different messages cho "No profiles yet" vs "No profiles found"
- ✅ **Toast Notifications**: 
  - Tất cả actions (add, delete, update) đều có toast notifications
  - Sử dụng Sonner library
  - Success/Error messages rõ ràng
