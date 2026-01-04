-- =====================================================
-- SQL VERIFICATION & COMPLETION SCRIPT
-- Mục đích: Kiểm tra và đảm bảo tất cả columns cần thiết đã có trong database
-- Ngày tạo: 2024
-- =====================================================

BEGIN;

-- =====================================================
-- 1. VERIFY & ADD: user_profiles.locale
-- =====================================================
-- Kiểm tra xem column locale đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'locale'
  ) THEN
    -- Thêm column locale vào bảng user_profiles
    ALTER TABLE public.user_profiles 
    ADD COLUMN locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'vi', 'es', 'fr', 'de', 'ja', 'zh'));
    
    -- Tạo index để tối ưu query
    CREATE INDEX IF NOT EXISTS idx_user_profiles_locale ON public.user_profiles(locale);
    
    -- Comment cho column
    COMMENT ON COLUMN public.user_profiles.locale IS 'Language preference của user (en, vi, es, fr, de, ja, zh). Default: en';
    
    -- Update existing users: Set locale = 'en' nếu chưa có giá trị
    UPDATE public.user_profiles 
    SET locale = 'en' 
    WHERE locale IS NULL;
    
    -- Set NOT NULL constraint sau khi đã update tất cả records
    ALTER TABLE public.user_profiles 
    ALTER COLUMN locale SET NOT NULL;
    
    RAISE NOTICE '✅ Added column locale to user_profiles';
  ELSE
    RAISE NOTICE '✅ Column locale already exists in user_profiles';
  END IF;
END $$;

-- =====================================================
-- 2. VERIFY & ADD: profiles_tracked.last_contacted_at
-- =====================================================
-- Kiểm tra xem column last_contacted_at đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'last_contacted_at'
  ) THEN
    -- Thêm cột last_contacted_at vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.last_contacted_at IS 
      'Thời gian liên hệ cuối cùng (khi user click Ice Breaker hoặc Copy). Dùng để tính "Cần chăm sóc" nếu > 7 days.';
    
    -- Tạo index để tối ưu query profiles cần chăm sóc
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_last_contacted_at 
    ON public.profiles_tracked(last_contacted_at DESC NULLS LAST);
    
    -- Index composite để query profiles cần chăm sóc của user
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_user_contact_status 
    ON public.profiles_tracked(user_id, last_contacted_at DESC NULLS LAST);
    
    RAISE NOTICE '✅ Added column last_contacted_at to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column last_contacted_at already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 3. VERIFY & ADD: profiles_tracked.last_synced_at
-- =====================================================
-- Kiểm tra xem column last_synced_at đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'last_synced_at'
  ) THEN
    -- Thêm cột last_synced_at vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.last_synced_at IS 
      'Module 4.1: Thời gian sync cuối cùng (Shared Scraping - chỉ sync nếu > 1 giờ kể từ lần sync cuối)';
    
    -- Tạo index để tối ưu query profiles cần sync
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_last_synced_at 
    ON public.profiles_tracked(last_synced_at DESC NULLS LAST);
    
    RAISE NOTICE '✅ Added column last_synced_at to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column last_synced_at already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFY: profiles_tracked.last_interacted_at
-- =====================================================
-- Kiểm tra xem column last_interacted_at đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'last_interacted_at'
  ) THEN
    -- Thêm cột last_interacted_at vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN last_interacted_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.last_interacted_at IS 
      'Ngày tương tác cuối cùng (CRM Module v1.0)';
    
    -- Tạo index để tối ưu CRM queries
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_last_interacted_at 
    ON public.profiles_tracked(last_interacted_at DESC NULLS LAST);
    
    RAISE NOTICE '✅ Added column last_interacted_at to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column last_interacted_at already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 5. VERIFY: profiles_tracked.relationship_score
-- =====================================================
-- Kiểm tra xem column relationship_score đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'relationship_score'
  ) THEN
    -- Thêm cột relationship_score vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN relationship_score INTEGER DEFAULT 100;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.relationship_score IS 
      'Điểm sức khỏe mối quan hệ (0-100) (CRM Module v1.0)';
    
    -- Tạo index để tối ưu sort theo điểm sức khỏe
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_relationship_score 
    ON public.profiles_tracked(relationship_score DESC NULLS LAST);
    
    RAISE NOTICE '✅ Added column relationship_score to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column relationship_score already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 6. VERIFY: profiles_tracked.notify_telegram_chat_id
-- =====================================================
-- Kiểm tra xem column notify_telegram_chat_id đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'notify_telegram_chat_id'
  ) THEN
    -- Thêm cột notify_telegram_chat_id vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN notify_telegram_chat_id TEXT;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.notify_telegram_chat_id IS 
      'Telegram Chat ID để nhận thông báo (Module 3 - Smart Trigger)';
    
    RAISE NOTICE '✅ Added column notify_telegram_chat_id to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column notify_telegram_chat_id already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 7. VERIFY: profiles_tracked.notify_on_sales_opportunity
