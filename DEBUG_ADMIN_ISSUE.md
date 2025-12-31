# 🔍 Debug Admin Role Issue

## Vấn đề
User đã set `role = 'admin'` trong `user_profiles` nhưng không thấy link Admin trong UI.

## Các bước Debug

### Bước 1: Kiểm tra User ID khớp

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- Kiểm tra User ID trong auth.users
SELECT id, email, created_at 
FROM auth.users
WHERE email = 'tanloifmc@yahoo.com';

-- Kiểm tra User ID trong user_profiles
SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE email = 'tanloifmc@yahoo.com';

-- So sánh: ID phải GIỐNG NHAU
```

**Kết quả mong đợi**: ID trong cả 2 bảng phải giống nhau.

**Nếu ID khác nhau**: Đây là vấn đề! User đã đăng ký với email khác hoặc có nhiều accounts.

---

### Bước 2: Kiểm tra Console Logs

1. Mở terminal nơi chạy `npm run dev`
2. Refresh trang (F5 hoặc Ctrl+R)
3. Tìm các log sau:
   - `[getUserProfile] User ID: ...`
   - `[getUserProfile] User Email: ...`
   - `[getUserProfile] Profile found: ...`
   - `[isAdmin] Result: ...`

**Copy toàn bộ logs và gửi lại.**

---

### Bước 3: Kiểm tra RLS Policy

Chạy SQL sau để kiểm tra policies:

```sql
-- Xem tất cả policies của user_profiles
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

**Kết quả mong đợi**: Phải có 4 policies:
1. "Users can view their own profile"
2. "Admins can view all profiles"
3. "Users can update their own profile"
4. "Admins can update all profiles"

---

### Bước 4: Test Query trực tiếp

Chạy SQL sau (thay `YOUR_USER_ID` bằng ID từ Bước 1):

```sql
-- Test query với user ID cụ thể
SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE id = 'adc98fad-fa38-4165-ade2-4295da338d96'::uuid;
```

**Kết quả mong đợi**:
```
id                                   | email               | role  | is_premium
-------------------------------------|---------------------|-------|------------
adc98fad-fa38-4165-ade2-4295da338d96 | tanloifmc@yahoo.com | admin | false
```

---

### Bước 5: Kiểm tra Function is_admin_user()

Chạy SQL sau:

```sql
-- Test function is_admin_user()
SELECT public.is_admin_user() as is_admin;
```

**Lưu ý**: Function này chỉ hoạt động khi chạy trong context của user đã đăng nhập (trong Supabase SQL Editor, nó sẽ trả về `false` vì không có auth context).

---

## Giải pháp tạm thời: Disable RLS (CHỈ ĐỂ TEST)

⚠️ **CẢNH BÁO**: Chỉ dùng để test, sau đó phải bật lại RLS!

```sql
-- TẠM THỜI disable RLS để test
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Test lại ứng dụng
-- Nếu hoạt động → Vấn đề là RLS policy
-- Nếu không hoạt động → Vấn đề là code hoặc cache

-- SAU KHI TEST XONG, BẬT LẠI RLS:
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## Giải pháp khác: Kiểm tra Next.js Cache

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Hard refresh browser**:
   - Windows: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

3. **Clear browser cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Chọn "Cached images and files"

---

## Checklist Debug

- [ ] User ID trong `auth.users` và `user_profiles` khớp nhau
- [ ] Role trong `user_profiles` = `'admin'`
- [ ] Console logs hiển thị đúng user ID và role
- [ ] RLS policies đã được tạo đầy đủ
- [ ] Đã clear Next.js cache và browser cache
- [ ] Đã đăng xuất và đăng nhập lại

---

**📅 Last Updated**: 2024-12-19

