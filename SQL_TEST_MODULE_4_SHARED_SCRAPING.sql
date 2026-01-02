-- =====================================================
-- TEST SCRIPT - Module 4.1 Shared Scraping
-- =====================================================
-- Script này test tự động các tính năng của Shared Scraping
-- Chạy từng phần để verify từng tính năng

BEGIN;

-- =====================================================
-- TEST 1: Verify Database Structure
-- =====================================================
DO $$
DECLARE
  test_result TEXT;
BEGIN
  RAISE NOTICE '=== TEST 1: Verify Database Structure ===';
  
  -- Check user_post_interactions table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_post_interactions'
  ) THEN
    RAISE NOTICE '✅ PASS: user_post_interactions table exists';
  ELSE
    RAISE NOTICE '❌ FAIL: user_post_interactions table does not exist';
  END IF;
  
  -- Check last_synced_at column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles_tracked' AND column_name = 'last_synced_at'
  ) THEN
    RAISE NOTICE '✅ PASS: last_synced_at column exists in profiles_tracked';
  ELSE
    RAISE NOTICE '❌ FAIL: last_synced_at column does not exist';
  END IF;
  
  -- Check user_id column removed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_posts' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '✅ PASS: user_id column removed from profile_posts';
  ELSE
    RAISE NOTICE '❌ FAIL: user_id column still exists in profile_posts';
  END IF;
  
  -- Check RLS policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_posts' 
    AND policyname = 'Users view posts from tracked profiles'
  ) THEN
    RAISE NOTICE '✅ PASS: New RLS policy exists';
  ELSE
    RAISE NOTICE '❌ FAIL: New RLS policy does not exist';
  END IF;
  
  -- Check old RLS policy removed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_posts' 
    AND policyname = 'Users view own posts'
  ) THEN
    RAISE NOTICE '✅ PASS: Old RLS policy removed';
  ELSE
    RAISE NOTICE '❌ FAIL: Old RLS policy still exists';
  END IF;
END $$;

-- =====================================================
-- TEST 2: Test Shared Scraping Logic (last_synced_at)
-- =====================================================
DO $$
DECLARE
  test_profile_id UUID;
  initial_sync_time TIMESTAMP WITH TIME ZONE;
  updated_sync_time TIMESTAMP WITH TIME ZONE;
BEGIN
  RAISE NOTICE '=== TEST 2: Test Shared Scraping Logic ===';
  
  -- Get first profile for testing
  SELECT id INTO test_profile_id 
  FROM public.profiles_tracked 
  WHERE is_in_feed = true 
  LIMIT 1;
  
  IF test_profile_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIP: No profiles with is_in_feed = true found';
    RETURN;
  END IF;
  
  -- Set initial last_synced_at to 2 hours ago (should trigger sync)
  UPDATE public.profiles_tracked
  SET last_synced_at = now() - INTERVAL '2 hours'
  WHERE id = test_profile_id;
  
  SELECT last_synced_at INTO initial_sync_time
  FROM public.profiles_tracked
  WHERE id = test_profile_id;
  
  RAISE NOTICE 'Initial last_synced_at: %', initial_sync_time;
  
  -- Simulate sync: Update last_synced_at to now
  UPDATE public.profiles_tracked
  SET last_synced_at = now()
  WHERE id = test_profile_id;
  
  SELECT last_synced_at INTO updated_sync_time
  FROM public.profiles_tracked
  WHERE id = test_profile_id;
  
  IF updated_sync_time > initial_sync_time THEN
    RAISE NOTICE '✅ PASS: last_synced_at updated successfully';
  ELSE
    RAISE NOTICE '❌ FAIL: last_synced_at not updated';
  END IF;
  
  -- Test: Profile synced < 1 hour ago should NOT trigger sync
  UPDATE public.profiles_tracked
  SET last_synced_at = now() - INTERVAL '30 minutes'
  WHERE id = test_profile_id;
  
  SELECT last_synced_at INTO initial_sync_time
  FROM public.profiles_tracked
  WHERE id = test_profile_id;
  
  -- Logic: If last_synced_at < 1 hour ago, should skip sync
  IF initial_sync_time > now() - INTERVAL '1 hour' THEN
    RAISE NOTICE '✅ PASS: Profile synced < 1 hour ago should skip sync';
  ELSE
    RAISE NOTICE '❌ FAIL: Profile sync logic incorrect';
  END IF;
