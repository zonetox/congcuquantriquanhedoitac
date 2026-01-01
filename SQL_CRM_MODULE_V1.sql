-- ============================================
-- SQL CRM MODULE V1 - Indexes & Optimizations
-- ============================================
-- Mục đích: Tạo indexes để tối ưu performance cho CRM module
-- Chạy file này trong Supabase SQL Editor sau khi đã tạo các bảng

-- ============================================
-- 1. Indexes cho profiles_tracked (CRM fields)
-- ============================================

-- Index cho last_interacted_at (để sort và filter theo ngày tương tác)
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_last_interacted_at 
ON public.profiles_tracked(last_interacted_at DESC NULLS LAST);

-- Index cho relationship_score (để sort theo điểm sức khỏe)
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_relationship_score 
ON public.profiles_tracked(relationship_score DESC NULLS LAST);

-- Composite index cho user_id + last_interacted_at (tối ưu query theo user và ngày tương tác)
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_user_interaction 
ON public.profiles_tracked(user_id, last_interacted_at DESC NULLS LAST);

-- ============================================
-- 2. Indexes cho interaction_logs
-- ============================================

-- Index cho profile_id (để lấy logs của một profile)
CREATE INDEX IF NOT EXISTS idx_interaction_logs_profile_id 
ON public.interaction_logs(profile_id);

-- Index cho user_id (để lấy logs của một user)
CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_id 
ON public.interaction_logs(user_id);

-- Composite index cho profile_id + created_at (tối ưu query logs theo profile và thời gian)
CREATE INDEX IF NOT EXISTS idx_interaction_logs_profile_created 
ON public.interaction_logs(profile_id, created_at DESC);

-- Index cho interaction_type (để filter theo loại tương tác)
CREATE INDEX IF NOT EXISTS idx_interaction_logs_type 
ON public.interaction_logs(interaction_type) 
WHERE interaction_type IS NOT NULL;

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
    tablename = 'profiles_tracked' 
    OR tablename = 'interaction_logs'
  )
ORDER BY tablename, indexname;

-- ============================================
-- ✅ HOÀN THÀNH
-- ============================================
-- Sau khi chạy các lệnh trên, database đã được tối ưu cho CRM module:
-- ✅ Indexes cho last_interacted_at và relationship_score
-- ✅ Indexes cho interaction_logs queries
-- ✅ Composite indexes cho performance tối ưu

