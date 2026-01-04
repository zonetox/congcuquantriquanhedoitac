# 🔍 DATABASE VERIFICATION GUIDE

## Mục đích
File này hướng dẫn kiểm tra và đảm bảo tất cả các columns và tables cần thiết đã có trong database.

---

## ✅ SQL Scripts Cần Chạy

### 1. **SQL_VERIFY_AND_COMPLETE_DATABASE.sql** (QUAN TRỌNG NHẤT)

**Mục đích**: Kiểm tra và thêm tất cả các columns còn thiếu vào database.

**Các columns được verify/added**:

#### `user_profiles` table:
- ✅ `locale` - Language preference (en, vi, es, fr, de, ja, zh)
- ✅ `trial_started_at` - Ngày bắt đầu trial (15 ngày)

#### `profiles_tracked` table:
- ✅ `last_contacted_at` - Thời gian liên hệ cuối cùng (Interaction Clock)
- ✅ `last_synced_at` - Thời gian sync cuối cùng (Shared Scraping)
- ✅ `last_interacted_at` - Ngày tương tác cuối cùng (CRM)
- ✅ `relationship_score` - Điểm sức khỏe mối quan hệ (CRM)
- ✅ `notify_telegram_chat_id` - Telegram Chat ID (Module 3)
- ✅ `notify_on_sales_opportunity` - Cảnh báo Sales Opportunity (Module 3)
- ✅ `is_in_feed` - Hiển thị trên Newsfeed (v3.2)
- ✅ `category` - Phân loại profile
- ✅ `notes` - Ghi chú cá nhân
- ✅ `has_new_update` - Flag update mới
- ✅ `rss_url` - Link RSS

**Cách chạy**:
1. Mở Supabase SQL Editor
2. Copy toàn bộ nội dung file `SQL_VERIFY_AND_COMPLETE_DATABASE.sql`
3. Paste vào SQL Editor
4. Click "Run" hoặc nhấn Ctrl+Enter
5. Kiểm tra kết quả trong "Messages" tab

**Lưu ý**: Script này sử dụng `IF NOT EXISTS` nên an toàn để chạy nhiều lần. Nó sẽ chỉ thêm columns nếu chưa tồn tại.

---

## 📋 Checklist Verification

Sau khi chạy SQL script, hãy verify các items sau:

### 1. Verify Columns trong `user_profiles`

**Cách 1: Chạy từ file SQL (Khuyến nghị)**
- Mở file `SQL_VERIFICATION_QUERIES.sql` và chạy query số 1

**Cách 2: Copy query dưới đây (chú ý copy đầy đủ, không thiếu ký tự)**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;
```

**Kết quả mong đợi**: Phải có các columns:
- `id` (uuid)
- `email` (text)
- `role` (text)
- `is_premium` (boolean)
- `trial_started_at` (timestamp with time zone)
- `locale` (text) ✅ **QUAN TRỌNG**
- `updated_at` (timestamp with time zone)

### 2. Verify Columns trong `profiles_tracked`

**Cách 1: Chạy từ file SQL (Khuyến nghị)**
- Mở file `SQL_VERIFICATION_QUERIES.sql` và chạy query số 2

**Cách 2: Copy query dưới đây (chú ý copy đầy đủ, không thiếu ký tự)**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles_tracked'
ORDER BY ordinal_position;
```

**Kết quả mong đợi**: Phải có các columns:
- `id` (uuid)
- `user_id` (uuid)
- `title` (text)
- `url` (text)
- `rss_url` (text, nullable)
- `category` (text, nullable)
- `notes` (text, nullable)
- `has_new_update` (boolean, nullable)
- `is_in_feed` (boolean, nullable)
- `last_interacted_at` (timestamp with time zone, nullable)
- `relationship_score` (integer, nullable)
- `last_contacted_at` (timestamp with time zone, nullable) ✅ **QUAN TRỌNG**
- `notify_telegram_chat_id` (text, nullable)
- `notify_on_sales_opportunity` (boolean, nullable)
- `last_synced_at` (timestamp with time zone, nullable) ✅ **QUAN TRỌNG**
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone, nullable)

### 3. Verify Indexes

