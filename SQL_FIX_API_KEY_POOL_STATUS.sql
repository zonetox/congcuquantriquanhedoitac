-- ============================================
-- SQL FIX API_KEY_POOL - Add status column
-- ============================================
-- Mục đích: Thêm cột status và migrate dữ liệu từ is_active (nếu có)
-- Chạy file này trong Supabase SQL Editor

-- ============================================
-- 1. Kiểm tra schema hiện tại
-- ============================================
-- Chạy lệnh này trước để xem cấu trúc hiện tại:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'api_key_pool'
ORDER BY ordinal_position;

-- ============================================
-- 2. Thêm cột status (nếu chưa có)
-- ============================================
ALTER TABLE public.api_key_pool
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ============================================
-- 3. Migrate dữ liệu từ is_active sang status (nếu có cột is_active)
-- ============================================
-- Kiểm tra xem có cột is_active không
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'api_key_pool' 
      AND column_name = 'is_active'
  ) THEN
    -- Migrate: is_active = true -> status = 'active'
    -- is_active = false -> status = 'rate_limited'
    UPDATE public.api_key_pool
    SET status = CASE 
      WHEN is_active = true THEN 'active'
      ELSE 'rate_limited'
    END
    WHERE status IS NULL OR status = 'active';
    
    -- Xóa cột is_active sau khi migrate (tùy chọn - comment nếu muốn giữ lại)
    -- ALTER TABLE public.api_key_pool DROP COLUMN IF EXISTS is_active;
  END IF;
END $$;

-- ============================================
-- 4. Set default value cho status
-- ============================================
ALTER TABLE public.api_key_pool
ALTER COLUMN status SET DEFAULT 'active';

-- ============================================
-- 5. Update các records có status = NULL
-- ============================================
UPDATE public.api_key_pool
SET status = 'active'
WHERE status IS NULL;

-- ============================================
-- 6. Xóa cột error_count nếu không cần (tùy chọn)
-- ============================================
-- Nếu schema mới không có error_count, có thể xóa:
-- ALTER TABLE public.api_key_pool DROP COLUMN IF EXISTS error_count;

-- ============================================
-- 7. Verify schema cuối cùng
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'api_key_pool'
ORDER BY ordinal_position;

-- ============================================
-- ✅ HOÀN THÀNH
-- ============================================
-- Sau khi chạy các lệnh trên:
-- ✅ Cột status đã được thêm
-- ✅ Dữ liệu đã được migrate từ is_active (nếu có)
-- ✅ Tất cả records có status = 'active' (default)

