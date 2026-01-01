# 📋 SQL UPDATE V3.2 - Bổ sung cấu hình Supabase

> **Mục đích**: File này chứa các lệnh SQL cần chạy để đảm bảo database hỗ trợ đầy đủ các tính năng v3.2 (Category Tabs, Edit Profile, RSS Feed)

---

## ⚠️ LƯU Ý QUAN TRỌNG

- **SAO LƯU** database trước khi chạy các lệnh này
- Chạy từng lệnh một và kiểm tra kết quả
- Nếu có lỗi, dừng lại và kiểm tra

---

## 1. Kiểm tra Schema hiện tại

Trước tiên, hãy kiểm tra xem các cột đã có chưa:

```sql
-- Kiểm tra cấu trúc bảng profiles_tracked
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles_tracked'
ORDER BY ordinal_position;
```

---

## 2. Bổ sung các cột còn thiếu (nếu chưa có)

### 2.1. Thêm cột `category` (nếu chưa có)

```sql
-- Thêm cột category nếu chưa có
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS category TEXT NULL DEFAULT 'General';
```

### 2.2. Thêm cột `notes` (nếu chưa có)

```sql
-- Thêm cột notes nếu chưa có
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS notes TEXT NULL;
```

### 2.3. Thêm cột `rss_url` (nếu chưa có)

```sql
-- Thêm cột rss_url nếu chưa có
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS rss_url TEXT NULL;
```

### 2.4. Thêm cột `has_new_update` (nếu chưa có)

```sql
-- Thêm cột has_new_update nếu chưa có
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS has_new_update BOOLEAN NULL DEFAULT false;
```

### 2.5. Thêm cột `is_in_feed` (nếu chưa có) ⚠️ QUAN TRỌNG

```sql
-- Thêm cột is_in_feed nếu chưa có (cho tính năng Newsfeed)
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS is_in_feed BOOLEAN NULL DEFAULT false;
```

### 2.6. Thêm cột `updated_at` (nếu chưa có)

```sql
-- Thêm cột updated_at nếu chưa có
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Cập nhật giá trị updated_at cho các records cũ (nếu cần)
UPDATE public.profiles_tracked
SET updated_at = created_at
WHERE updated_at IS NULL;
```

---

## 3. Tạo Trigger tự động cập nhật `updated_at` (nếu chưa có)

```sql
-- Tạo function để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_profiles_tracked_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger (xóa trigger cũ nếu có)
DROP TRIGGER IF EXISTS update_profiles_tracked_updated_at ON public.profiles_tracked;

CREATE TRIGGER update_profiles_tracked_updated_at
  BEFORE UPDATE ON public.profiles_tracked
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_tracked_updated_at();
```

---

## 4. Kiểm tra và cập nhật RLS Policies

### 4.1. Kiểm tra RLS đã được bật

```sql
-- Kiểm tra RLS đã được bật chưa
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles_tracked';
```

Nếu `rowsecurity = false`, chạy:

```sql
-- Bật RLS
ALTER TABLE public.profiles_tracked ENABLE ROW LEVEL SECURITY;
```

### 4.2. Kiểm tra Policy UPDATE đã có chưa

```sql
-- Kiểm tra các policies hiện có
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles_tracked';
```

### 4.3. Tạo Policy UPDATE (nếu chưa có)

```sql
-- Xóa policy UPDATE cũ nếu có (nếu cần sửa)
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles_tracked;

-- Tạo policy UPDATE mới
CREATE POLICY "Users can update their own profiles"
  ON public.profiles_tracked
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. Tạo Index cho Category (tùy chọn, để tối ưu filter)

```sql
-- Tạo index cho category để tối ưu filter theo category
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_category 
ON public.profiles_tracked(category) 
WHERE category IS NOT NULL;

-- Tạo index cho is_in_feed để tối ưu query feed
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_is_in_feed 
ON public.profiles_tracked(user_id, is_in_feed) 
WHERE is_in_feed = true;
```

---

## 6. Kiểm tra lại Schema cuối cùng

Sau khi chạy tất cả các lệnh trên, kiểm tra lại:

```sql
-- Kiểm tra schema cuối cùng
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles_tracked'
ORDER BY ordinal_position;

-- Kết quả mong đợi:
-- id, user_id, url, title, rss_url, category, notes, has_new_update, is_in_feed, created_at, updated_at
```

---

## ✅ CHECKLIST

Sau khi chạy SQL:

- [x] Đã thêm tất cả các cột còn thiếu (category, notes, rss_url, has_new_update, is_in_feed, updated_at) ✅
- [ ] Đã tạo trigger tự động cập nhật updated_at (chạy `SQL_FINALIZE_V3.2.sql`)
- [x] Đã kiểm tra RLS đã được bật ✅
- [x] Đã kiểm tra Policy UPDATE - Policy "Users can manage their own tracked profiles" với `cmd = ALL` đã bao gồm UPDATE ✅
- [ ] Đã tạo indexes cho category và is_in_feed (chạy `SQL_FINALIZE_V3.2.sql` - tùy chọn)
- [x] Đã verify schema cuối cùng có đầy đủ các cột ✅

---

## 🔧 BƯỚC TIẾP THEO - Chạy SQL_FINALIZE_V3.2.sql

Sau khi đã thêm các cột, chạy file `SQL_FINALIZE_V3.2.sql` để:
1. Tạo trigger tự động cập nhật `updated_at`
2. Cập nhật `updated_at` cho các records cũ (nếu có)
3. Tạo indexes để tối ưu performance
4. Verify tất cả cấu hình

---

## 📝 GHI CHÚ

- **RLS Policy UPDATE**: Đã có sẵn trong `supabase-schema.sql`, nhưng cần đảm bảo nó tồn tại trong database thực tế
- **Các cột mới**: Nếu database đã có các cột này, các lệnh `ADD COLUMN IF NOT EXISTS` sẽ không làm gì (an toàn)
- **Trigger updated_at**: Tự động cập nhật `updated_at` mỗi khi profile được update

---

**📅 Created**: 2024-12-19
**Version**: 3.2.0

