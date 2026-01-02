-- =====================================================
-- MODULE 4.1: SHARED SCRAPING - Database Migration
-- =====================================================
-- Mục đích: Tái cấu trúc database để hỗ trợ Shared Scraping
-- - profile_posts không còn user_id (dữ liệu chung)
-- - Tạo bảng user_post_interactions (trạng thái riêng của user)
-- - Thêm last_synced_at vào profiles_tracked
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Tạo bảng user_post_interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_post_interactions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.profile_posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Indexes cho user_post_interactions
CREATE INDEX IF NOT EXISTS idx_user_post_interactions_user_id 
  ON public.user_post_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_post_interactions_post_id 
  ON public.user_post_interactions(post_id);

CREATE INDEX IF NOT EXISTS idx_user_post_interactions_user_read 
  ON public.user_post_interactions(user_id, is_read) 
  WHERE is_read = false;

-- =====================================================
-- 2. Thêm last_synced_at vào profiles_tracked
-- =====================================================
ALTER TABLE public.profiles_tracked 
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_tracked_last_synced_at 
  ON public.profiles_tracked(last_synced_at DESC NULLS LAST);

-- =====================================================
-- 3. Migrate dữ liệu: Tạo user_post_interactions từ user_id cũ
-- =====================================================
-- Tạo interactions cho tất cả posts hiện có dựa trên user_id cũ
INSERT INTO public.user_post_interactions (user_id, post_id, is_read, created_at)
SELECT DISTINCT 
  pp.user_id,
  pp.id,
  false,
  pp.created_at
FROM public.profile_posts pp
WHERE pp.user_id IS NOT NULL
ON CONFLICT (user_id, post_id) DO NOTHING;

-- =====================================================
-- 4. Cập nhật last_synced_at từ profile_posts
-- =====================================================
-- Set last_synced_at cho profiles dựa trên post mới nhất
UPDATE public.profiles_tracked pt
SET last_synced_at = (
  SELECT MAX(pp.created_at)
  FROM public.profile_posts pp
  WHERE pp.profile_id = pt.id
)
WHERE EXISTS (
  SELECT 1 FROM public.profile_posts pp WHERE pp.profile_id = pt.id
);

-- =====================================================
-- 5. Cập nhật RLS Policies cho profile_posts (TRƯỚC KHI DROP COLUMN)
-- =====================================================
-- Drop policy cũ (nếu có) - PHẢI DROP TRƯỚC KHI DROP COLUMN
DROP POLICY IF EXISTS "Users view own posts" ON public.profile_posts;

-- Tạo policy mới ngay lập tức (không dùng user_id)
CREATE POLICY "Users view posts from tracked profiles"
ON public.profile_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles_tracked pt
    WHERE pt.id = profile_posts.profile_id
    AND pt.user_id = auth.uid()
  )
);

-- =====================================================
-- 6. Loại bỏ user_id khỏi profile_posts (SAU KHI DROP POLICY)
-- =====================================================
-- Bước 1: Drop foreign key constraint
ALTER TABLE public.profile_posts 
  DROP CONSTRAINT IF EXISTS profile_posts_user_id_fkey;

-- Bước 2: Drop index trên user_id
DROP INDEX IF EXISTS idx_profile_posts_user_id;
DROP INDEX IF EXISTS idx_profile_posts_user_published;
DROP INDEX IF EXISTS idx_profile_posts_user_published_ai;
DROP INDEX IF EXISTS idx_profile_posts_notification_sent;

-- Bước 3: Drop column user_id (SAU KHI ĐÃ DROP POLICY)
-- Sử dụng CASCADE để tự động drop các objects phụ thuộc (nếu có)
ALTER TABLE public.profile_posts 
  DROP COLUMN IF EXISTS user_id CASCADE;

-- =====================================================
-- 7. RLS Policies cho user_post_interactions
-- =====================================================
ALTER TABLE public.user_post_interactions ENABLE ROW LEVEL SECURITY;

-- Users chỉ xem interactions của chính họ
CREATE POLICY "Users manage own interactions"
ON public.user_post_interactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. Tạo function để tự động tạo interaction khi user xem post
-- =====================================================
CREATE OR REPLACE FUNCTION public.ensure_user_post_interaction(
  p_user_id UUID,
  p_post_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_post_interactions (user_id, post_id, is_read)
  VALUES (p_user_id, p_post_id, true)
  ON CONFLICT (user_id, post_id) 
  DO UPDATE SET 
    is_read = true,
    updated_at = now();
END;
$$;

-- =====================================================
-- 9. Tạo function để update last_synced_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_profile_last_synced_at(
  p_profile_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles_tracked
  SET last_synced_at = now()
  WHERE id = p_profile_id;
END;
$$;

-- =====================================================
-- 10. Tạo trigger để tự động update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_user_post_interactions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_post_interactions_updated_at 
  ON public.user_post_interactions;

CREATE TRIGGER trigger_update_user_post_interactions_updated_at
  BEFORE UPDATE ON public.user_post_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_post_interactions_updated_at();

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Kiểm tra số lượng interactions đã được tạo
-- SELECT COUNT(*) FROM public.user_post_interactions;

-- Kiểm tra profiles có last_synced_at
-- SELECT COUNT(*) FROM public.profiles_tracked WHERE last_synced_at IS NOT NULL;

-- Kiểm tra profile_posts không còn user_id
-- SELECT COUNT(*) FROM information_schema.columns 
-- WHERE table_name = 'profile_posts' AND column_name = 'user_id';
-- (Kết quả phải = 0)

