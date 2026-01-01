# 🔧 Cấu hình Environment Variables trên Vercel

## ⚠️ QUAN TRỌNG

File `.env.local` chỉ dùng cho **development** (local). Khi deploy lên Vercel, bạn **PHẢI** cấu hình Environment Variables trong Vercel Dashboard.

---

## 📋 Các biến môi trường cần cấu hình trên Vercel

### 1. Supabase (Bắt buộc)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Cách lấy**:
- Vào [Supabase Dashboard](https://supabase.com/dashboard)
- Chọn project → Settings → API
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Bảo mật cao)

---

### 2. OpenAI (Module 2B - AI Intelligence)

```
OPENAI_API_KEY=sk-your-openai-api-key
```

**Cách lấy**:
- Vào [OpenAI Platform](https://platform.openai.com/api-keys)
- Tạo API key mới hoặc copy key hiện có
- Format: `sk-...`

---

### 3. Telegram Bot (Module 3 - Smart Trigger)

```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

**Cách lấy**:
- Mở Telegram, tìm `@BotFather`
- Gửi `/newbot` → đặt tên bot → copy token
- Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

---

### 4. Lemon Squeezy (Optional - Cho Premium features)

```
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL=https://app.lemonsqueezy.com/my-account
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-secret
```

---

## 🚀 Cách cấu hình trên Vercel

### Bước 1: Vào Vercel Dashboard

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn

### Bước 2: Vào Settings → Environment Variables

1. Click vào project
2. Vào tab **Settings**
3. Click **Environment Variables** ở sidebar bên trái

### Bước 3: Thêm từng biến

1. Click **Add New**
2. Điền:
   - **Key**: Tên biến (ví dụ: `TELEGRAM_BOT_TOKEN`)
   - **Value**: Giá trị của biến
   - **Environment**: Chọn môi trường
     - ✅ **Production** (bắt buộc)
     - ✅ **Preview** (khuyến nghị)
     - ✅ **Development** (optional)

3. Click **Save**

### Bước 4: Redeploy

Sau khi thêm tất cả biến:
1. Vào tab **Deployments**
2. Click **...** (3 chấm) trên deployment mới nhất
3. Click **Redeploy**
4. Hoặc push code mới lên GitHub (Vercel sẽ tự động deploy)

---

## ✅ Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY` (nếu dùng AI features)
- [ ] `TELEGRAM_BOT_TOKEN` (nếu dùng notifications)
- [ ] `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL` (nếu dùng Premium)
- [ ] `LEMON_SQUEEZY_WEBHOOK_SECRET` (nếu dùng webhook)

---

## 🔒 Bảo mật

**⚠️ QUAN TRỌNG**:
- **KHÔNG BAO GIỜ** commit `.env.local` lên GitHub
- File `.env.local` đã có trong `.gitignore`
- Chỉ set Environment Variables trong Vercel Dashboard
- `NEXT_PUBLIC_*` variables có thể truy cập từ client-side
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN` chỉ dùng server-side

---

## 🧪 Kiểm tra

Sau khi cấu hình, kiểm tra:
1. Vercel deployment logs có lỗi về missing env vars không?
2. App có hoạt động đúng không?
3. AI features có hoạt động không? (nếu có `OPENAI_API_KEY`)
4. Telegram notifications có hoạt động không? (nếu có `TELEGRAM_BOT_TOKEN`)

---

## 📝 Lưu ý

- Mỗi lần thêm/sửa Environment Variables, cần **Redeploy** để áp dụng
- Environment Variables được encrypt trong Vercel
- Có thể set khác nhau cho Production, Preview, và Development