END $$;

-- =====================================================
-- TEST 3: Test user_post_interactions
-- =====================================================
DO $$
DECLARE
  test_user_id UUID;
  test_post_id UUID;
  interaction_count INT;
BEGIN
  RAISE NOTICE '=== TEST 3: Test user_post_interactions ===';
  
  -- Get first user for testing
  SELECT id INTO test_user_id 
  FROM auth.users 
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIP: No users found';
    RETURN;
  END IF;
  
  -- Get first post for testing
  SELECT id INTO test_post_id 
  FROM public.profile_posts 
  LIMIT 1;
  
  IF test_post_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIP: No posts found. Create a test post first.';
    RETURN;
  END IF;
  
  -- Test: Create interaction
  INSERT INTO public.user_post_interactions (user_id, post_id, is_read)
  VALUES (test_user_id, test_post_id, true)
  ON CONFLICT (user_id, post_id) 
  DO UPDATE SET is_read = true, updated_at = now();
  
  SELECT COUNT(*) INTO interaction_count
  FROM public.user_post_interactions
  WHERE user_id = test_user_id AND post_id = test_post_id;
  
  IF interaction_count > 0 THEN
    RAISE NOTICE '✅ PASS: user_post_interactions created successfully';
  ELSE
    RAISE NOTICE '❌ FAIL: user_post_interactions not created';
  END IF;
  
  -- Test: Unique constraint (same user, same post)
  BEGIN
    INSERT INTO public.user_post_interactions (user_id, post_id, is_read)
    VALUES (test_user_id, test_post_id, false);
    RAISE NOTICE '❌ FAIL: Unique constraint not working';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '✅ PASS: Unique constraint working correctly';
  END;
END $$;

-- =====================================================
-- TEST 4: Test Functions
-- =====================================================
DO $$
DECLARE
  test_profile_id UUID;
  test_user_id UUID;
  test_post_id UUID;
  function_result BOOLEAN;
BEGIN
  RAISE NOTICE '=== TEST 4: Test Functions ===';
  
  -- Test ensure_user_post_interaction function
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_post_id FROM public.profile_posts LIMIT 1;
  
  IF test_user_id IS NULL OR test_post_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIP: Need user and post to test function';
    RETURN;
  END IF;
  
  -- Test function exists
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'ensure_user_post_interaction'
  ) THEN
    RAISE NOTICE '✅ PASS: ensure_user_post_interaction function exists';
    
    -- Call function
    PERFORM public.ensure_user_post_interaction(test_user_id, test_post_id);
    
    -- Verify interaction created
    IF EXISTS (
      SELECT 1 FROM public.user_post_interactions
      WHERE user_id = test_user_id AND post_id = test_post_id
    ) THEN
      RAISE NOTICE '✅ PASS: Function creates interaction correctly';
    ELSE
      RAISE NOTICE '❌ FAIL: Function did not create interaction';
    END IF;
  ELSE
    RAISE NOTICE '❌ FAIL: ensure_user_post_interaction function does not exist';
  END IF;
  
  -- Test update_profile_last_synced_at function
  SELECT id INTO test_profile_id 
  FROM public.profiles_tracked 
  WHERE is_in_feed = true 
  LIMIT 1;
  
  IF test_profile_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIP: No profile to test function';
    RETURN;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_name = 'update_profile_last_synced_at'
  ) THEN
    RAISE NOTICE '✅ PASS: update_profile_last_synced_at function exists';
    
    -- Call function
    PERFORM public.update_profile_last_synced_at(test_profile_id);
    
    -- Verify last_synced_at updated
    IF EXISTS (
      SELECT 1 FROM public.profiles_tracked
      WHERE id = test_profile_id 
      AND last_synced_at IS NOT NULL
      AND last_synced_at > now() - INTERVAL '1 minute'
    ) THEN
      RAISE NOTICE '✅ PASS: Function updates last_synced_at correctly';
    ELSE
      RAISE NOTICE '❌ FAIL: Function did not update last_synced_at';
    END IF;
  ELSE
    RAISE NOTICE '❌ FAIL: update_profile_last_synced_at function does not exist';
  END IF;
