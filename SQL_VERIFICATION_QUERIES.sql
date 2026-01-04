-- =====================================================
-- VERIFICATION QUERIES - Chạy các queries này để verify database
-- =====================================================

-- =====================================================
-- 1. Verify Columns trong user_profiles
-- =====================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- =====================================================
-- 2. Verify Columns trong profiles_tracked
-- =====================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles_tracked'
ORDER BY ordinal_position;

-- =====================================================
-- 3. Verify Indexes
-- =====================================================
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('user_profiles', 'profiles_tracked')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 4. Verify RLS Policies
-- =====================================================
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'profiles_tracked')
ORDER BY tablename, policyname;

-- =====================================================
-- 5. Quick Check: Các columns quan trọng có tồn tại không?
-- =====================================================
-- Check user_profiles.locale
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'locale'
    ) THEN '✅ user_profiles.locale EXISTS'
    ELSE '❌ user_profiles.locale MISSING'
  END AS status;

-- Check profiles_tracked.last_contacted_at
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles_tracked' 
      AND column_name = 'last_contacted_at'
    ) THEN '✅ profiles_tracked.last_contacted_at EXISTS'
    ELSE '❌ profiles_tracked.last_contacted_at MISSING'
  END AS status;

-- Check profiles_tracked.last_synced_at
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles_tracked' 
      AND column_name = 'last_synced_at'
    ) THEN '✅ profiles_tracked.last_synced_at EXISTS'
    ELSE '❌ profiles_tracked.last_synced_at MISSING'
  END AS status;

-- =====================================================
-- 6. Summary: Tất cả columns quan trọng
-- =====================================================
SELECT 
  'user_profiles' AS table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('locale', 'trial_started_at')
UNION ALL
SELECT 
  'profiles_tracked' AS table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles_tracked'
AND column_name IN (
  'last_contacted_at',
  'last_synced_at',
  'last_interacted_at',
  'relationship_score',
  'notify_telegram_chat_id',
  'notify_on_sales_opportunity',
  'is_in_feed',
  'category',
  'notes',
  'has_new_update',
  'rss_url'
)
ORDER BY table_name, column_name;