-- =====================================================
-- Kiểm tra xem column notify_on_sales_opportunity đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'notify_on_sales_opportunity'
  ) THEN
    -- Thêm cột notify_on_sales_opportunity vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN notify_on_sales_opportunity BOOLEAN DEFAULT true;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.notify_on_sales_opportunity IS 
      'Có nhận cảnh báo khi phát hiện Sales Opportunity không (Module 3)';
    
    RAISE NOTICE '✅ Added column notify_on_sales_opportunity to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column notify_on_sales_opportunity already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 8. VERIFY: profiles_tracked.is_in_feed
-- =====================================================
-- Kiểm tra xem column is_in_feed đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'is_in_feed'
  ) THEN
    -- Thêm cột is_in_feed vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN is_in_feed BOOLEAN DEFAULT false;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.is_in_feed IS 
      'User có muốn đưa profile này vào Newsfeed không (v3.2)';
    
    -- Tạo index để tối ưu Newsfeed queries
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_is_in_feed 
    ON public.profiles_tracked(user_id, is_in_feed) 
    WHERE is_in_feed = true;
    
    RAISE NOTICE '✅ Added column is_in_feed to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column is_in_feed already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 9. VERIFY: profiles_tracked.category
-- =====================================================
-- Kiểm tra xem column category đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'category'
  ) THEN
    -- Thêm cột category vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN category TEXT DEFAULT 'General';
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.category IS 
      'Phân loại: Có thể là default categories hoặc custom categories từ bảng categories';
    
    -- Tạo index để tối ưu filter theo category
    CREATE INDEX IF NOT EXISTS idx_profiles_tracked_category 
    ON public.profiles_tracked(category) 
    WHERE category IS NOT NULL;
    
    RAISE NOTICE '✅ Added column category to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column category already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 10. VERIFY: profiles_tracked.notes
-- =====================================================
-- Kiểm tra xem column notes đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'notes'
  ) THEN
    -- Thêm cột notes vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN notes TEXT;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.notes IS 
      'Ghi chú cá nhân (Premium feature)';
    
    RAISE NOTICE '✅ Added column notes to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column notes already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 11. VERIFY: profiles_tracked.has_new_update
-- =====================================================
-- Kiểm tra xem column has_new_update đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'has_new_update'
  ) THEN
    -- Thêm cột has_new_update vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN has_new_update BOOLEAN DEFAULT false;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.has_new_update IS 
      'Flag để đánh dấu có update mới (AI feature - coming soon)';
    
    RAISE NOTICE '✅ Added column has_new_update to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column has_new_update already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 12. VERIFY: profiles_tracked.rss_url
-- =====================================================
-- Kiểm tra xem column rss_url đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_tracked' 
    AND column_name = 'rss_url'
  ) THEN
    -- Thêm cột rss_url vào profiles_tracked
    ALTER TABLE public.profiles_tracked 
    ADD COLUMN rss_url TEXT;
    
    -- Comment cho cột
    COMMENT ON COLUMN public.profiles_tracked.rss_url IS 
      'Link RSS để check update (dùng cho tính năng tương lai)';
    
    RAISE NOTICE '✅ Added column rss_url to profiles_tracked';
  ELSE
    RAISE NOTICE '✅ Column rss_url already exists in profiles_tracked';
  END IF;
END $$;

-- =====================================================
-- 13. VERIFY: user_profiles.trial_started_at
-- =====================================================
-- Kiểm tra xem column trial_started_at đã tồn tại chưa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'trial_started_at'
  ) THEN
    -- Thêm cột trial_started_at vào user_profiles
    ALTER TABLE public.user_profiles 
    ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Comment cho cột
    COMMENT ON COLUMN public.user_profiles.trial_started_at IS 
      'Ngày bắt đầu trial (15 ngày miễn phí)';
    
    RAISE NOTICE '✅ Added column trial_started_at to user_profiles';
  ELSE
    RAISE NOTICE '✅ Column trial_started_at already exists in user_profiles';
  END IF;
END $$;

-- =====================================================
-- SUMMARY: Hiển thị tất cả columns đã verify
-- =====================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Đếm số columns trong profiles_tracked
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles_tracked';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total columns in profiles_tracked: %', v_count;
  RAISE NOTICE 'All required columns have been verified/added';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- ✅ HOÀN THÀNH!
-- =====================================================
-- Script này đã kiểm tra và thêm tất cả các columns cần thiết:
-- 
-- user_profiles:
--   ✅ locale
--   ✅ trial_started_at
--
-- profiles_tracked:
--   ✅ last_contacted_at
--   ✅ last_synced_at
--   ✅ last_interacted_at
--   ✅ relationship_score
--   ✅ notify_telegram_chat_id
--   ✅ notify_on_sales_opportunity
--   ✅ is_in_feed
--   ✅ category
--   ✅ notes
--   ✅ has_new_update
--   ✅ rss_url
--
-- Tất cả indexes cũng đã được tạo để tối ưu performance.
-- =====================================================

