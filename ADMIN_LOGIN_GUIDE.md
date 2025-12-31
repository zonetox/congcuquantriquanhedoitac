# 🔐 Hướng dẫn Đăng nhập Admin

## Tình huống của bạn

Bạn đã set `role = 'admin'` cho email `tanloifmc@yahoo.com` trong bảng `user_profiles`, nhưng không biết password để đăng nhập.

---

## ✅ Giải pháp

### Trường hợp 1: Bạn đã có tài khoản với email này

**Nếu bạn đã từng đăng ký với email `tanloifmc@yahoo.com` trước đây:**

1. Truy cập trang đăng nhập: `/login`
2. Nhập:
   - **Email**: `tanloifmc@yahoo.com`
   - **Password**: Password mà bạn đã dùng khi đăng ký
3. Click "Sign In"
4. Sau khi đăng nhập thành công, bạn sẽ có quyền Admin và có thể truy cập `/admin`

---

### Trường hợp 2: Bạn chưa có tài khoản

**Nếu bạn chưa từng đăng ký với email này:**

1. Truy cập trang đăng nhập: `/login`
2. Click "Don't have an account? Sign up now" để chuyển sang chế độ Sign Up
3. Nhập:
   - **Email**: `tanloifmc@yahoo.com`
   - **Password**: Tạo password mới (tối thiểu 6 ký tự)
4. Click "Sign Up"
5. Sau khi đăng ký thành công:
   - Trigger sẽ tự động tạo record trong `user_profiles` với `role = 'user'` (mặc định)
   - Bạn cần chạy SQL để update `role = 'admin'` (xem bên dưới)

---

## 🔄 Reset Password (Nếu quên password)

Nếu bạn quên password, bạn có 2 lựa chọn:

### Cách 1: Reset password qua Supabase Dashboard

1. Truy cập [Supabase Dashboard](https://app.supabase.com)
2. Vào project của bạn
3. Vào **Authentication** → **Users**
4. Tìm user với email `tanloifmc@yahoo.com`
5. Click vào user đó
6. Click **"Reset Password"** hoặc **"Send Password Reset Email"**
7. User sẽ nhận email để reset password

### Cách 2: Reset password thủ công (Supabase SQL Editor)

```sql
-- Reset password cho user (thay 'NEW_PASSWORD' bằng password mới)
-- Lưu ý: Password phải được hash, nên cách này phức tạp hơn
-- Khuyến nghị: Dùng Cách 1 (Reset qua Dashboard)
```

**⚠️ Khuyến nghị**: Dùng Cách 1 (Reset qua Supabase Dashboard) vì an toàn và dễ hơn.

---

## ✅ Xác nhận Role Admin sau khi đăng nhập

Sau khi đăng nhập thành công, kiểm tra role trong Supabase SQL Editor:

```sql
-- Kiểm tra role của user
SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE email = 'tanloifmc@yahoo.com';
```

**Kết quả mong đợi**:
```
id                                   | email                  | role  | is_premium
-------------------------------------|------------------------|-------|------------
[UUID của user]                      | tanloifmc@yahoo.com    | admin | false
```

Nếu `role` vẫn là `'user'`, chạy SQL sau để set admin:

```sql
-- Set admin role cho email của bạn
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'tanloifmc@yahoo.com';

-- Xác nhận đã update thành công
SELECT id, email, role, is_premium 
FROM public.user_profiles
WHERE email = 'tanloifmc@yahoo.com';
```

**Kết quả sau khi chạy SQL**:
```
id                                   | email               | role  | is_premium
-------------------------------------|---------------------|-------|------------
adc98fad-fa38-4165-ade2-4295da338d96 | tanloifmc@yahoo.com | admin | false
```

⚠️ **Lưu ý**: Sau khi chạy SQL, bạn cần **đăng xuất và đăng nhập lại** để hệ thống nhận diện role mới.

---

## 🧪 Test quyền Admin

Sau khi đăng nhập và xác nhận `role = 'admin'`:

1. Truy cập `/admin` → Phải hiển thị Admin Dashboard
2. Truy cập `/` → Phải thấy link "Admin" trong Header/Sidebar
3. Nếu truy cập `/admin` với user thường → Phải bị redirect về `/`

---

## 📝 Lưu ý quan trọng

1. **Password không được lưu trong database**: Supabase chỉ lưu hash của password, không lưu password gốc. Vì vậy:
   - Nếu quên password → Phải reset qua Supabase Dashboard
   - Không thể "xem" password cũ

2. **Role được lưu trong `user_profiles`**: 
   - Role không liên quan đến password
   - Bạn có thể set role = 'admin' trước hoặc sau khi đăng nhập
   - Sau khi set role = 'admin', user sẽ có quyền admin ngay lập tức

3. **Trigger tự động tạo profile**:
   - Khi user mới đăng ký, trigger sẽ tự động tạo record trong `user_profiles` với `role = 'user'`
   - Nếu bạn đã set `role = 'admin'` trước khi user đăng ký, trigger sẽ ghi đè thành `'user'`
   - **Giải pháp**: Set `role = 'admin'` SAU KHI user đã đăng ký

---

## 🔍 Troubleshooting

### Vấn đề: "Invalid login credentials"

**Nguyên nhân**: Email hoặc password không đúng

**Giải pháp**:
1. Kiểm tra lại email: `tanloifmc@yahoo.com`
2. Thử reset password qua Supabase Dashboard
3. Nếu vẫn lỗi, kiểm tra xem user có tồn tại trong `auth.users` không:

```sql
-- Kiểm tra user trong auth.users
SELECT id, email, created_at 
FROM auth.users
WHERE email = 'tanloifmc@yahoo.com';
```

### Vấn đề: "Đăng nhập thành công nhưng không vào được /admin"

**Nguyên nhân**: Role chưa được set thành 'admin'

**Giải pháp**:
1. Chạy SQL để set role:

```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'tanloifmc@yahoo.com';
```

2. Đăng xuất và đăng nhập lại
3. Thử truy cập `/admin` lại

---

**📅 Last Updated**: 2024-12-19

