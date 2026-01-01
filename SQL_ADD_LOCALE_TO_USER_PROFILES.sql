-- SQL Script: Thêm column locale vào bảng user_profiles
-- Mục đích: Lưu language preference của user vào database

-- 1. Thêm column locale vào bảng user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'vi', 'es', 'fr', 'de', 'ja', 'zh'));

-- 2. Tạo index để tối ưu query (optional, nhưng tốt cho performance)
CREATE INDEX IF NOT EXISTS idx_user_profiles_locale ON public.user_profiles(locale);

-- 3. Comment cho column
COMMENT ON COLUMN public.user_profiles.locale IS 'Language preference của user (en, vi, es, fr, de, ja, zh). Default: en';

-- 4. Update existing users: Set locale = 'en' nếu chưa có giá trị
UPDATE public.user_profiles 
SET locale = 'en' 
WHERE locale IS NULL;

-- 5. Set NOT NULL constraint sau khi đã update tất cả records
ALTER TABLE public.user_profiles 
ALTER COLUMN locale SET NOT NULL;

-- ✅ Hoàn thành!
-- Sau khi chạy script này, bảng user_profiles sẽ có column locale với default value là 'en'

