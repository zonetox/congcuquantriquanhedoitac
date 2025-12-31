# 🤖 HƯỚNG DẪN TƯƠNG TÁC VỚI AI (CURSOR/GEMINI)

## 📋 Mục đích

File này hướng dẫn cách tương tác hiệu quả với AI để phát triển tính năng mới mà không mắc lỗi về:
- ❌ Quên cấu trúc database
- ❌ Sai tên bảng/trường
- ❌ Code trùng lặp
- ❌ Kết nối database sai

---

## 🎯 QUY TRÌNH CHUẨN

### BƯỚC 1: Bắt đầu phiên chat mới

**Khi bạn muốn phát triển tính năng mới**, hãy copy template này:

```
Hãy đọc file SYSTEM_CONTEXT.md để hiểu cấu trúc database, thư mục, và quy tắc code hiện tại.

Dựa trên thông tin trong SYSTEM_CONTEXT.md, hãy thực hiện tính năng sau:

[MÔ TẢ TÍNH NĂNG MỚI - Càng chi tiết càng tốt]

Yêu cầu:
- Tuyệt đối KHÔNG thay đổi tên bảng, tên trường đã có trong database
- Sử dụng đúng cấu trúc thư mục và naming conventions
- Tuân thủ các quy tắc code trong SYSTEM_CONTEXT.md
- Nếu cần thêm bảng/trường mới, hãy đề xuất và chờ xác nhận trước khi implement
```

**Ví dụ thực tế**:

```
Hãy đọc file SYSTEM_CONTEXT.md để hiểu cấu trúc database, thư mục, và quy tắc code hiện tại.

Dựa trên thông tin trong SYSTEM_CONTEXT.md, hãy tạo Admin Dashboard với các tính năng:
1. Trang /admin để quản lý tất cả users
2. Hiển thị danh sách users với thông tin: email, premium status, số lượng profiles
3. Có thể xem chi tiết profiles của từng user
4. Có thể ban/unban user

Yêu cầu:
- Tuyệt đối KHÔNG thay đổi tên bảng profiles_tracked hoặc các trường đã có
- Sử dụng đúng cấu trúc thư mục (app/admin/, components/admin/)
- Tuân thủ authentication và security rules
- Nếu cần thêm bảng mới (ví dụ: admin_users), hãy đề xuất schema trước
```

---

### BƯỚC 2: Sau khi AI code xong

**Sau khi AI hoàn thành code và bạn đã test thành công**, hãy yêu cầu cập nhật tài liệu:

```
Tính năng đã hoạt động tốt. Bây giờ hãy cập nhật file SYSTEM_CONTEXT.md để phản ánh những thay đổi mới nhất:

- [Liệt kê các thay đổi: thêm bảng mới, thêm route mới, thêm component mới, thay đổi logic, etc.]

Ví dụ:
- Thêm bảng admin_users vào database schema
- Thêm route /app/admin/page.tsx
- Thêm component components/admin/UserList.tsx
- Thêm helper function isAdmin() trong lib/auth/helpers.ts
```

**⚠️ QUAN TRỌNG**: Luôn cập nhật SYSTEM_CONTEXT.md sau mỗi tính năng mới để đảm bảo tài liệu luôn đồng bộ với code.

---

### BƯỚC 3: Khi gặp lỗi

**Nếu AI code sai tên bảng/trường hoặc vi phạm quy tắc**, hãy nhắc nhở:

```
Bạn đã sử dụng sai [tên bảng/trường/logic]. 

Hãy đọc lại SYSTEM_CONTEXT.md phần "[Tên phần liên quan]" và sửa lại code cho đúng.

Ví dụ:
- Bạn đã dùng bảng "profiles" nhưng đúng phải là "profiles_tracked"
- Bạn đã dùng trường "name" nhưng đúng phải là "title"
- Bạn đã bypass authentication, hãy thêm check như trong SYSTEM_CONTEXT.md
```

---

## 💡 CÁC TÌNH HUỐNG THƯỜNG GẶP

### Tình huống 1: Thêm tính năng mới cần bảng mới

**Cách làm**:
1. Yêu cầu AI đề xuất schema trước
2. Review schema
3. Xác nhận với AI
4. Yêu cầu AI implement

**Template**:
```
Tôi muốn thêm tính năng [MÔ TẢ]. Tính năng này có thể cần bảng mới trong database.

Hãy đọc SYSTEM_CONTEXT.md và đề xuất:
1. Schema cho bảng mới (nếu cần)
2. Các trường cần thiết
3. Foreign keys (nếu có)
4. RLS policies (nếu cần)

Sau khi tôi xác nhận, bạn mới implement.
```

### Tình huống 2: Sửa bug hoặc cải thiện tính năng hiện có

