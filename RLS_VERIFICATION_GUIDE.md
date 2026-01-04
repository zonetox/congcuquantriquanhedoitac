# 🔒 RLS VERIFICATION GUIDE

## Mục Đích

Verify Row Level Security (RLS) policies để đảm bảo không có lỗ hổng rò rỉ dữ liệu giữa các users.

---

## 📋 Cách Thực Hiện

### Bước 1: Chạy Verification Script

1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung file `SQL_VERIFY_RLS_POLICIES_SIMPLE.sql`
3. Paste vào SQL Editor
4. Click **"Run"** hoặc nhấn **Ctrl+Enter**
5. Kiểm tra kết quả trong tab **"Results"**

### Bước 2: Kiểm Tra Kết Quả

Script sẽ trả về các bảng kết quả:

#### 1. RLS Status Check
- Kiểm tra xem RLS có được enable trên tất cả tables không
- **Kết quả mong đợi**: Tất cả tables phải có `rls_enabled = true`

#### 2. RLS Policies Detail
- Kiểm tra các policies đã được tạo
- **Kết quả mong đợi**: Mỗi table phải có policies cho SELECT, INSERT, UPDATE, DELETE

#### 3. Policy Summary
- Tóm tắt số lượng policies trên mỗi table
- **Kết quả mong đợi**: 
  - `profiles_tracked`: Có policies cho tất cả operations
  - `profile_posts`: Có policy SELECT (users chỉ thấy posts từ profiles họ track)
  - `user_post_interactions`: Có policies cho tất cả operations
  - `user_profiles`: Có policies cho SELECT, UPDATE
  - `categories`: Có policies cho tất cả operations
  - `api_key_pool`: Có policies cho SELECT (admin only)

---

## ✅ Kết Quả Mong Đợi

### Tables và Policies Cần Có

| Table | RLS Enabled | Policies Cần Có |
|-------|-------------|-----------------|
| `profiles_tracked` | ✅ true | SELECT, INSERT, UPDATE, DELETE |
| `profile_posts` | ✅ true | SELECT (users chỉ thấy posts từ profiles họ track) |
| `user_post_interactions` | ✅ true | SELECT, INSERT, UPDATE, DELETE |
| `user_profiles` | ✅ true | SELECT, UPDATE |
| `categories` | ✅ true | SELECT, INSERT, UPDATE, DELETE |
| `api_key_pool` | ✅ true | SELECT (admin only) |

---

## 🔍 Verification Checklist

Sau khi chạy script, verify các điểm sau:

- [ ] Tất cả tables có `rls_enabled = true`
- [ ] `profiles_tracked` có policies cho tất cả operations
- [ ] `profile_posts` có policy SELECT với điều kiện đúng (users chỉ thấy posts từ profiles họ track)
- [ ] `user_post_interactions` có policies cho tất cả operations
- [ ] `user_profiles` có policies cho SELECT và UPDATE
- [ ] `categories` có policies cho tất cả operations
- [ ] `api_key_pool` có policy SELECT với điều kiện admin only

---

## ⚠️ Lưu Ý

1. **Không thay đổi policies**: Script này chỉ để verify, không thay đổi database
2. **Nếu thiếu policies**: Cần tạo policies mới bằng các SQL scripts tương ứng
3. **Test sau khi verify**: Sau khi verify, test các tính năng để đảm bảo RLS hoạt động đúng

---

## 📝 Test Cases

Sau khi verify RLS, test các scenarios sau:

1. **User A không thể thấy profiles của User B**
   - Login với User A
   - Verify chỉ thấy profiles của User A

2. **User A không thể thấy posts từ profiles của User B**
   - Login với User A
   - Verify chỉ thấy posts từ profiles User A đang track

3. **User A không thể update/delete profiles của User B**
   - Login với User A
   - Thử update/delete profile của User B → Phải fail

4. **Admin có thể thấy tất cả**
   - Login với Admin
   - Verify có thể thấy tất cả profiles và users

---

**Cập nhật**: 2024
**Version**: 1.0

