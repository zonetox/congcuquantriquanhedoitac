# 📊 Báo cáo SQL Scripts cho các tính năng vừa triển khai

## ✅ Đã tạo SQL Scripts

### 1. SQL_SCRAPER_AND_AI_V2.sql ⭐ MỚI

**Mục đích**: Tối ưu database cho Scraper Engine và AI Intent v2

**Nội dung**:
- ✅ **Unique Constraint**: `profile_posts_post_url_profile_unique` trên `(profile_id, post_url)`
  - Tránh duplicate posts khi scraper chạy nhiều lần
  - Chỉ áp dụng khi `post_url IS NOT NULL`
  
- ✅ **GIN Index**: `idx_profile_posts_ai_analysis_gin` trên `ai_analysis` JSONB
  - Tối ưu query filter theo `intent_score`, `signal`, `keywords`
  - Hỗ trợ JSONB queries nhanh hơn
  
- ✅ **Index cho Published At**: `idx_profile_posts_published_at`
  - Tối ưu weekly sales opportunities query (7 ngày qua)
  
- ✅ **Composite Index**: `idx_profile_posts_user_published_ai`
  - Tối ưu query weekly sales opportunities với AI filter
  
- ✅ **Index cho Intent Score**: `idx_profile_posts_intent_score`
  - Tối ưu filter "Chỉ xem Cơ hội bán hàng" (intent_score > 70)
  
- ✅ **Index cho Sales Opportunity**: `idx_profile_posts_sales_opportunity`
  - Tối ưu filter signal = "Cơ hội bán hàng"
  
- ✅ **Helper Functions**:
  - `get_intent_score(analysis JSONB)`: Extract intent_score từ JSONB
  - `get_signal(analysis JSONB)`: Extract signal từ JSONB

---

## 📋 Checklist SQL Scripts cần chạy

### Đã chạy trước đó (có thể bỏ qua nếu đã chạy):
- [ ] `SQL_MODULE_3_SMART_TRIGGER.sql` - Module 3 notifications
- [ ] `SQL_MODULE_3_ENHANCEMENTS.sql` - Module 3 history, monitoring
- [ ] `SQL_FIX_SECURITY_ISSUES.sql` - Security fixes
- [ ] `SQL_ADD_LOCALE_TO_USER_PROFILES.sql` - i18n support

### Cần chạy mới:
- [x] `SQL_SCRAPER_AND_AI_V2.sql` ⬅️ **QUAN TRỌNG**

---

## 🚀 Hướng dẫn chạy

### Bước 1: Mở Supabase SQL Editor
1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project
3. Vào **SQL Editor** → **New query**

### Bước 2: Chạy SQL Script
1. Mở file `SQL_SCRAPER_AND_AI_V2.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run**

### Bước 3: Kiểm tra kết quả
- ✅ Thấy NOTICE: "Created unique constraint"
- ✅ Thấy danh sách indexes đã được tạo
- ✅ Không có lỗi

---

## 🔍 Kiểm tra sau khi chạy

Chạy query sau để verify:

```sql
-- Kiểm tra unique constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profile_posts'::regclass
  AND conname = 'profile_posts_post_url_profile_unique';

-- Kiểm tra indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profile_posts'
  AND indexname LIKE '%profile_posts%'
ORDER BY indexname;

-- Kiểm tra functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_intent_score', 'get_signal');
```

---

## ⚠️ Lưu ý quan trọng

### 1. Unique Constraint
- Nếu đã có posts duplicate, cần cleanup trước:
  ```sql
  -- Xóa duplicate posts (giữ lại post mới nhất)
  DELETE FROM profile_posts
  WHERE id NOT IN (
    SELECT DISTINCT ON (profile_id, post_url) id
    FROM profile_posts
    WHERE post_url IS NOT NULL
    ORDER BY profile_id, post_url, created_at DESC
  );
  ```

### 2. Performance
- Indexes sẽ tăng tốc queries nhưng có thể làm chậm INSERT một chút
- Trade-off hợp lý vì queries nhiều hơn INSERT

### 3. JSONB Queries
- Với GIN index, queries filter theo `intent_score` và `signal` sẽ nhanh hơn đáng kể
- Helper functions giúp extract data từ JSONB dễ dàng hơn

---

## 📊 Database Schema Updates

### profile_posts table
- ✅ **Unique Constraint**: `(profile_id, post_url)` - Tránh duplicate
- ✅ **GIN Index**: `ai_analysis` - Tối ưu JSONB queries
- ✅ **Indexes**: `published_at`, `intent_score`, `signal` - Tối ưu filters

### Helper Functions
- ✅ `get_intent_score(JSONB)`: Extract intent_score (1-100)
- ✅ `get_signal(JSONB)`: Extract signal

---

## ✅ Kết quả mong đợi

Sau khi chạy SQL script:
- ✅ Scraper không tạo duplicate posts
- ✅ Filter "Chỉ xem Cơ hội bán hàng" chạy nhanh
- ✅ Weekly sales opportunities query tối ưu
- ✅ Export reports nhanh hơn
- ✅ Health score queries tối ưu

---

## 📝 Files đã tạo

1. **SQL_SCRAPER_AND_AI_V2.sql** - SQL script chính
2. **HUONG_DAN_SQL_SCRAPER_AI_V2.md** - Hướng dẫn chi tiết
3. **SQL_ALL_MODULES_COMPLETE.sql** - Tổng hợp tất cả scripts
4. **BAO_CAO_SQL_SCRIPTS.md** - Báo cáo này

---

## 🎯 Tóm tắt

**Cần chạy SQL script**: `SQL_SCRAPER_AND_AI_V2.sql`

**Lý do**:
- Tránh duplicate posts khi scraper chạy
- Tối ưu performance cho AI Intent v2 queries
- Tối ưu weekly sales opportunities export
- Tối ưu filter "Chỉ xem Cơ hội bán hàng"

**An toàn**: Script sử dụng `IF NOT EXISTS` nên an toàn chạy nhiều lần.

