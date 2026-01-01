-- ============================================
-- SQL REMOVE OLD COLUMNS - Xóa cột cũ không dùng
-- ============================================
-- Mục đích: Xóa cột is_active và error_count, chỉ dùng status
-- Chạy file này trong Supabase SQL Editor

-- ============================================
-- 1. Verify dữ liệu đã được migrate sang status
-- ============================================
-- Kiểm tra xem có records nào có is_active != status không
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = true AND status != 'active' THEN 1 END) as mismatched_active,
  COUNT(CASE WHEN is_active = false AND status = 'active' THEN 1 END) as mismatched_inactive
FROM public.api_key_pool;

-- Nếu có mismatched records, chạy migration trước:
UPDATE public.api_key_pool
SET status = CASE 
  WHEN is_active = true THEN 'active'
  ELSE 'rate_limited'
END
WHERE (is_active = true AND status != 'active') 
   OR (is_active = false AND status = 'active');

-- ============================================
-- 2. Xóa cột is_active
-- ============================================
ALTER TABLE public.api_key_pool 
DROP COLUMN IF EXISTS is_active;

-- ============================================
-- 3. Xóa cột error_count (không dùng nữa)
-- ============================================
ALTER TABLE public.api_key_pool 
DROP COLUMN IF EXISTS error_count;

-- ============================================
-- 4. Verify schema cuối cùng
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'api_key_pool'
ORDER BY ordinal_position;

-- ============================================
-- ✅ HOÀN THÀNH
-- ============================================
-- Schema cuối cùng chỉ có:
-- ✅ id, provider, api_key, status, quota_limit, current_usage, last_used_at, created_at
-- ❌ Đã xóa: is_active, error_count

