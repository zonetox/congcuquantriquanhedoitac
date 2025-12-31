# 🔧 Fix Admin Access Issue

## Vấn đề
Khi truy cập `/admin`, user bị redirect về `/login` hoặc `/` thay vì hiển thị Admin Dashboard.

## Nguyên nhân có thể

1. **RLS Policy chặn query**: Policy "Users can view their own profile" có thể không hoạt động đúng
2. **Query error không được handle đúng**: Khi query `user_profiles` bị lỗi, code trả về default role = 'user'
3. **User ID không khớp**: ID trong `auth.users` và `user_profiles` không giống nhau
4. **Session chưa được refresh**: Role mới chưa được load vào session

## Giải pháp đã áp dụng

### 1. Cải thiện Error Handling
- Thêm logging chi tiết cho mọi error case
- Log error code, message, details, hint
- Phân biệt giữa "profile not found" (PGRST116) và "RLS policy error"

### 2. Kiểm tra RLS Policies

Chạy SQL sau trong Supabase SQL Editor để kiểm tra policies:

```sql
-- Kiểm tra policies hiện tại
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
```

**Kết quả mong đợi**: Phải có ít nhất 2 policies cho SELECT:
1. "Users can view their own profile" - `auth.uid() = id`
2. "Admins can view all profiles" - `public.is_admin_user()`

### 3. Test Query trực tiếp

Chạy SQL sau để test query (thay `YOUR_USER_ID`):

```sql
-- Test query với user ID cụ thể
-- Lưu ý: Query này sẽ chạy với quyền của user hiện tại trong Supabase Dashboard
-- Nên có thể không phản ánh đúng RLS behavior trong app

SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE id = 'adc98fad-fa38-4165-ade2-4295da338d96'::uuid;
```

### 4. Kiểm tra Function is_admin_user()

```sql
-- Kiểm tra function có tồn tại không
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';
```

**Kết quả mong đợi**: Function phải tồn tại và có `security_type = 'DEFINER'`

### 5. Debug trong Production (Vercel)

1. **Xem Vercel Logs**:
   - Vào Vercel Dashboard → Project → Logs
   - Tìm các log `[getUserProfile]` và `[isAdmin]`
   - Kiểm tra error messages

2. **Kiểm tra Environment Variables**:
   - Đảm bảo `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã được set trong Vercel
   - Đảm bảo `SUPABASE_SERVICE_ROLE_KEY` đã được set (cho admin actions)

## Các bước Debug tiếp theo

### Bước 1: Kiểm tra User ID khớp

```sql
-- So sánh ID giữa auth.users và user_profiles
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  up.id as profile_id,
  up.email as profile_email,
  up.role,
  up.is_premium
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.email = 'tanloifmc@yahoo.com';
```

**Kết quả mong đợi**: `auth_id` và `profile_id` phải giống nhau, `role` phải là `'admin'`

### Bước 2: Test RLS Policy

```sql
-- Tạm thời disable RLS để test (CHỈ ĐỂ TEST!)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE email = 'tanloifmc@yahoo.com';

-- Nếu query thành công → Vấn đề là RLS policy
-- Nếu query vẫn lỗi → Vấn đề là khác (có thể là user ID không khớp)

-- SAU KHI TEST XONG, BẬT LẠI RLS:
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

### Bước 3: Kiểm tra Vercel Logs

Sau khi deploy code mới với improved logging:
1. Truy cập `/admin` trên production
2. Xem Vercel Logs
3. Tìm các log:
   - `[getUserProfile] User ID: ...`
   - `[getUserProfile] Error querying user_profiles: ...`
   - `[isAdmin] Result: ...`

## Giải pháp tạm thời (Nếu cần)

Nếu RLS policy là vấn đề và bạn cần fix ngay:

```sql
-- Option 1: Tạm thời disable RLS (KHÔNG KHUYẾN NGHỊ cho production)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: Sửa policy để cho phép user query profile của chính họ
-- (Policy này đã có, nhưng có thể cần recreate)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);
```

## Checklist

- [ ] Đã kiểm tra User ID khớp giữa `auth.users` và `user_profiles`
- [ ] Đã kiểm tra RLS policies tồn tại và đúng
- [ ] Đã kiểm tra function `is_admin_user()` tồn tại
- [ ] Đã xem Vercel logs để tìm error messages
- [ ] Đã test query trực tiếp trong Supabase SQL Editor
- [ ] Đã clear Next.js cache và browser cache
- [ ] Đã đăng xuất và đăng nhập lại sau khi set role = 'admin'

---

**📅 Last Updated**: 2024-12-19

