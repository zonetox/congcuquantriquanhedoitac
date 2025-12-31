# ✅ Xác nhận Admin Access

## Tình trạng hiện tại

Bạn đã có:
- ✅ `role = 'admin'` trong database
- ✅ `is_premium = false` (điều này BÌNH THƯỜNG, không ảnh hưởng admin access)

## Vấn đề

Mặc dù `role = 'admin'` nhưng vẫn không truy cập được `/admin` → bị redirect về `/login` hoặc `/`.

## Nguyên nhân có thể

1. **RLS Policy chặn query**: Query `user_profiles` bị chặn bởi RLS policy
2. **User ID không khớp**: ID trong session không khớp với ID trong database
3. **Query error**: Query bị lỗi nhưng không được log đúng cách

## Các bước kiểm tra

### Bước 1: Xác nhận User ID khớp

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- So sánh ID giữa auth.users và user_profiles
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  up.id as profile_id,
  up.email as profile_email,
  up.role,
  up.is_premium,
  CASE 
    WHEN au.id = up.id THEN '✅ KHỚP'
    ELSE '❌ KHÔNG KHỚP'
  END as id_match
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.email = 'tanloifmc@yahoo.com';
```

**Kết quả mong đợi**:
- `auth_id` và `profile_id` phải GIỐNG NHAU
- `id_match` phải là `✅ KHỚP`
- `role` phải là `'admin'`

### Bước 2: Test Query trực tiếp (với Service Role)

Chạy SQL sau để test query (sẽ bypass RLS):

```sql
-- Test query với Service Role (bypass RLS)
-- Lưu ý: Query này chỉ test xem data có tồn tại không
SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE id = 'adc98fad-fa38-4165-ade2-4295da338d96'::uuid;
```

**Kết quả mong đợi**: Phải trả về 1 row với `role = 'admin'`

### Bước 3: Kiểm tra RLS Policies

```sql
-- Xem tất cả policies của user_profiles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

**Kết quả mong đợi**: Phải có ít nhất 2 policies cho SELECT:
1. "Users can view their own profile" - `auth.uid() = id`
2. "Admins can view all profiles" - `public.is_admin_user()`

### Bước 4: Test Function is_admin_user()

```sql
-- Test function (sẽ trả về false vì không có auth context trong SQL Editor)
-- Nhưng có thể kiểm tra xem function có tồn tại không
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';
```

**Kết quả mong đợi**: Function phải tồn tại và có `security_type = 'DEFINER'`

## Giải pháp tạm thời (Nếu RLS là vấn đề)

Nếu sau khi kiểm tra, bạn phát hiện RLS policy là vấn đề, có thể tạm thời fix bằng cách:

### Option 1: Recreate Policy (Khuyến nghị)

```sql
-- Xóa và tạo lại policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);
```

### Option 2: Tạm thời disable RLS (CHỈ ĐỂ TEST)

```sql
-- ⚠️ CẢNH BÁO: Chỉ dùng để test, sau đó phải bật lại!
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Test lại ứng dụng
-- Nếu hoạt động → Vấn đề là RLS policy
-- Nếu không hoạt động → Vấn đề là khác

-- SAU KHI TEST XONG, BẬT LẠI RLS:
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

## Debug trong Production (Vercel)

Sau khi deploy code mới với improved logging:

1. **Xem Vercel Logs**:
   - Vào Vercel Dashboard → Project → Logs
   - Truy cập `/admin` trên production
   - Tìm các log:
     - `[getUserProfile] User ID: ...`
     - `[getUserProfile] Error querying user_profiles: ...`
     - `[isAdmin] Result: ...`

2. **Kiểm tra Error Messages**:
   - Nếu thấy `PGRST116` → Profile không tồn tại
   - Nếu thấy `42501` → RLS policy chặn
   - Nếu thấy error khác → Cần xem chi tiết

## Lưu ý về is_premium

**`is_premium = false` là BÌNH THƯỜNG và KHÔNG ảnh hưởng đến admin access.**

- `role = 'admin'` → Quyền admin (truy cập `/admin`)
- `is_premium = true/false` → Premium membership (unlimited profiles, notes, etc.)

Hai giá trị này độc lập với nhau. Bạn có thể là admin nhưng không phải premium user.

---

**📅 Last Updated**: 2024-12-19

