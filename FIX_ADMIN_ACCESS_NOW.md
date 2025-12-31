# 🔧 Fix Admin Access - Hướng dẫn chi tiết

## ✅ Đã xác nhận

- User ID khớp: `✅ KHỚP`
- Role = `'admin'` trong database
- Vấn đề: Code không đọc được role từ database

## 🔍 Nguyên nhân có thể

Vì query trực tiếp trong SQL Editor hoạt động nhưng code không đọc được, vấn đề có thể là:

1. **RLS Policy chặn query từ application** (mặc dù SQL Editor bypass RLS)
2. **Session chưa được refresh** sau khi set role = 'admin'
3. **Query bị lỗi** nhưng không được log trong production

## 🛠️ Giải pháp

### Giải pháp 1: Kiểm tra và Fix RLS Policies (Khuyến nghị)

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- 1. Kiểm tra policies hiện tại
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
- "Users can view their own profile" - `auth.uid() = id`
- "Admins can view all profiles" - `public.is_admin_user()`

**Nếu thiếu policy**, chạy SQL sau:

```sql
-- Recreate policy cho user xem profile của chính họ
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Recreate policy cho admin xem tất cả profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (public.is_admin_user());
```

### Giải pháp 2: Kiểm tra Function is_admin_user()

```sql
-- Kiểm tra function có tồn tại và đúng không
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin_user';
```

**Nếu function không tồn tại hoặc sai**, chạy SQL sau:

```sql
-- Recreate function is_admin_user()
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Giải pháp 3: Test RLS Policy (Tạm thời disable để test)

⚠️ **CẢNH BÁO**: Chỉ dùng để test, sau đó phải bật lại RLS!

```sql
-- Tạm thời disable RLS để test
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Test lại ứng dụng
-- Truy cập /admin trên production
-- Nếu hoạt động → Vấn đề là RLS policy
-- Nếu không hoạt động → Vấn đề là khác (có thể là session)

-- SAU KHI TEST XONG, BẬT LẠI RLS:
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Và recreate policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (public.is_admin_user());
```

### Giải pháp 4: Clear Session và Đăng nhập lại

1. **Đăng xuất** khỏi ứng dụng
2. **Clear browser cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Chọn "Cached images and files"
3. **Đăng nhập lại** với email `tanloifmc@yahoo.com`
4. **Truy cập** `/admin` lại

### Giải pháp 5: Xem Vercel Logs (Sau khi deploy code mới)

Sau khi deploy code mới với improved logging:

1. **Vào Vercel Dashboard** → Project → Logs
2. **Truy cập** `/admin` trên production
3. **Tìm các log**:
   - `[getUserProfile] User ID: ...`
   - `[getUserProfile] Error querying user_profiles: ...`
   - `[isAdmin] Result: ...`

**Các error codes phổ biến**:
- `PGRST116` → Profile không tồn tại (nhưng bạn đã có profile)
- `42501` → RLS policy chặn (đây có thể là vấn đề)
- `PGRST301` → Permission denied

## 📋 Checklist Debug

- [ ] Đã kiểm tra User ID khớp → ✅ Đã xác nhận
- [ ] Đã kiểm tra RLS policies tồn tại và đúng
- [ ] Đã kiểm tra function `is_admin_user()` tồn tại
- [ ] Đã test tạm thời disable RLS (nếu cần)
- [ ] Đã clear browser cache và đăng nhập lại
- [ ] Đã xem Vercel logs để tìm error messages

## 🎯 Hành động tiếp theo

1. **Chạy SQL ở Giải pháp 1** để kiểm tra và recreate policies
2. **Chạy SQL ở Giải pháp 2** để kiểm tra function
3. **Test lại** truy cập `/admin` trên production
4. **Nếu vẫn không hoạt động**, chạy SQL ở Giải pháp 3 để test tạm thời disable RLS
5. **Xem Vercel logs** để tìm error messages cụ thể

---

**📅 Last Updated**: 2024-12-19