**Cách làm**:
1. Mô tả bug/cải thiện
2. Yêu cầu AI đọc SYSTEM_CONTEXT.md để hiểu code hiện tại
3. Yêu cầu AI sửa/cải thiện

**Template**:
```
Có bug trong [TÍNH NĂNG]: [MÔ TẢ BUG]

Hãy đọc SYSTEM_CONTEXT.md để hiểu cấu trúc hiện tại, sau đó sửa bug này.

Lưu ý: Không thay đổi cấu trúc database hoặc tên biến đã có.
```

### Tình huống 3: Refactor code

**Cách làm**:
1. Yêu cầu AI đọc SYSTEM_CONTEXT.md
2. Yêu cầu AI refactor theo best practices
3. Đảm bảo không thay đổi functionality

**Template**:
```
Hãy đọc SYSTEM_CONTEXT.md và refactor [FILE/COMPONENT] để:
- Cải thiện code quality
- Tuân thủ quy tắc code trong SYSTEM_CONTEXT.md
- Giữ nguyên functionality

Lưu ý: Không thay đổi tên bảng, trường, hoặc API contracts.
```

---

## 🎨 ĐỀ XUẤT PHƯƠNG PHÁP TƯƠNG TÁC TỐT NHẤT

### 1. **Luôn bắt đầu với SYSTEM_CONTEXT.md**

✅ **NÊN**:
- Copy template ở BƯỚC 1 mỗi khi bắt đầu tính năng mới
- Yêu cầu AI đọc SYSTEM_CONTEXT.md trước khi code

❌ **KHÔNG NÊN**:
- Bắt đầu code ngay mà không nhắc AI đọc tài liệu
- Giả định AI nhớ cấu trúc từ phiên chat trước

### 2. **Chia nhỏ tính năng lớn**

✅ **NÊN**:
- Chia tính năng lớn thành các bước nhỏ
- Hoàn thành từng bước, test, rồi mới tiếp tục
- Cập nhật SYSTEM_CONTEXT.md sau mỗi bước

❌ **KHÔNG NÊN**:
- Yêu cầu AI làm quá nhiều thứ cùng lúc
- Bỏ qua bước test và cập nhật tài liệu

### 3. **Review và xác nhận trước khi implement**

✅ **NÊN**:
- Yêu cầu AI đề xuất approach trước khi code
- Review schema/design trước khi implement
- Xác nhận với AI trước khi bắt đầu code

❌ **KHÔNG NÊN**:
- Để AI code ngay mà không review approach
- Bỏ qua bước xác nhận schema/design

### 4. **Luôn cập nhật tài liệu**

✅ **NÊN**:
- Yêu cầu AI cập nhật SYSTEM_CONTEXT.md sau mỗi tính năng mới
- Review tài liệu để đảm bảo chính xác
- Commit tài liệu cùng với code

❌ **KHÔNG NÊN**:
- Bỏ qua bước cập nhật tài liệu
- Để tài liệu lỗi thời

### 5. **Sử dụng checklist**

✅ **NÊN**:
- Sử dụng checklist trong SYSTEM_CONTEXT.md trước khi commit
- Yêu cầu AI tự check checklist trước khi hoàn thành

---

## 📝 TEMPLATE NHANH

### Template 1: Tính năng mới đơn giản

```
Đọc SYSTEM_CONTEXT.md. Thêm tính năng [MÔ TẢ]. 
Không thay đổi database schema hiện có.
```

### Template 2: Tính năng mới cần database mới

```
Đọc SYSTEM_CONTEXT.md. Thêm tính năng [MÔ TẢ]. 
Đề xuất schema cho bảng mới (nếu cần) trước khi implement.
```

### Template 3: Sửa bug

```
Đọc SYSTEM_CONTEXT.md. Sửa bug: [MÔ TẢ BUG]. 
Không thay đổi cấu trúc hiện có.
```

### Template 4: Cập nhật tài liệu

```
Tính năng đã xong. Cập nhật SYSTEM_CONTEXT.md với:
- [Thay đổi 1]
- [Thay đổi 2]
- ...
```

---

## ✅ CHECKLIST TRƯỚC KHI HOÀN THÀNH TÍNH NĂNG

Trước khi kết thúc phiên chat, đảm bảo:

- [ ] AI đã đọc SYSTEM_CONTEXT.md
- [ ] Code sử dụng đúng tên bảng/trường
- [ ] Code tuân thủ quy tắc trong SYSTEM_CONTEXT.md
- [ ] Đã test tính năng
- [ ] Đã cập nhật SYSTEM_CONTEXT.md (nếu có thay đổi)
- [ ] Không có linter errors
- [ ] Code đã được commit và push

---

**📅 Last Updated**: 2024-12-19
**Version**: 1.0.0