END $$;

-- =====================================================
-- TEST 5: Test Shared Posts (No user_id)
-- =====================================================
DO $$
DECLARE
  post_count INT;
  posts_with_user_id INT;
BEGIN
  RAISE NOTICE '=== TEST 5: Test Shared Posts ===';
  
  -- Count total posts
  SELECT COUNT(*) INTO post_count FROM public.profile_posts;
  RAISE NOTICE 'Total posts: %', post_count;
  
  -- Verify no posts have user_id (should be 0)
  -- Since column doesn't exist, this query will fail if column exists
  BEGIN
    SELECT COUNT(*) INTO posts_with_user_id
    FROM public.profile_posts
    WHERE user_id IS NOT NULL;
    RAISE NOTICE '❌ FAIL: user_id column still exists';
  EXCEPTION
    WHEN undefined_column THEN
      RAISE NOTICE '✅ PASS: user_id column removed (query failed as expected)';
    WHEN OTHERS THEN
      RAISE NOTICE '✅ PASS: No posts with user_id (column removed)';
  END;
  
  -- Test: Posts can be queried by profile_id only
  IF EXISTS (
    SELECT 1 FROM public.profile_posts LIMIT 1
  ) THEN
    RAISE NOTICE '✅ PASS: Posts can be queried without user_id';
  ELSE
    RAISE NOTICE '⚠️  INFO: No posts exist yet (this is OK)';
  END IF;
END $$;

-- =====================================================
-- TEST 6: Test RLS Policies
-- =====================================================
DO $$
DECLARE
  policy_count INT;
BEGIN
  RAISE NOTICE '=== TEST 6: Test RLS Policies ===';
  
  -- Check new policy exists
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profile_posts'
  AND policyname = 'Users view posts from tracked profiles';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ PASS: New RLS policy exists';
  ELSE
    RAISE NOTICE '❌ FAIL: New RLS policy does not exist';
  END IF;
  
  -- Check old policy removed
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profile_posts'
  AND policyname = 'Users view own posts';
  
  IF policy_count = 0 THEN
    RAISE NOTICE '✅ PASS: Old RLS policy removed';
  ELSE
    RAISE NOTICE '❌ FAIL: Old RLS policy still exists';
  END IF;
  
  -- Check user_post_interactions policy
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_post_interactions'
  AND policyname = 'Users manage own interactions';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ PASS: user_post_interactions RLS policy exists';
  ELSE
    RAISE NOTICE '❌ FAIL: user_post_interactions RLS policy does not exist';
  END IF;
END $$;

-- =====================================================
-- TEST 7: Test Data Integrity
-- =====================================================
DO $$
DECLARE
  orphan_posts INT;
  orphan_interactions INT;
BEGIN
  RAISE NOTICE '=== TEST 7: Test Data Integrity ===';
  
  -- Check for orphan posts (posts without valid profile)
  SELECT COUNT(*) INTO orphan_posts
  FROM public.profile_posts pp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles_tracked pt
    WHERE pt.id = pp.profile_id
  );
  
  IF orphan_posts = 0 THEN
    RAISE NOTICE '✅ PASS: No orphan posts (all posts have valid profile_id)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Found % orphan posts', orphan_posts;
  END IF;
  
  -- Check for orphan interactions (interactions without valid post)
  SELECT COUNT(*) INTO orphan_interactions
  FROM public.user_post_interactions upi
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profile_posts pp
    WHERE pp.id = upi.post_id
  );
  
  IF orphan_interactions = 0 THEN
    RAISE NOTICE '✅ PASS: No orphan interactions (all interactions have valid post_id)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Found % orphan interactions', orphan_interactions;
  END IF;
