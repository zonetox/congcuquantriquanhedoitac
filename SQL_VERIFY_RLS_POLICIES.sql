-- ============================================
-- SQL Script: Verification RLS Policies
-- ============================================
-- Mục đích: Kiểm tra và verify tất cả RLS policies trong hệ thống
-- Đặc biệt: Verify RLS policy trên profile_posts đảm bảo User chỉ thấy posts từ profiles họ follow
-- 
-- ⚠️ QUAN TRỌNG: Script này chỉ để VERIFY, không thay đổi database
-- ============================================

-- ============================================
-- 1. KIỂM TRA RLS CÓ ĐƯỢC ENABLE KHÔNG
-- ============================================
SELECT 
  'RLS Status Check' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles_tracked',
    'profile_posts',
    'user_post_interactions',
    'user_profiles',
    'categories',
    'api_key_pool',
    'admin_logs',
    'telegram_rate_limits',
    'ai_usage_logs',
    'notification_history'
  )
ORDER BY tablename;

-- ============================================
-- 2. KIỂM TRA RLS POLICY TRÊN profile_posts
-- ============================================
-- ⭐ QUAN TRỌNG: Policy này đảm bảo User chỉ thấy posts từ profiles họ follow

SELECT 
  'profile_posts RLS Policy' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profile_posts'
ORDER BY policyname;

-- Expected Result:
-- Policy name: "Users view posts from tracked profiles"
-- Command: SELECT
-- Condition: EXISTS (SELECT 1 FROM profiles_tracked pt WHERE pt.id = profile_posts.profile_id AND pt.user_id = auth.uid())

-- ============================================
-- 3. KIỂM TRA TẤT CẢ RLS POLICIES TRONG HỆ THỐNG
-- ============================================
SELECT 
  'All RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read access'
    WHEN cmd = 'INSERT' THEN 'Create access'
    WHEN cmd = 'UPDATE' THEN 'Update access'
    WHEN cmd = 'DELETE' THEN 'Delete access'
    WHEN cmd = 'ALL' THEN 'All operations'
    ELSE cmd
  END as access_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 4. VERIFY RLS POLICY LOGIC CHO profile_posts
-- ============================================
-- Kiểm tra chi tiết policy condition

SELECT 
  'RLS Policy Detail' as check_type,
  p.polname as policyname,
  p.polcmd::text as cmd,
  pg_get_expr(p.polqual, p.polrelid) as using_expression,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check_expression
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profile_posts'
  AND p.polname = 'Users view posts from tracked profiles';

-- Expected: using_expression should contain:
-- EXISTS (SELECT 1 FROM profiles_tracked pt WHERE pt.id = profile_posts.profile_id AND pt.user_id = auth.uid())

-- ============================================
-- 5. KIỂM TRA RLS POLICIES TRÊN profiles_tracked
-- ============================================
SELECT 
  'profiles_tracked RLS Policies' as check_type,
  policyname,
  cmd as command,
  qual as policy_condition
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles_tracked'
ORDER BY cmd, policyname;

-- Expected Policies:
-- - "Users can manage their own tracked profiles" (ALL operations)
-- - "Profiles access policy" (ALL operations với admin support)

-- ============================================
-- 6. KIỂM TRA RLS POLICIES TRÊN user_post_interactions
-- ============================================
SELECT 
  'user_post_interactions RLS Policies' as check_type,
  policyname,
  cmd as command,
  qual as policy_condition
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_post_interactions'
ORDER BY cmd, policyname;

-- Expected Policy:
-- - "Users manage own interactions" (ALL operations)
-- - Condition: auth.uid() = user_id

-- ============================================
-- 7. TEST QUERY: VERIFY RLS HOẠT ĐỘNG ĐÚNG
-- ============================================
-- ⚠️ LƯU Ý: Query này sẽ chạy với quyền của user hiện tại
-- Nếu chạy với Service Role Key, sẽ bypass RLS
-- Nếu chạy với Anon Key + authenticated user, RLS sẽ enforce

-- Test 1: Đếm số posts user hiện tại có thể thấy
-- (Chỉ chạy nếu đã authenticate)
SELECT 
  'RLS Test - Post Count' as check_type,
  COUNT(*) as visible_posts_count,
  COUNT(DISTINCT profile_id) as visible_profiles_count
FROM profile_posts;

-- Test 2: Kiem tra posts co thuoc ve profiles ma user dang follow khong
-- (Chi chay neu da authenticate)
SELECT 
  'RLS Test - Post Ownership' as check_type,
  pp.id as post_id,
  pp.profile_id,
  pt.title as profile_title,
  pt.user_id as profile_owner_id,
  CASE 
    WHEN pt.user_id = auth.uid() THEN 'Owned by current user'
    ELSE 'NOT owned by current user'
  END as ownership_status
FROM profile_posts pp
LEFT JOIN profiles_tracked pt ON pt.id = pp.profile_id
LIMIT 10;

-- ============================================
-- 8. SUMMARY: TỔNG HỢP KẾT QUẢ
-- ============================================
SELECT 
  'Summary' as check_type,
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles_tracked',
    'profile_posts',
    'user_post_interactions',
    'user_profiles',
    'categories',
    'api_key_pool'
  )
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 9. VERIFICATION CHECKLIST
-- ============================================
-- PASS neu:
-- 1. RLS duoc enable tren tat ca bang quan trong
-- 2. profile_posts co policy "Users view posts from tracked profiles"
-- 3. Policy condition chua: EXISTS (SELECT 1 FROM profiles_tracked pt WHERE pt.id = profile_posts.profile_id AND pt.user_id = auth.uid())
-- 4. profiles_tracked co policies de user chi quan ly profiles cua chinh ho
-- 5. user_post_interactions co policy de user chi quan ly interactions cua chinh ho

-- FAIL neu:
-- 1. RLS khong duoc enable tren bang quan trong
-- 2. profile_posts khong co policy hoac policy sai logic
-- 3. Policy condition khong check user_id tu profiles_tracked

-- ============================================
-- END OF VERIFICATION SCRIPT
-- ============================================

