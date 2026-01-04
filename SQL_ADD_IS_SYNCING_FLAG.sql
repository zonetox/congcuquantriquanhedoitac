-- SQL Script: Thêm is_syncing flag vào profiles_tracked để xử lý race condition
-- Module 4.6: Engine & AI Optimization

-- Thêm column is_syncing (boolean, default false) vào profiles_tracked
-- Nếu column đã tồn tại, script sẽ không fail (IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles_tracked' 
        AND column_name = 'is_syncing'
    ) THEN
        ALTER TABLE profiles_tracked 
        ADD COLUMN is_syncing BOOLEAN NOT NULL DEFAULT false;
        
        -- Tạo index để tối ưu query check is_syncing
        CREATE INDEX IF NOT EXISTS idx_profiles_tracked_is_syncing 
        ON profiles_tracked(is_syncing) 
        WHERE is_syncing = true;
        
        RAISE NOTICE 'Column is_syncing added successfully to profiles_tracked';
    ELSE
        RAISE NOTICE 'Column is_syncing already exists in profiles_tracked';
    END IF;
END $$;

-- Verify column đã được thêm
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles_tracked' 
AND column_name = 'is_syncing';

