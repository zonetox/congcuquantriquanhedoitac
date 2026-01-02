-- =====================================================
-- AI Radar & Interaction Clock - Database Updates
-- =====================================================
-- 1. Thêm cột last_contacted_at vào profiles_tracked
-- 2. Tạo index để tối ưu query "Cần chăm sóc"

BEGIN;

-- =====================================================
-- 1. Thêm cột last_contacted_at vào profiles_tracked
-- =====================================================
ALTER TABLE public.profiles_tracked 
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE;

-- Comment cho cột
COMMENT ON COLUMN public.profiles_tracked.last_contacted_at IS 
  'Thời gian liên hệ cuối cùng (khi user click Ice Breaker hoặc Copy). Dùng để tính "Cần chăm sóc" nếu > 7 days.';

-- =====================================================
-- 2. Tạo index để tối ưu query profiles cần chăm sóc
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_last_contacted_at 
  ON public.profiles_tracked(last_contacted_at DESC NULLS LAST);

-- Index composite để query profiles cần chăm sóc của user
-- Lưu ý: Không thể dùng now() trong WHERE clause (không IMMUTABLE)
-- Application logic sẽ filter profiles cần chăm sóc (> 7 days)
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_user_contact_status 
  ON public.profiles_tracked(user_id, last_contacted_at DESC NULLS LAST);

-- =====================================================
-- 3. Tạo function để update last_contacted_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_profile_last_contacted_at(
  p_profile_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles_tracked
  SET last_contacted_at = now()
  WHERE id = p_profile_id
  AND user_id = auth.uid(); -- Chỉ update profile của chính user
END;
$$;

-- Comment cho function
COMMENT ON FUNCTION public.update_profile_last_contacted_at(UUID) IS 
  'Cập nhật last_contacted_at khi user click Ice Breaker hoặc Copy. Được gọi từ server action.';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Kiểm tra cột đã được thêm
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles_tracked' AND column_name = 'last_contacted_at';

-- Kiểm tra indexes đã được tạo
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'profiles_tracked' AND indexname LIKE '%contact%';

-- Kiểm tra function đã được tạo
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_name = 'update_profile_last_contacted_at';

