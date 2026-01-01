# 📋 SQL REQUIREMENTS - Các lệnh SQL cần thực hiện thủ công

> **Mục đích**: File này chứa các lệnh SQL cần được thực hiện thủ công trong Supabase SQL Editor để tạo bảng `user_profiles` và thiết lập trigger tự động.

---

## ⚠️ LƯU Ý QUAN TRỌNG

- **KHÔNG** chạy các lệnh SQL này trừ khi bạn hiểu rõ tác động của chúng
- **SAO LƯU** database trước khi chạy các lệnh migration
- Chạy từng lệnh một và kiểm tra kết quả
- Nếu có lỗi, dừng lại và kiểm tra

---

## 1. Tạo bảng `user_profiles` (Bắt buộc)

### Mô tả
Tạo bảng `user_profiles` để lưu trữ thông tin membership và role của user. Đây là **Single Source of Truth** cho membership và role, thay thế hoàn toàn `user_metadata`.

### Lệnh SQL

```sql
-- 1. Tạo bảng user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  role text DEFAULT 'user', -- 'user' hoặc 'admin'
  is_premium boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tạo index cho email để tối ưu query
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 3. Tạo index cho role để tối ưu admin queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 4. Bật Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policy: User chỉ thấy profile của chính họ
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- 5b. Function để check admin role (tránh circular dependency trong policy)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5c. Policy: Admin thấy tất cả profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (public.is_admin_user());

-- 6. Policy: User chỉ update profile của chính họ (nhưng không được update role)
CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
);

-- 6b. Policy: Admin có thể update tất cả profiles
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
FOR UPDATE USING (public.is_admin_user());

-- 7. Trigger tự động tạo profile khi có user mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, is_premium, locale)
  VALUES (new.id, new.email, 'user', false, 'en')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Xóa trigger cũ nếu có và tạo mới
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Migration: Tạo profiles cho các users hiện có (nếu chưa có)
-- Lưu ý: Migration này sẽ migrate is_premium từ user_metadata (nếu có)
INSERT INTO public.user_profiles (id, email, role, is_premium)
SELECT 
  id,
  email,
  'user' as role,
  COALESCE((raw_user_meta_data->>'is_premium')::boolean, false) as is_premium
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;
```

### Giải thích

1. **Bảng `user_profiles`**:
   - `id`: Primary key, reference đến `auth.users(id)`
   - `email`: Email của user (để dễ query)
   - `role`: 'user' hoặc 'admin' (default: 'user')
   - `is_premium`: Premium status (default: false)
   - `updated_at`: Timestamp tự động cập nhật

2. **Indexes**: Tối ưu query theo email và role

3. **RLS Policies**:
   - User chỉ thấy/update profile của chính họ
   - Admin thấy/update tất cả profiles (sử dụng function `is_admin_user()` để tránh circular dependency)

4. **Trigger**: Tự động tạo profile khi user mới đăng ký

5. **Migration**: Tạo profiles cho users hiện có và migrate `is_premium` từ metadata (nếu có)

### ⚠️ Lưu ý về Policy

Policy "Admins can view all profiles" sử dụng function `is_admin_user()` để tránh circular dependency. Function này được đánh dấu `SECURITY DEFINER` để có quyền đọc `user_profiles` trong policy check.

---

## 2. Set Admin Role cho User

### Cách thực hiện

Sau khi chạy SQL script trên, set admin role cho user:

```sql
-- Set admin role cho user (thay YOUR_USER_ID bằng UUID của user)
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID'::uuid;

-- Hoặc set theo email
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

### Cách lấy User ID

```sql
-- Xem danh sách users và emails
SELECT id, email, role, is_premium 
FROM public.user_profiles
ORDER BY updated_at DESC;
```

---

## ✅ CHECKLIST

Sau khi hoàn thành:

- [ ] Đã chạy SQL script tạo bảng `user_profiles`
- [ ] Đã verify trigger hoạt động (tạo user mới → check có profile tự động)
- [ ] Đã set `role = 'admin'` cho ít nhất 1 user
- [ ] Đã test truy cập `/admin` với user admin → thành công
- [ ] Đã test truy cập `/admin` với user thường → bị chặn/redirect
- [ ] Đã verify migration: Users hiện có đã có profile trong `user_profiles`

---

## 📝 GHI CHÚ QUAN TRỌNG

- **Bảng `user_profiles` là Single Source of Truth** cho membership và role
- **KHÔNG** còn dùng `user_metadata` cho role và is_premium
- Code sẽ query từ `user_profiles` thay vì `user_metadata`
- Webhook Lemon Squeezy sẽ update `user_profiles.is_premium` thay vì metadata
- Function `is_admin_user()` được dùng trong policies để tránh circular dependency

---

## 🔄 Migration từ Metadata sang user_profiles

Nếu bạn đã có data trong `user_metadata`, script migration ở bước 9 sẽ tự động migrate `is_premium`. 

**Lưu ý**: Role phải được set thủ công vì không có trong metadata cũ.

---

**📅 Last Updated**: 2024-12-19
**Version**: 2.0.0 (Updated to use user_profiles table)

---

## 3. Bổ sung cột cho profiles_tracked (v3.2) ⚠️ CẦN CHẠY

### Mô tả
Bổ sung các cột còn thiếu trong bảng `profiles_tracked` để hỗ trợ đầy đủ tính năng v3.2:
- `category`: Phân loại profile
- `notes`: Ghi chú cá nhân
- `rss_url`: URL RSS feed
- `has_new_update`: Flag cho AI updates
- `is_in_feed`: Flag cho Newsfeed
- `updated_at`: Timestamp tự động cập nhật

### Lệnh SQL

Xem file `SQL_UPDATE_V3.2.md` để có đầy đủ các lệnh SQL cần chạy.

**Tóm tắt nhanh**:
```sql
-- Thêm các cột còn thiếu
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS category TEXT NULL DEFAULT 'General',
ADD COLUMN IF NOT EXISTS notes TEXT NULL,
ADD COLUMN IF NOT EXISTS rss_url TEXT NULL,
ADD COLUMN IF NOT EXISTS has_new_update BOOLEAN NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_in_feed BOOLEAN NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Tạo trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_profiles_tracked_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_tracked_updated_at ON public.profiles_tracked;
CREATE TRIGGER update_profiles_tracked_updated_at
  BEFORE UPDATE ON public.profiles_tracked
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_tracked_updated_at();

-- Đảm bảo RLS Policy UPDATE tồn tại
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles_tracked;
CREATE POLICY "Users can update their own profiles"
  ON public.profiles_tracked
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### ⚠️ QUAN TRỌNG
- Chạy các lệnh này trong Supabase SQL Editor
- Kiểm tra từng lệnh một
- Nếu cột đã tồn tại, lệnh `ADD COLUMN IF NOT EXISTS` sẽ không làm gì (an toàn)