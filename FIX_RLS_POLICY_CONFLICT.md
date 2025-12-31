# 🔧 Fix RLS Policy Conflict

## Vấn đề phát hiện

Có **3 policies cho SELECT** trên bảng `user_profiles`:
1. **"Profiles visibility"** - Logic phức tạp với subquery
2. **"Users can view their own profile"** - `auth.uid() = id`
3. **"Admins can view all profiles"** - `is_admin_user()`

Policy "Profiles visibility" có logic:
```sql
(auth.uid() = id) OR 
((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
```

**Vấn đề**: Policy này đang query `user_profiles` trong policy check, có thể gây:
- Circular dependency
- Performance issues
- Conflict với các policies khác

## Giải pháp: Xóa policy conflict và giữ lại policies chuẩn

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- 1. Xóa policy "Profiles visibility" (policy cũ, không cần thiết)
DROP POLICY IF EXISTS "Profiles visibility" ON public.user_profiles;

-- 2. Đảm bảo 2 policies chuẩn tồn tại
-- Policy 1: User xem profile của chính họ
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- Policy 2: Admin xem tất cả profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (public.is_admin_user());

-- 3. Kiểm tra function is_admin_user() tồn tại và đúng
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Xác nhận chỉ còn 2 policies cho SELECT
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'SELECT'
ORDER BY policyname;
```

**Kết quả mong đợi**: Chỉ còn 2 policies cho SELECT:
1. "Admins can view all profiles"
2. "Users can view their own profile"

## Giải thích

### Tại sao policy "Profiles visibility" gây vấn đề?

1. **Circular dependency**: Policy đang query `user_profiles` trong policy check của chính nó
2. **Performance**: Subquery trong policy check có thể chậm
3. **Conflict**: Logic phức tạp có thể conflict với policies khác

### Tại sao 2 policies chuẩn đủ?

1. **"Users can view their own profile"**: 
   - User có thể xem profile của chính họ (`auth.uid() = id`)
   - Đơn giản, nhanh, không có subquery

2. **"Admins can view all profiles"**:
   - Admin có thể xem tất cả profiles (dùng function `is_admin_user()`)
   - Function được đánh dấu `SECURITY DEFINER` để bypass RLS khi check

### Cách hoạt động

Khi user query `user_profiles`:
1. Supabase kiểm tra **TẤT CẢ** policies cho SELECT
2. Nếu **BẤT KỲ** policy nào cho phép → Query thành công
3. Policy "Users can view their own profile" cho phép user xem profile của chính họ
4. Policy "Admins can view all profiles" cho phép admin xem tất cả (nếu `is_admin_user()` = true)

## Sau khi chạy SQL

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Đăng xuất** khỏi ứng dụng
3. **Đăng nhập lại** với email `tanloifmc@yahoo.com`
4. **Truy cập** `/admin` → Phải hoạt động!

## Kiểm tra kết quả

Sau khi chạy SQL, kiểm tra lại:

```sql
-- Xem tất cả policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;
```

**Kết quả mong đợi**:
- Chỉ có 2 policies cho SELECT (không còn "Profiles visibility")
- 2 policies cho UPDATE (giữ nguyên)

---

**📅 Last Updated**: 2024-12-19

