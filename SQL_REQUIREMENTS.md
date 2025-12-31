# 📋 SQL REQUIREMENTS - Các lệnh SQL cần thực hiện thủ công

> **Mục đích**: File này chứa các lệnh SQL cần được thực hiện thủ công trong Supabase SQL Editor vì không thể tự động hóa qua code.

---

## ⚠️ LƯU Ý QUAN TRỌNG

- **KHÔNG** chạy các lệnh SQL này trừ khi bạn hiểu rõ tác động của chúng
- **SAO LƯU** database trước khi chạy các lệnh migration
- Chạy từng lệnh một và kiểm tra kết quả
- Nếu có lỗi, dừng lại và kiểm tra

---

## 1. Thêm Role vào User Metadata (Bắt buộc)

### Mô tả
Thêm cột `role` vào `user_metadata` của Supabase Auth. Role mặc định là `'user'`, chỉ admin mới có `role === 'admin'`.

### Lệnh SQL

**Lưu ý**: Supabase Auth không có bảng `auth.users` trực tiếp để query. Thay vào đó, role sẽ được lưu trong `user_metadata` và được quản lý qua Admin API.

**Cách thực hiện**:

1. **Option 1: Thêm role cho user hiện tại thủ công** (Khuyến nghị cho development)
   - Vào Supabase Dashboard → Authentication → Users
   - Chọn user bạn muốn set làm admin
   - Click "Edit User"
   - Trong phần "User Metadata", thêm:
     ```json
     {
       "role": "admin"
     }
     ```
   - Hoặc merge với metadata hiện có:
     ```json
     {
       "is_premium": true,
       "role": "admin"
     }
     ```

2. **Option 2: Sử dụng SQL Function** (Nếu cần tự động hóa)
   
   Tạo function để set role cho user (chạy trong Supabase SQL Editor):
   
   ```sql
   -- Function để set role cho user (chỉ dùng với Service Role Key)
   -- Lưu ý: Function này chỉ có thể được gọi từ server-side với Admin Client
   -- Không thể gọi trực tiếp từ SQL Editor vì cần Admin API
   ```

   **Thực tế**: Không thể update `user_metadata` trực tiếp qua SQL. Phải dùng Admin API hoặc Supabase Dashboard.

### Cách kiểm tra

Sau khi thêm role, kiểm tra bằng cách:

1. Đăng nhập với user đó
2. Truy cập `/admin` - nếu có role `admin`, sẽ thấy trang admin
3. Nếu không có role `admin`, sẽ bị redirect hoặc hiển thị "Access Denied"

### Migration Script (Cho tương lai)

Nếu cần set role mặc định cho tất cả users hiện có:

```sql
-- Lưu ý: Script này KHÔNG thể chạy trực tiếp vì user_metadata không thể update qua SQL
-- Phải dùng Admin API từ server-side code

-- Thay vào đó, tạo một script Node.js để chạy một lần:
-- node scripts/set-default-roles.js
```

**Script Node.js mẫu** (tạo file `scripts/set-default-roles.js`):

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setDefaultRoles() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  for (const user of users) {
    // Chỉ set role nếu chưa có
    if (!user.user_metadata?.role) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            role: 'user' // Default role
          }
        }
      );

      if (updateError) {
        console.error(`Error updating user ${user.id}:`, updateError);
      } else {
        console.log(`Set role 'user' for ${user.email}`);
      }
    }
  }
}

setDefaultRoles();
```

---

## 2. Tạo Admin User (Thủ công)

### Cách thực hiện

1. Vào Supabase Dashboard → Authentication → Users
2. Tìm user bạn muốn set làm admin
3. Click "Edit User"
4. Trong "User Metadata", thêm hoặc cập nhật:
   ```json
   {
     "role": "admin"
   }
   ```

### Lưu ý

- Chỉ nên có 1-2 admin users trong development
- Trong production, nên có process rõ ràng để quản lý admin users
- Không nên hardcode admin emails trong code

---

## ✅ CHECKLIST

Sau khi hoàn thành:

- [ ] Đã thêm `role: "admin"` vào user metadata của ít nhất 1 user (qua Supabase Dashboard)
- [ ] Đã test truy cập `/admin` với user admin → thành công
- [ ] Đã test truy cập `/admin` với user thường → bị chặn/redirect
- [ ] Đã verify role được lưu đúng trong `user_metadata`

---

## 📝 GHI CHÚ

- Role được lưu trong `user_metadata` của Supabase Auth
- Không thể query/update `user_metadata` trực tiếp qua SQL
- Phải dùng Admin API hoặc Supabase Dashboard
- Code sẽ check `user.user_metadata?.role === 'admin'` để phân quyền

---

**📅 Last Updated**: 2024-12-19
**Version**: 1.0.0