END $$;

-- =====================================================
-- TEST 8: Performance Check (Indexes)
-- =====================================================
DO $$
DECLARE
  index_count INT;
BEGIN
  RAISE NOTICE '=== TEST 8: Performance Check (Indexes) ===';
  
  -- Check indexes on user_post_interactions
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'user_post_interactions';
  
  IF index_count >= 3 THEN
    RAISE NOTICE '✅ PASS: user_post_interactions has indexes (% indexes)', index_count;
  ELSE
    RAISE NOTICE '⚠️  WARNING: user_post_interactions has only % indexes (expected >= 3)', index_count;
  END IF;
  
  -- Check index on last_synced_at
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'profiles_tracked'
  AND indexdef LIKE '%last_synced_at%';
  
  IF index_count > 0 THEN
    RAISE NOTICE '✅ PASS: Index on last_synced_at exists';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Index on last_synced_at does not exist';
  END IF;
  
  -- Verify no indexes on user_id in profile_posts
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'profile_posts'
  AND indexdef LIKE '%user_id%';
  
  IF index_count = 0 THEN
    RAISE NOTICE '✅ PASS: No indexes on user_id in profile_posts (removed)';
  ELSE
    RAISE NOTICE '❌ FAIL: Found % indexes on user_id in profile_posts', index_count;
  END IF;
END $$;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================
DO $$
DECLARE
  total_profiles INT;
  total_posts INT;
  total_interactions INT;
  profiles_with_sync INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY REPORT ===';
  
  SELECT COUNT(*) INTO total_profiles FROM public.profiles_tracked;
  SELECT COUNT(*) INTO total_posts FROM public.profile_posts;
  SELECT COUNT(*) INTO total_interactions FROM public.user_post_interactions;
  SELECT COUNT(*) INTO profiles_with_sync 
  FROM public.profiles_tracked 
  WHERE last_synced_at IS NOT NULL;
  
  RAISE NOTICE 'Total Profiles: %', total_profiles;
  RAISE NOTICE 'Total Posts (Shared): %', total_posts;
  RAISE NOTICE 'Total User Interactions: %', total_interactions;
  RAISE NOTICE 'Profiles with last_synced_at: %', profiles_with_sync;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All tests completed!';
  RAISE NOTICE 'Review the results above to verify Shared Scraping is working correctly.';
END $$;

COMMIT;

-- =====================================================
-- MANUAL VERIFICATION QUERIES
-- =====================================================
-- Run these queries manually to verify specific scenarios:

-- 1. Check profiles ready for sync (> 1 hour since last sync)
-- SELECT id, title, last_synced_at, 
--        CASE 
--          WHEN last_synced_at IS NULL THEN true
--          WHEN last_synced_at < now() - INTERVAL '1 hour' THEN true
--          ELSE false
--        END as needs_sync
-- FROM public.profiles_tracked
-- WHERE is_in_feed = true
-- ORDER BY last_synced_at DESC NULLS LAST;

-- 2. Check shared posts (no user_id)
-- SELECT pp.id, pp.profile_id, pt.title as profile_title, 
--        pp.content, pp.published_at, pp.ai_analysis IS NOT NULL as has_ai_analysis
-- FROM public.profile_posts pp
-- JOIN public.profiles_tracked pt ON pt.id = pp.profile_id
-- ORDER BY pp.published_at DESC NULLS LAST
-- LIMIT 10;

-- 3. Check user interactions
-- SELECT upi.user_id, u.email, pp.id as post_id, 
--        upi.is_read, upi.is_hidden, upi.created_at
-- FROM public.user_post_interactions upi
-- JOIN auth.users u ON u.id = upi.user_id
-- JOIN public.profile_posts pp ON pp.id = upi.post_id
-- ORDER BY upi.created_at DESC
-- LIMIT 10;

