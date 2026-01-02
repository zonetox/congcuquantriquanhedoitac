# 📋 Hướng dẫn chạy SQL Script cho Scraper Engine & AI Intent v2

## ⚠️ QUAN TRỌNG

File SQL này cần thiết để:
1. **Tránh duplicate posts** khi scraper chạy nhiều lần
2. **Tối ưu performance** cho queries filter theo `intent_score` và `signal`
3. **Tối ưu weekly sales opportunities** queries

---

## 📝 File SQL cần chạy

**File**: `SQL_SCRAPER_AND_AI_V2.sql`

---

## 🚀 Cách chạy

### Bước 1: Mở Supabase SQL Editor

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor** ở sidebar bên trái
4. Click **New query**

### Bước 2: Copy và chạy SQL Script

1. Mở file `SQL_SCRAPER_AND_AI_V2.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Click **Run** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Bước 3: Kiểm tra kết quả

Sau khi chạy, bạn sẽ thấy:
- ✅ **NOTICE**: "Created unique constraint: profile_posts_post_url_profile_unique"
- ✅ **NOTICE**: "Constraint already exists" (nếu đã chạy trước đó)
- ✅ Danh sách indexes đã được tạo

---

## 📊 Nội dung SQL Script

### 1. Unique Constraint
```sql
CREATE UNIQUE INDEX profile_posts_post_url_profile_unique
ON public.profile_posts(profile_id, post_url)
WHERE post_url IS NOT NULL;
```
**Mục đích**: Tránh duplicate posts khi scraper chạy nhiều lần

### 2. GIN Index cho JSONB
```sql
CREATE INDEX IF NOT EXISTS idx_profile_posts_ai_analysis_gin
ON public.profile_posts USING GIN (ai_analysis)
WHERE ai_analysis IS NOT NULL;
```
**Mục đích**: Tối ưu query filter theo `intent_score`, `signal`, `keywords` trong JSONB

### 3. Index cho Published At
```sql
CREATE INDEX IF NOT EXISTS idx_profile_posts_published_at
ON public.profile_posts(published_at DESC NULLS LAST)
WHERE published_at IS NOT NULL;
```
**Mục đích**: Tối ưu weekly sales opportunities query (7 ngày qua)

### 4. Helper Functions
```sql
CREATE OR REPLACE FUNCTION public.get_intent_score(analysis JSONB)
CREATE OR REPLACE FUNCTION public.get_signal(analysis JSONB)
```
**Mục đích**: Extract `intent_score` và `signal` từ JSONB để filter và sort

### 5. Indexes cho Intent Score
```sql
CREATE INDEX IF NOT EXISTS idx_profile_posts_intent_score
ON public.profile_posts(public.get_intent_score(ai_analysis) DESC)
WHERE ai_analysis IS NOT NULL AND public.get_intent_score(ai_analysis) > 70;
```
**Mục đích**: Tối ưu filter "Chỉ xem Cơ hội bán hàng" (intent_score > 70)

---

## ✅ Checklist

Sau khi chạy SQL script, kiểm tra:

- [ ] Unique constraint đã được tạo: `profile_posts_post_url_profile_unique`
- [ ] GIN index đã được tạo: `idx_profile_posts_ai_analysis_gin`
- [ ] Index cho published_at: `idx_profile_posts_published_at`
- [ ] Index cho intent_score: `idx_profile_posts_intent_score`
- [ ] Index cho sales opportunity: `idx_profile_posts_sales_opportunity`
- [ ] Helper functions đã được tạo: `get_intent_score()`, `get_signal()`

---

## 🔍 Kiểm tra Indexes

Chạy query sau để xem tất cả indexes:

```sql
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profile_posts'
ORDER BY indexname;
```

---

## ⚠️ Lưu ý

1. **Unique Constraint**: Nếu đã có posts duplicate, constraint sẽ fail. Cần cleanup trước:
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

2. **Performance**: Indexes sẽ tăng tốc queries nhưng có thể làm chậm INSERT một chút. Đây là trade-off hợp lý.

3. **JSONB Queries**: Với GIN index, queries filter theo `intent_score` và `signal` sẽ nhanh hơn đáng kể.

---

## 🎯 Kết quả mong đợi

Sau khi chạy SQL script:
- ✅ Scraper không tạo duplicate posts
- ✅ Filter "Chỉ xem Cơ hội bán hàng" chạy nhanh
- ✅ Weekly sales opportunities query tối ưu
- ✅ Export reports nhanh hơn

---

## 📝 Lưu ý bổ sung

- Script sử dụng `IF NOT EXISTS` nên an toàn chạy nhiều lần
- Nếu gặp lỗi, kiểm tra logs trong Supabase SQL Editor
- Có thể rollback bằng cách drop indexes (nhưng không nên làm trừ khi cần)

