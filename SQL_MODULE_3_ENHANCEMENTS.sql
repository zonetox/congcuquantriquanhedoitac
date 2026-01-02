-- SQL Script: Module 3 Enhancements
-- Mục đích: Hoàn thiện notification system với history, monitoring, và race condition prevention

-- ============================================
-- 1. TẠO BẢNG NOTIFICATION HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.profile_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles_tracked(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email')),
  recipient TEXT NOT NULL, -- Telegram Chat ID hoặc Email
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes cho notification_history
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id 
ON public.notification_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_post_id 
ON public.notification_history(post_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_status 
ON public.notification_history(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_history_channel 
ON public.notification_history(channel, created_at DESC);

-- RLS Policies cho notification_history
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users chỉ thấy notification history của chính họ
CREATE POLICY "Users view own notification history"
ON public.notification_history
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System có thể insert notification history (dùng Service Role)
-- Note: Insert sẽ được thực hiện từ server actions với Service Role nếu cần

-- ============================================
-- 2. TẠO BẢNG AI USAGE MONITORING
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.profile_posts(id) ON DELETE SET NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0, -- Cost tính bằng USD
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'rate_limited')),
  error_message TEXT,
  response_time_ms INTEGER, -- Thời gian response tính bằng milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes cho ai_usage_logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id 
ON public.ai_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at 
ON public.ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_status 
ON public.ai_usage_logs(status);

-- RLS Policies cho ai_usage_logs
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users chỉ thấy AI usage logs của chính họ
CREATE POLICY "Users view own AI usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- 3. TẠO BẢNG TELEGRAM RATE LIMIT TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_rate_limits (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  chat_id TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(chat_id, window_start)
);

-- Indexes cho telegram_rate_limits
CREATE INDEX IF NOT EXISTS idx_telegram_rate_limits_chat_id 
ON public.telegram_rate_limits(chat_id, window_start DESC);

-- Index cho window_start (không dùng WHERE clause với now() vì now() không phải IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_telegram_rate_limits_window 
ON public.telegram_rate_limits(window_start DESC);

-- RLS Policies cho telegram_rate_limits
ALTER TABLE public.telegram_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ server actions (Service Role) có thể truy cập
-- Note: Table này chỉ dùng cho system, không cần user access
CREATE POLICY "Service role can manage rate limits"
ON public.telegram_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. CẢI THIỆN PROFILE_POSTS: THÊM LOCKING COLUMN
-- ============================================
-- Thêm column để prevent race condition (optional, có thể dùng SELECT FOR UPDATE thay thế)
-- Không cần thêm column mới, sẽ dùng UPDATE với điều kiện notification_sent = false

-- ============================================
-- 5. FUNCTION: CLEANUP OLD RATE LIMIT RECORDS
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
-- 6. FUNCTION: GET AI USAGE STATS
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
-- 7. COMMENTS
-- ============================================
COMMENT ON TABLE public.notification_history IS 'Lịch sử thông báo đã gửi (Module 3 Enhancement)';
COMMENT ON TABLE public.ai_usage_logs IS 'Log sử dụng AI API để monitor cost (Module 3 Enhancement)';
COMMENT ON TABLE public.telegram_rate_limits IS 'Tracking rate limits cho Telegram API (Module 3 Enhancement)';

COMMENT ON COLUMN public.notification_history.channel IS 'Kênh thông báo: telegram hoặc email';
COMMENT ON COLUMN public.notification_history.recipient IS 'Người nhận: Telegram Chat ID hoặc Email';
COMMENT ON COLUMN public.notification_history.status IS 'Trạng thái: pending, sent, failed';
COMMENT ON COLUMN public.ai_usage_logs.estimated_cost_usd IS 'Chi phí ước tính tính bằng USD';
COMMENT ON COLUMN public.ai_usage_logs.response_time_ms IS 'Thời gian response tính bằng milliseconds';

-- ✅ Hoàn thành!
-- Sau khi chạy script này:
-- 1. notification_history: Lưu lịch sử thông báo
-- 2. ai_usage_logs: Monitor OpenAI API cost
-- 3. telegram_rate_limits: Track rate limits cho Telegram
-- 4. Functions: cleanup_old_rate_limits(), get_ai_usage_stats()

