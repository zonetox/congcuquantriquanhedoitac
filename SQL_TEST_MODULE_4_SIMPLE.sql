-- =====================================================
-- SIMPLE TEST - Module 4.1 Shared Scraping
-- =====================================================
-- Version đơn giản với SELECT queries để hiển thị kết quả dạng bảng
-- Phù hợp với Supabase SQL Editor

-- =====================================================
-- TEST 1: Database Structure Verification
-- =====================================================
SELECT 
  'Database Structure' as test_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_post_interactions'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as user_post_interactions_table,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles_tracked' AND column_name = 'last_synced_at'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as last_synced_at_column,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profile_posts' AND column_name = 'user_id'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as user_id_removed;

-- =====================================================
-- TEST 2: RLS Policies
-- =====================================================
SELECT 
  'RLS Policies' as test_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profile_posts' 
      AND policyname = 'Users view posts from tracked profiles'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as new_policy_exists,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profile_posts' 
      AND policyname = 'Users view own posts'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as old_policy_removed,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_post_interactions'
      AND policyname = 'Users manage own interactions'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as interactions_policy_exists;

-- =====================================================
-- TEST 3: Functions
-- =====================================================
SELECT 
  'Functions' as test_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = 'ensure_user_post_interaction'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as ensure_interaction_function,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = 'update_profile_last_synced_at'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as update_sync_function;

-- =====================================================
-- TEST 4: Indexes
-- =====================================================
SELECT 
  'Indexes' as test_category,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_post_interactions') as interactions_indexes_count,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'profiles_tracked'
      AND indexdef LIKE '%last_synced_at%'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as last_synced_at_index,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'profile_posts'
      AND indexdef LIKE '%user_id%'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as user_id_indexes_removed;

-- =====================================================
-- TEST 5: Data Summary
-- =====================================================
SELECT 
  'Data Summary' as test_category,
  (SELECT COUNT(*) FROM public.profiles_tracked) as total_profiles,
  (SELECT COUNT(*) FROM public.profiles_tracked WHERE is_in_feed = true) as profiles_in_feed,
  (SELECT COUNT(*) FROM public.profiles_tracked WHERE last_synced_at IS NOT NULL) as profiles_synced,
  (SELECT COUNT(*) FROM public.profile_posts) as total_posts,
  (SELECT COUNT(*) FROM public.user_post_interactions) as total_interactions;

-- =====================================================
-- TEST 6: Profiles Ready for Sync
-- =====================================================
SELECT 
  'Profiles Ready for Sync' as test_category,
  id,
  title,
  last_synced_at,
  CASE 
    WHEN last_synced_at IS NULL THEN '✅ Needs Sync (Never synced)'
    WHEN last_synced_at < now() - INTERVAL '1 hour' THEN '✅ Needs Sync (> 1 hour ago)'
    ELSE '⏸️ Skip Sync (< 1 hour ago)'
  END as sync_status
FROM public.profiles_tracked
WHERE is_in_feed = true
ORDER BY 
  CASE 
    WHEN last_synced_at IS NULL THEN 1
    WHEN last_synced_at < now() - INTERVAL '1 hour' THEN 2
    ELSE 3
  END,
  last_synced_at DESC NULLS FIRST;

-- =====================================================
-- TEST 7: Shared Posts (No user_id)
-- =====================================================
SELECT 
  'Shared Posts' as test_category,
  pp.id as post_id,
  pt.title as profile_title,
  LEFT(pp.content, 50) as content_preview,
  pp.published_at,
  CASE 
    WHEN pp.ai_analysis IS NOT NULL THEN '✅ Has AI Analysis'
    ELSE '⏸️ No AI Analysis'
  END as ai_status,
  CASE 
    WHEN pp.ai_analysis IS NOT NULL 
    AND (pp.ai_analysis->>'signal') = 'Cơ hội bán hàng' 
    THEN '🚨 Sales Opportunity'
    ELSE '📄 Regular Post'
  END as post_type
FROM public.profile_posts pp
JOIN public.profiles_tracked pt ON pt.id = pp.profile_id
ORDER BY pp.published_at DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- TEST 8: User Interactions (if any)
-- =====================================================
SELECT 
  'User Interactions' as test_category,
  u.email as user_email,
  pt.title as profile_title,
  LEFT(pp.content, 30) as post_preview,
  upi.is_read,
  upi.is_hidden,
  upi.created_at as interaction_date
FROM public.user_post_interactions upi
JOIN auth.users u ON u.id = upi.user_id
JOIN public.profile_posts pp ON pp.id = upi.post_id
JOIN public.profiles_tracked pt ON pt.id = pp.profile_id
ORDER BY upi.created_at DESC
LIMIT 10;

-- =====================================================
-- TEST 9: Data Integrity Check
-- =====================================================
SELECT 
  'Data Integrity' as test_category,
  (SELECT COUNT(*) 
   FROM public.profile_posts pp
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profiles_tracked pt
     WHERE pt.id = pp.profile_id
   )) as orphan_posts,
  (SELECT COUNT(*) 
   FROM public.user_post_interactions upi
   WHERE NOT EXISTS (
     SELECT 1 FROM public.profile_posts pp
     WHERE pp.id = upi.post_id
   )) as orphan_interactions,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM public.profile_posts pp
          WHERE NOT EXISTS (
            SELECT 1 FROM public.profiles_tracked pt
            WHERE pt.id = pp.profile_id
          )) = 0 
    THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END as data_integrity_status;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
SELECT 
  '🎉 FINAL SUMMARY' as summary,
  'Module 4.1 Shared Scraping Migration' as module,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_post_interactions'
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles_tracked' AND column_name = 'last_synced_at'
    )
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profile_posts' AND column_name = 'user_id'
    )
    THEN '✅ Migration Successful'
    ELSE '❌ Migration Incomplete'
  END as migration_status,
  'Ready for Shared Scraping' as next_step;

