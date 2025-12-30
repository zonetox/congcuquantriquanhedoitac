# 🔐 Hướng dẫn đẩy code lên GitHub

## ⚠️ Vấn đề hiện tại

Git đang sử dụng credentials của user `tanloifmc` nhưng repository thuộc về `zonetox`, gây ra lỗi 403 Permission denied.

## ✅ Giải pháp nhanh nhất:

### Cách 1: Sử dụng Personal Access Token (Khuyến nghị)

1. **Tạo Token trên GitHub:**
   - Vào: https://github.com/settings/tokens/new
   - Token name: `Partner Relationship Management`
   - Expiration: Chọn thời hạn (90 days hoặc No expiration)
   - Scopes: Tích `repo` (full control of private repositories)
   - Click **Generate token**
   - **Copy token ngay** (chỉ hiển thị 1 lần!)

2. **Push code với token:**
   ```powershell
   # Thay YOUR_TOKEN bằng token bạn vừa tạo
   $token = "YOUR_TOKEN"
   git push https://$token@github.com/zonetox/congcuquantriquanhedoitac.git main
   ```

### Cách 2: Xóa credentials cũ và đăng nhập lại

```powershell
# Xóa credentials cũ
cmdkey /delete:git:https://github.com

# Hoặc xóa tất cả GitHub credentials
cmdkey /list | Select-String "github" | ForEach-Object { cmdkey /delete:$_.Line }

# Sau đó push lại, Windows sẽ hỏi credentials mới
git push -u origin main
# Nhập username: zonetox
# Nhập password: Sử dụng Personal Access Token (không phải password thật)
```

### Cách 3: Sử dụng SSH (Nếu đã có SSH key)

```powershell
# Đổi remote sang SSH
git remote set-url origin git@github.com:zonetox/congcuquantriquanhedoitac.git

# Push
git push -u origin main
```

## 📋 Checklist

- [ ] Repository đã được tạo trên GitHub: `zonetox/congcuquantriquanhedoitac`
- [ ] Repository đã được set là Public
- [ ] Đã tạo Personal Access Token với quyền `repo`
- [ ] Đã xóa credentials cũ của `tanloifmc`
- [ ] Đã đăng nhập với account `zonetox`

## 🚀 Sau khi push thành công

Code sẽ có sẵn tại: https://github.com/zonetox/congcuquantriquanhedoitac

