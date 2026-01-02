# 🔒 HƯỚNG DẪN ENABLE HAVEIBEENPWNED PASSWORD PROTECTION

## Mục đích
Supabase Auth có thể kiểm tra passwords bị leak trên HaveIBeenPwned.org để ngăn chặn users sử dụng passwords đã bị compromise.

---

## ⚠️ QUAN TRỌNG

**HaveIBeenPwned Protection** là một tính năng bảo mật quan trọng giúp:
- Ngăn chặn users sử dụng passwords đã bị leak trong các data breaches
- Tăng cường bảo mật cho ứng dụng
- Tuân thủ best practices về password security

---

## 📋 CÁCH ENABLE

### Bước 1: Mở Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn

### Bước 2: Vào Authentication Settings
1. Click vào **Authentication** trong sidebar bên trái
2. Click vào tab **Policies** hoặc **Settings**

### Bước 3: Enable HaveIBeenPwned
1. Tìm section **"Password Protection"** hoặc **"Security"**
2. Tìm toggle **"Enable HaveIBeenPwned password check"** hoặc **"Leaked password protection"**
3. **Bật toggle** để enable

**Lưu ý**: 
- Tùy thuộc vào version của Supabase, có thể nằm ở:
  - **Authentication** → **Settings** → **Password Protection**
  - **Authentication** → **Policies** → **Password Requirements**
  - **Project Settings** → **Auth** → **Security**

### Bước 4: Verify
1. Thử đăng ký với một password đã bị leak (ví dụ: "password123")
2. Nếu enable thành công, sẽ thấy error message về password bị compromise

---

## 🔍 NẾU KHÔNG TÌM THẤY OPTION

### Cách 1: Kiểm tra Supabase Version
- HaveIBeenPwned có thể chỉ có trong Supabase Pro plan hoặc Enterprise plan
- Kiểm tra plan hiện tại của bạn

### Cách 2: Sử dụng API
Nếu không có option trong UI, có thể enable qua API:

```bash
# Sử dụng Supabase Management API
curl -X PATCH 'https://api.supabase.com/v1/projects/{project_id}/config/auth' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "EXTERNAL_PASSWORD_CHECK_ENABLED": true
  }'
```

**Lưu ý**: Cần Supabase Management API access token.

### Cách 3: Contact Supabase Support
Nếu không tìm thấy option, liên hệ Supabase Support để được hỗ trợ.

---

## ✅ VERIFY SAU KHI ENABLE

### Test Case 1: Password bị leak
1. Thử đăng ký với email mới
2. Nhập password: `password123` (password phổ biến, có thể bị leak)
3. **Kỳ vọng**: Error message về password bị compromise

### Test Case 2: Password an toàn
1. Thử đăng ký với email mới
2. Nhập password mạnh: `MyStr0ng!P@ssw0rd2024`
3. **Kỳ vọng**: Đăng ký thành công

---

## 📝 LƯU Ý

1. **Performance**: HaveIBeenPwned check có thể làm tăng thời gian đăng ký một chút (vài trăm ms)
2. **Privacy**: Supabase chỉ gửi hash prefix của password đến HaveIBeenPwned API, không gửi full password
3. **Rate Limits**: HaveIBeenPwned API có rate limits, nhưng Supabase handle tự động

---

## 🔗 TÀI LIỆU THAM KHẢO

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)

---

**📅 Last Updated**: 2024-12-20  
**Status**: ✅ Ready to Enable

