-- ============================================
-- SQL NEWSFEED MODULE V2A - Indexes & Optimizations
-- ============================================
-- Mục đích: Tạo indexes để tối ưu performance cho Newsfeed module
-- Chạy file này trong Supabase SQL Editor sau khi đã tạo các bảng

-- ============================================
-- 1. Indexes cho api_key_pool
-- ============================================

-- Index cho provider và status (tối ưu query getValidKey)
CREATE INDEX IF NOT EXISTS idx_api_key_pool_provider_status 
ON public.api_key_pool(provider, status, current_usage);

-- Index cho status (để filter active keys)
CREATE INDEX IF NOT EXISTS idx_api_key_pool_status 
ON public.api_key_pool(status) 
WHERE status = 'active';

-- Index cho last_used_at (để sort theo thời gian sử dụng)
CREATE INDEX IF NOT EXISTS idx_api_key_pool_last_used 
ON public.api_key_pool(last_used_at DESC NULLS LAST);

-- ============================================
-- 2. Indexes cho profile_posts
-- ============================================

-- Index cho profile_id (để lấy posts của một profile)
CREATE INDEX IF NOT EXISTS idx_profile_posts_profile_id 
ON public.profile_posts(profile_id);

-- Index cho user_id (để lấy posts của một user)
CREATE INDEX IF NOT EXISTS idx_profile_posts_user_id 
ON public.profile_posts(user_id);

-- Composite index cho user_id + published_at (tối ưu Newsfeed queries)
CREATE INDEX IF NOT EXISTS idx_profile_posts_user_published 
ON public.profile_posts(user_id, published_at DESC NULLS LAST);

-- Index cho created_at (để sort theo thời gian tạo)
CREATE INDEX IF NOT EXISTS idx_profile_posts_created_at 
ON public.profile_posts(created_at DESC);

-- ============================================
-- 3. Verify Indexes
-- ============================================

-- Kiểm tra indexes đã được tạo
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND (
    tablename = 'api_key_pool' 
    OR tablename = 'profile_posts'
  )
ORDER BY tablename, indexname;

-- ============================================
-- ✅ HOÀN THÀNH
-- ============================================
-- Sau khi chạy các lệnh trên, database đã được tối ưu cho Newsfeed module:
-- ✅ Indexes cho api_key_pool (provider, status, usage)
-- ✅ Indexes cho profile_posts (user_id, profile_id, published_at)
-- ✅ Composite indexes cho performance tối ưu

