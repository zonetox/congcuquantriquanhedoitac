-- =====================================================
-- VERIFICATION QUERIES - Module 4.1 Shared Scraping
-- =====================================================
-- Chạy các queries này để verify migration đã thành công

-- 1. Kiểm tra bảng user_post_interactions đã được tạo
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_post_interactions'
ORDER BY ordinal_position;

-- 2. Kiểm tra profiles_tracked có cột last_synced_at
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles_tracked' 
  AND column_name = 'last_synced_at';

-- 3. Kiểm tra profile_posts KHÔNG còn user_id
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profile_posts' 
  AND column_name = 'user_id';
-- Kết quả phải = 0 rows (không có cột user_id)

-- 4. Kiểm tra RLS Policy mới đã được tạo
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profile_posts'
  AND policyname = 'Users view posts from tracked profiles';

-- 5. Kiểm tra RLS Policy cũ đã bị xóa
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename = 'profile_posts'
  AND policyname = 'Users view own posts';
-- Kết quả phải = 0 rows (policy cũ đã bị xóa)

-- 6. Kiểm tra indexes đã bị xóa (không còn indexes trên user_id)
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profile_posts'
  AND indexdef LIKE '%user_id%';
-- Kết quả phải = 0 rows (không còn indexes trên user_id)

-- 7. Kiểm tra function ensure_user_post_interaction đã được tạo
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'ensure_user_post_interaction';

-- 8. Kiểm tra function update_profile_last_synced_at đã được tạo
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_profile_last_synced_at';

-- 9. Kiểm tra số lượng posts hiện có (để test sau này)
SELECT COUNT(*) as total_posts FROM public.profile_posts;

-- 10. Kiểm tra số lượng profiles hiện có
SELECT COUNT(*) as total_profiles FROM public.profiles_tracked;

