-- ============================================
-- SQL Script: Verification RLS Policies (Simple Version)
-- ============================================
-- Mục đích: Kiểm tra và verify RLS policies trong hệ thống
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
    'api_key_pool'
  )
ORDER BY tablename;

-- ============================================
-- 2. KIỂM TRA RLS POLICY TRÊN profile_posts
-- ============================================
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

-- ============================================
-- 3. VERIFY RLS POLICY LOGIC CHO profile_posts
-- ============================================
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

-- ============================================
-- 4. KIỂM TRA RLS POLICIES TRÊN profiles_tracked
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

-- ============================================
-- 5. KIỂM TRA RLS POLICIES TRÊN user_post_interactions
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

-- ============================================
-- 6. SUMMARY: TỔNG HỢP KẾT QUẢ
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

