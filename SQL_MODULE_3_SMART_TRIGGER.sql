-- SQL Script: Module 3 - Smart Trigger (Cảnh báo Sales Opportunity)
-- Mục đích: Thêm các column cần thiết cho notification system

-- 1. Thêm cột cấu hình thông báo cho profiles_tracked
ALTER TABLE public.profiles_tracked
ADD COLUMN IF NOT EXISTS notify_telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS notify_on_sales_opportunity BOOLEAN DEFAULT true;

-- 2. Thêm cột đánh dấu bài đăng đã gửi thông báo cho profile_posts
ALTER TABLE public.profile_posts
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- 3. Tạo index để tối ưu query notification_sent
CREATE INDEX IF NOT EXISTS idx_profile_posts_notification_sent 
ON public.profile_posts(user_id, notification_sent) 
WHERE notification_sent = false;

-- 4. Tạo index để tối ưu query notify_on_sales_opportunity
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_notify_settings 
ON public.profiles_tracked(user_id, notify_on_sales_opportunity) 
WHERE notify_on_sales_opportunity = true AND notify_telegram_chat_id IS NOT NULL;

-- 5. Comment cho các column mới
COMMENT ON COLUMN public.profiles_tracked.notify_telegram_chat_id IS 'Telegram Chat ID để nhận thông báo khi phát hiện Sales Opportunity (Module 3)';
COMMENT ON COLUMN public.profiles_tracked.notify_on_sales_opportunity IS 'Có nhận cảnh báo khi phát hiện Sales Opportunity không (Module 3). Default: true';
COMMENT ON COLUMN public.profile_posts.notification_sent IS 'Đánh dấu đã gửi thông báo cho Sales Opportunity chưa (Module 3). Default: false';

-- ✅ Hoàn thành!
-- Sau khi chạy script này:
-- 1. profiles_tracked sẽ có notify_telegram_chat_id và notify_on_sales_opportunity
-- 2. profile_posts sẽ có notification_sent
-- 3. Indexes đã được tạo để tối ưu performance

