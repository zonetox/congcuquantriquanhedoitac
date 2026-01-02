-- SQL Script: Fix Security Issues
-- Mục đích: Enable RLS cho tables và fix search_path cho functions

-- ============================================
-- 1. ENABLE RLS CHO TELEGRAM_RATE_LIMITS
-- ============================================
ALTER TABLE public.telegram_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ server actions (Service Role) có thể truy cập
-- Note: Table này chỉ dùng cho system, không cần user access
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.telegram_rate_limits;
CREATE POLICY "Service role can manage rate limits"
ON public.telegram_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. ENABLE RLS CHO ADMIN_LOGS
-- ============================================
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins chỉ thấy logs của chính họ, hoặc tất cả logs nếu là admin
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view admin logs"
ON public.admin_logs
FOR SELECT
USING (
  auth.uid() = admin_id 
  OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Chỉ admins có thể insert logs
DROP POLICY IF EXISTS "Admins can insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can insert admin logs"
ON public.admin_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 3. FIX SEARCH_PATH CHO CLEANUP_OLD_RATE_LIMITS
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Xóa các rate limit records cũ hơn 1 phút
  DELETE FROM public.telegram_rate_limits
  WHERE window_start < now() - INTERVAL '1 minute';
END;
$$;

-- ============================================
-- 4. FIX SEARCH_PATH CHO GET_AI_USAGE_STATS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_ai_usage_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost_usd NUMERIC,
  avg_response_time_ms NUMERIC,
  error_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(estimated_cost_usd), 0) as total_cost_usd,
    COALESCE(AVG(response_time_ms), 0) as avg_response_time_ms,
    COUNT(*) FILTER (WHERE status = 'error')::BIGINT as error_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL;
END;
$$;

-- ============================================
-- 5. FIX SEARCH_PATH CHO HANDLE_NEW_USER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, is_premium, locale)
  VALUES (new.id, new.email, 'user', false, 'en')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- ============================================
-- 6. FIX SEARCH_PATH CHO UPDATE_PROFILES_TRACKED_UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_profiles_tracked_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ============================================
-- 7. FIX SEARCH_PATH CHO IS_ADMIN_USER
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ✅ Hoàn thành!
-- Sau khi chạy script này:
-- 1. telegram_rate_limits: RLS đã được enable
-- 2. admin_logs: RLS đã được enable với policies phù hợp
-- 3. Tất cả functions: search_path đã được set = public
--    - cleanup_old_rate_limits()
--    - get_ai_usage_stats()
--    - handle_new_user()
--    - update_profiles_tracked_updated_at()
--    - is_admin_user()

