-- ============================================
-- SQL Script: Scraper Engine & AI Intent v2
-- ============================================
-- Mục đích: Tối ưu database cho Scraper Engine và AI Intent v2 (đa ngôn ngữ)
-- Chạy file này trong Supabase SQL Editor

-- ============================================
-- 1. UNIQUE CONSTRAINT CHO POST_URL (Tránh duplicate)
-- ============================================
-- Đảm bảo không có 2 posts trùng nhau từ cùng một profile
-- Scraper sẽ dùng upsert logic dựa trên constraint này

-- Kiểm tra xem constraint đã tồn tại chưa
DO $$
BEGIN
  -- Thử tạo unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profile_posts_post_url_profile_unique'
  ) THEN
    -- Tạo unique constraint trên (post_url, profile_id)
    -- Chỉ áp dụng khi post_url IS NOT NULL
    CREATE UNIQUE INDEX profile_posts_post_url_profile_unique
    ON public.profile_posts(profile_id, post_url)
    WHERE post_url IS NOT NULL;
    
    RAISE NOTICE 'Created unique constraint: profile_posts_post_url_profile_unique';
  ELSE
    RAISE NOTICE 'Constraint already exists: profile_posts_post_url_profile_unique';
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Constraint already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating constraint: %', SQLERRM;
END $$;

-- ============================================
-- 2. INDEX CHO AI_ANALYSIS (Tối ưu query intent_score)
-- ============================================
-- Tạo GIN index cho JSONB ai_analysis để query nhanh hơn
-- Hỗ trợ filter theo intent_score và signal

CREATE INDEX IF NOT EXISTS idx_profile_posts_ai_analysis_gin
ON public.profile_posts USING GIN (ai_analysis)
WHERE ai_analysis IS NOT NULL;

-- Index riêng cho published_at (tối ưu weekly sales opportunities query)
CREATE INDEX IF NOT EXISTS idx_profile_posts_published_at
ON public.profile_posts(published_at DESC NULLS LAST)
WHERE published_at IS NOT NULL;

-- Composite index cho user_id + published_at + ai_analysis (tối ưu weekly sales opportunities)
CREATE INDEX IF NOT EXISTS idx_profile_posts_user_published_ai
ON public.profile_posts(user_id, published_at DESC NULLS LAST)
WHERE ai_analysis IS NOT NULL AND published_at IS NOT NULL;

-- ============================================
-- 3. FUNCTION ĐỂ QUERY INTENT_SCORE (Helper)
-- ============================================
-- Function helper để extract intent_score từ ai_analysis JSONB
-- Dùng cho filter và sorting

CREATE OR REPLACE FUNCTION public.get_intent_score(analysis JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF analysis IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN COALESCE((analysis->>'intent_score')::INTEGER, 0);
END;
$$;

-- Index sử dụng function để tối ưu filter intent_score > 70
CREATE INDEX IF NOT EXISTS idx_profile_posts_intent_score
ON public.profile_posts(public.get_intent_score(ai_analysis) DESC)
WHERE ai_analysis IS NOT NULL AND public.get_intent_score(ai_analysis) > 70;

-- ============================================
-- 4. FUNCTION ĐỂ QUERY SIGNAL (Helper)
-- ============================================
-- Function helper để extract signal từ ai_analysis JSONB

CREATE OR REPLACE FUNCTION public.get_signal(analysis JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF analysis IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN analysis->>'signal';
END;
$$;

-- Index cho signal = "Cơ hội bán hàng"
CREATE INDEX IF NOT EXISTS idx_profile_posts_sales_opportunity
ON public.profile_posts(public.get_signal(ai_analysis))
WHERE ai_analysis IS NOT NULL AND public.get_signal(ai_analysis) = 'Cơ hội bán hàng';

-- ============================================
-- 5. VERIFY INDEXES
-- ============================================
-- Kiểm tra các indexes đã được tạo

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profile_posts'
  AND indexname LIKE '%profile_posts%'
ORDER BY indexname;

-- ============================================
-- 6. COMMENTS (Documentation)
-- ============================================
-- Thêm comments để document

COMMENT ON INDEX profile_posts_post_url_profile_unique IS 
'Unique constraint: Prevents duplicate posts from same profile. Used by scraper upsert logic.';

COMMENT ON INDEX idx_profile_posts_ai_analysis_gin IS 
'GIN index on ai_analysis JSONB: Optimizes queries filtering by intent_score, signal, keywords.';

COMMENT ON INDEX idx_profile_posts_intent_score IS 
'Index on intent_score: Optimizes filter for Sales Opportunities (intent_score > 70).';

COMMENT ON INDEX idx_profile_posts_sales_opportunity IS 
'Index on signal: Optimizes filter for Sales Opportunities (signal = "Cơ hội bán hàng").';

COMMENT ON FUNCTION public.get_intent_score(JSONB) IS 
'Helper function: Extracts intent_score (1-100) from ai_analysis JSONB. Used for filtering and sorting.';

COMMENT ON FUNCTION public.get_signal(JSONB) IS 
'Helper function: Extracts signal from ai_analysis JSONB. Used for filtering Sales Opportunities.';

-- ✅ Hoàn thành!
-- Sau khi chạy script này:
-- 1. Unique constraint đã được tạo để tránh duplicate posts
-- 2. GIN index cho ai_analysis để query nhanh hơn
-- 3. Indexes cho intent_score và signal để filter Sales Opportunities
-- 4. Helper functions để extract data từ JSONB
-- 5. Tối ưu query weekly sales opportunities

