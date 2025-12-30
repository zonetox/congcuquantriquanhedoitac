# Hướng dẫn đẩy code lên GitHub

## ⚠️ Vấn đề Authentication

Git đang sử dụng credentials của user `tanloifmc` nhưng repository thuộc về `zonetox`.

## 🔧 Giải pháp:

### Cách 1: Sử dụng Personal Access Token (Khuyến nghị)

1. **Tạo Personal Access Token trên GitHub:**
   - Truy cập: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Đặt tên: "Partner Relationship Management"
   - Chọn scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy token ngay** (chỉ hiển thị 1 lần)

2. **Push code với token:**
   ```bash
   git push https://YOUR_TOKEN@github.com/zonetox/congcuquantriquanhedoitac.git main
   ```
   (Thay YOUR_TOKEN bằng token bạn vừa tạo)

### Cách 2: Sử dụng GitHub CLI

```bash
# Cài đặt GitHub CLI (nếu chưa có)
# Sau đó:
gh auth login
gh repo set-default zonetox/congcuquantriquanhedoitac
git push -u origin main
```

### Cách 3: Cấu hình Git Credential Manager

```bash
# Xóa credentials cũ
git credential-manager-core erase
# Hoặc trên Windows:
git credential-manager erase https://github.com

# Sau đó push lại, Git sẽ hỏi credentials mới
git push -u origin main
```

### Cách 4: Sử dụng SSH (Nếu đã setup SSH key)

```bash
git remote set-url origin git@github.com:zonetox/congcuquantriquanhedoitac.git
git push -u origin main
```

## 📝 Lưu ý

- Đảm bảo bạn đã login vào GitHub với account `zonetox`
- Repository phải là public hoặc bạn có quyền truy cập
- Token phải có quyền `repo`

