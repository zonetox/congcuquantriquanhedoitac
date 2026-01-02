-- ============================================
-- SQL Script: Tổng hợp tất cả Modules
-- ============================================
-- Mục đích: Chạy tất cả SQL scripts cần thiết cho toàn bộ hệ thống
-- ⚠️ QUAN TRỌNG: Chạy các scripts theo thứ tự sau

-- ============================================
-- THỨ TỰ CHẠY SQL SCRIPTS:
-- ============================================
-- 1. SQL_MODULE_3_SMART_TRIGGER.sql (Module 3 - Notifications)
-- 2. SQL_MODULE_3_ENHANCEMENTS.sql (Module 3 - History, Monitoring)
-- 3. SQL_FIX_SECURITY_ISSUES.sql (Security fixes)
-- 4. SQL_SCRAPER_AND_AI_V2.sql (Scraper Engine & AI Intent v2) ⬅️ MỚI
-- 5. SQL_ADD_LOCALE_TO_USER_PROFILES.sql (i18n support)

-- ============================================
-- LƯU Ý:
-- ============================================
-- - Mỗi script đã có "IF NOT EXISTS" nên an toàn chạy nhiều lần
-- - Nếu đã chạy script trước đó, có thể bỏ qua
-- - Kiểm tra kết quả sau mỗi script

-- ============================================
-- VERIFY: Kiểm tra tất cả indexes và constraints
-- ============================================

-- Kiểm tra indexes cho profile_posts
SELECT 
  'profile_posts indexes' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profile_posts'
ORDER BY indexname;

-- Kiểm tra unique constraints
SELECT
  'profile_posts constraints' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'public.profile_posts'::regclass
  AND contype = 'u'
ORDER BY conname;

-- Kiểm tra functions
SELECT
  'helper functions' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_intent_score', 'get_signal')
ORDER BY routine_name;

-- ✅ Hoàn thành kiểm tra!