**Cách 1: Chạy từ file SQL (Khuyến nghị)**
- Mở file `SQL_VERIFICATION_QUERIES.sql` và chạy query số 3

**Cách 2: Copy query dưới đây (chú ý copy đầy đủ, không thiếu ký tự)**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('user_profiles', 'profiles_tracked')
AND schemaname = 'public'
ORDER BY tablename, indexname;
```

**Kết quả mong đợi**: Phải có các indexes:
- `idx_user_profiles_locale` ✅
- `idx_profiles_tracked_last_contacted_at` ✅
- `idx_profiles_tracked_last_synced_at` ✅
- `idx_profiles_tracked_last_interacted_at` ✅
- `idx_profiles_tracked_relationship_score` ✅
- `idx_profiles_tracked_category` ✅
- `idx_profiles_tracked_is_in_feed` ✅

### 4. Verify RLS Policies

**Cách 1: Chạy từ file SQL (Khuyến nghị)**
- Mở file `SQL_VERIFICATION_QUERIES.sql` và chạy query số 4

**Cách 2: Copy query dưới đây (chú ý copy đầy đủ, không thiếu ký tự)**

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'profiles_tracked')
ORDER BY tablename, policyname;
```

---

## ⚡ QUICK VERIFICATION (Khuyến nghị)

**Cách nhanh nhất**: Mở file `SQL_VERIFICATION_QUERIES.sql` và chạy query số 5 (Quick Check) để kiểm tra nhanh các columns quan trọng có tồn tại không.

**Kết quả mong đợi**: Phải có policies cho cả SELECT, INSERT, UPDATE, DELETE.

---

## 🔧 Các SQL Scripts Khác (Đã có sẵn)

Nếu cần, bạn có thể chạy thêm các scripts sau:

### 2. SQL_ADD_LOCALE_TO_USER_PROFILES.sql
- **Mục đích**: Thêm column `locale` vào `user_profiles`
- **Status**: ✅ Đã được tích hợp vào `SQL_VERIFY_AND_COMPLETE_DATABASE.sql`

### 3. SQL_AI_RADAR_AND_INTERACTION_CLOCK.sql
- **Mục đích**: Thêm column `last_contacted_at` vào `profiles_tracked`
- **Status**: ✅ Đã được tích hợp vào `SQL_VERIFY_AND_COMPLETE_DATABASE.sql`

### 4. SQL_MODULE_4_SHARED_SCRAPING.sql
- **Mục đích**: Thêm column `last_synced_at` và tạo bảng `user_post_interactions`
- **Status**: ⚠️ Cần chạy riêng nếu chưa chạy (không được tích hợp vào script tổng hợp)

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup Database**: Luôn backup database trước khi chạy migration scripts
2. **Chạy từng script**: Chạy từng script một và kiểm tra kết quả
3. **Kiểm tra logs**: Xem "Messages" tab trong Supabase SQL Editor để biết script đã chạy thành công hay có lỗi
4. **Test sau khi chạy**: Sau khi chạy script, test các tính năng liên quan:
   - UserMenu: Thay đổi ngôn ngữ
   - FeedContent: Click "Copy Ice Breaker" để test `last_contacted_at`
   - Sync Feed: Test `last_synced_at` hoạt động đúng

---

## ✅ Sau Khi Hoàn Thành

Sau khi chạy `SQL_VERIFY_AND_COMPLETE_DATABASE.sql`, tất cả các columns cần thiết đã được verify/added. Bạn có thể:

1. ✅ Sử dụng UserMenu để thay đổi ngôn ngữ (sử dụng `user_profiles.locale`)
2. ✅ Click "Copy Ice Breaker" trong FeedContent (sử dụng `profiles_tracked.last_contacted_at`)
3. ✅ Sync Feed (sử dụng `profiles_tracked.last_synced_at`)
4. ✅ Tất cả các tính năng khác đã hoạt động với database đầy đủ

---

## 📞 Hỗ Trợ

Nếu gặp lỗi khi chạy SQL scripts:
1. Kiểm tra error message trong "Messages" tab
2. Verify xem column đã tồn tại chưa bằng queries ở trên
3. Kiểm tra RLS policies có đúng không
4. Kiểm tra indexes có được tạo không

---

**Cập nhật lần cuối**: 2024
**Version**: 1.0

