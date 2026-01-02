# Hướng dẫn cấu hình Telegram Bot

## Bước 1: Thêm biến môi trường vào `.env.local`

Mở file `.env.local` trong thư mục gốc của project và thêm các dòng sau:

```env
TELEGRAM_BOT_TOKEN=8585654604:AAF9NXUvL6joDxqxS98rQNoKGbSp18v-Lwk
TELEGRAM_CHAT_ID=584207194
```

**Lưu ý:**
- File `.env.local` không được commit lên Git (đã có trong `.gitignore`)
- Đảm bảo không có khoảng trắng thừa hoặc dấu ngoặc kép không cần thiết
- Sau khi thêm, khởi động lại development server (`npm run dev`)

## Bước 2: Cấu hình trên Vercel (nếu deploy)

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm 2 biến môi trường:
   - `TELEGRAM_BOT_TOKEN` = `8585654604:AAF9NXUvL6joDxqxS98rQNoKGbSp18v-Lwk`
   - `TELEGRAM_CHAT_ID` = `584207194` (optional, có thể để user tự nhập trong Settings)

3. Redeploy project để áp dụng thay đổi

## Bước 3: Kiểm tra kết nối

1. Đăng nhập vào ứng dụng
2. Vào Settings → Cấu hình thông báo
3. Nhập Telegram Chat ID của bạn (lấy từ @userinfobot)
4. Nhấn "Gửi tin thử nghiệm"
5. Kiểm tra Telegram để xác nhận nhận được tin nhắn

## Lưu ý bảo mật

- **KHÔNG** commit file `.env.local` lên Git
- **KHÔNG** chia sẻ `TELEGRAM_BOT_TOKEN` công khai
- Chỉ sử dụng `TELEGRAM_CHAT_ID` trong `.env.local` cho testing, production nên để user tự nhập trong Settings


