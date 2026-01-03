# 📋 Hướng dẫn Verify RLS Policies

## 🎯 Mục đích

Script `SQL_VERIFY_RLS_POLICIES.sql` được tạo để kiểm tra và verify tất cả RLS (Row Level Security) policies trong hệ thống, đặc biệt là RLS policy trên `profile_posts` đảm bảo User chỉ thấy posts từ profiles họ follow.

---

## 🚀 Cách chạy

### Bước 1: Mở Supabase SQL Editor

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor** ở sidebar bên trái
4. Click **New query**

### Bước 2: Copy và chạy Script

1. Mở file `SQL_VERIFY_RLS_POLICIES.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Bước 3: Xem kết quả

Script sẽ trả về nhiều bảng kết quả:

1. **RLS Status Check**: Kiểm tra RLS có được enable không
2. **profile_posts RLS Policy**: Chi tiết policy trên `profile_posts`
3. **All RLS Policies**: Tất cả policies trong hệ thống
4. **RLS Policy Detail**: Chi tiết logic của policy
5. **profiles_tracked RLS Policies**: Policies trên `profiles_tracked`
6. **user_post_interactions RLS Policies**: Policies trên `user_post_interactions`
7. **RLS Test**: Test queries (chỉ chạy nếu đã authenticate)
8. **Summary**: Tổng hợp số lượng policies

---

## ✅ Kết quả mong đợi

### 1. RLS Status Check

Tất cả bảng quan trọng phải có `rls_enabled = true`:
- ✅ `profiles_tracked`: `true`
- ✅ `profile_posts`: `true`
- ✅ `user_post_interactions`: `true`
- ✅ `user_profiles`: `true`
- ✅ `categories`: `true`

### 2. profile_posts RLS Policy

**Expected Result**:
```
policyname: "Users view posts from tracked profiles"
command: SELECT
policy_condition: EXISTS (SELECT 1 FROM profiles_tracked pt WHERE pt.id = profile_posts.profile_id AND pt.user_id = auth.uid())
```

**✅ PASS nếu**: Policy tồn tại và condition đúng logic

**❌ FAIL nếu**: 
- Policy không tồn tại
- Condition không check `pt.user_id = auth.uid()`

### 3. profiles_tracked RLS Policies

**Expected Policies**:
- `"Users can manage their own tracked profiles"` (ALL operations)
- `"Profiles access policy"` (ALL operations với admin support)

### 4. user_post_interactions RLS Policies

**Expected Policy**:
- `"Users manage own interactions"` (ALL operations)
- Condition: `auth.uid() = user_id`

---

## 🔍 Verification Checklist

Sau khi chạy script, verify các điểm sau:

- [ ] **RLS enabled**: Tất cả bảng quan trọng có `rls_enabled = true`
- [ ] **profile_posts policy**: Policy `"Users view posts from tracked profiles"` tồn tại
- [ ] **Policy logic**: Condition chứa `pt.user_id = auth.uid()`
- [ ] **profiles_tracked policies**: Có policies để user chỉ quản lý profiles của chính họ
- [ ] **user_post_interactions policies**: Có policy để user chỉ quản lý interactions của chính họ

---

## ⚠️ Lưu ý quan trọng

### 1. Test Queries (Section 7)

Các test queries trong section 7 sẽ chạy với quyền của user hiện tại:
- **Nếu chạy với Service Role Key**: Sẽ bypass RLS (không test được)
- **Nếu chạy với Anon Key + authenticated user**: RLS sẽ enforce (test đúng)

**Khuyến nghị**: Chạy test queries từ client-side (đã authenticate) để verify RLS hoạt động đúng.

### 2. Script chỉ để VERIFY

Script này **KHÔNG thay đổi database**, chỉ để kiểm tra và verify. An toàn chạy nhiều lần.

### 3. Nếu thiếu Policy

Nếu script báo thiếu policy, cần chạy:
- `SQL_MODULE_4_SHARED_SCRAPING.sql` - Để tạo RLS policy cho `profile_posts`

---

## 📊 Kết quả mẫu

### ✅ PASS Example:

```
check_type: profile_posts RLS Policy
policyname: Users view posts from tracked profiles
command: SELECT
policy_condition: EXISTS (SELECT 1 FROM profiles_tracked pt WHERE pt.id = profile_posts.profile_id AND pt.user_id = auth.uid())
```

### ❌ FAIL Example:

```
check_type: profile_posts RLS Policy
policyname: (null hoặc policy khác)
```

---

## 🔧 Troubleshooting

### Nếu RLS không được enable:

```sql
-- Enable RLS trên profile_posts
ALTER TABLE public.profile_posts ENABLE ROW LEVEL SECURITY;
```

### Nếu thiếu policy:

Chạy `SQL_MODULE_4_SHARED_SCRAPING.sql` để tạo policy.

### Nếu policy sai logic:

Cần drop và tạo lại policy với logic đúng (xem `SQL_MODULE_4_SHARED_SCRAPING.sql`).

---

**📅 Last Updated**: 2024-01-02  
**Version**: 1.0.0

