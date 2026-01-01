-- ============================================
-- SQL FINALIZE V3.2 - Hoàn thiện cấu hình
-- ============================================
-- Mục đích: Kiểm tra và hoàn thiện các bước còn lại sau khi đã thêm các cột
-- Chạy file này trong Supabase SQL Editor

-- ============================================
-- 1. Kiểm tra Trigger đã tồn tại chưa
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles_tracked'
  AND trigger_name = 'update_profiles_tracked_updated_at';

-- Nếu không có kết quả, chạy các lệnh sau:

-- ============================================
-- 2. Tạo Function và Trigger cho updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_profiles_tracked_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Xóa trigger cũ nếu có và tạo mới
DROP TRIGGER IF EXISTS update_profiles_tracked_updated_at ON public.profiles_tracked;

CREATE TRIGGER update_profiles_tracked_updated_at
  BEFORE UPDATE ON public.profiles_tracked
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_tracked_updated_at();

-- ============================================
-- 3. Cập nhật updated_at cho các records cũ
-- ============================================
-- Nếu có records với updated_at = NULL, set bằng created_at
UPDATE public.profiles_tracked
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Kiểm tra số lượng records đã được update
SELECT 
  COUNT(*) as total_records,
  COUNT(updated_at) as records_with_updated_at,
  COUNT(*) - COUNT(updated_at) as records_without_updated_at
FROM public.profiles_tracked;

-- ============================================
-- 4. Tạo Indexes để tối ưu performance (Tùy chọn)
-- ============================================
-- Index cho category filter
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_category 
ON public.profiles_tracked(category) 
WHERE category IS NOT NULL;

-- Index cho is_in_feed filter (quan trọng cho Newsfeed)
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_is_in_feed 
ON public.profiles_tracked(user_id, is_in_feed) 
WHERE is_in_feed = true;

-- Index cho updated_at (để sort theo thời gian update)
CREATE INDEX IF NOT EXISTS idx_profiles_tracked_updated_at 
ON public.profiles_tracked(updated_at DESC);

-- ============================================
-- 5. Kiểm tra RLS Policy UPDATE
-- ============================================
-- Policy "Users can manage their own tracked profiles" với cmd = ALL
-- đã bao gồm UPDATE, nên không cần tạo policy riêng cho UPDATE
-- Nhưng nếu muốn có policy riêng rõ ràng hơn, có thể tạo:

-- (Tùy chọn) Tạo policy UPDATE riêng nếu chưa có
-- Lưu ý: Policy "Users can manage their own tracked profiles" đã bao gồm UPDATE
-- Nên chỉ tạo nếu muốn có policy riêng rõ ràng hơn
/*
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles_tracked;

CREATE POLICY "Users can update their own profiles"
  ON public.profiles_tracked
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
*/

-- ============================================
-- 6. Kiểm tra cuối cùng - Verify tất cả
-- ============================================
-- 6.1. Kiểm tra schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles_tracked'
ORDER BY ordinal_position;

-- 6.2. Kiểm tra RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'profiles_tracked';

-- 6.3. Kiểm tra Policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles_tracked';

-- 6.4. Kiểm tra Triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles_tracked';

-- 6.5. Kiểm tra Indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profiles_tracked'
ORDER BY indexname;

-- ============================================
-- ✅ HOÀN THÀNH
-- ============================================
-- Sau khi chạy các lệnh trên, database đã sẵn sàng cho v3.2:
-- ✅ Tất cả các cột đã có
-- ✅ Trigger tự động cập nhật updated_at
-- ✅ RLS đã được bật
-- ✅ Policies đã có (bao gồm UPDATE)
-- ✅ Indexes đã được tạo để tối ưu performance

