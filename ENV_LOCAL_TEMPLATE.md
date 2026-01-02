# 📋 Template cho file `.env.local`

## ⚠️ QUAN TRỌNG

1. **Copy nội dung dưới đây vào file `.env.local`** (tạo mới nếu chưa có)
2. **Điền các giá trị thực tế** của bạn vào các biến
3. **KHÔNG BAO GIỜ** commit file `.env.local` lên Git (đã có trong `.gitignore`)

---

## 📝 Nội dung file `.env.local`

```env
# ============================================
# ENVIRONMENT VARIABLES
# ============================================
# Copy các dòng dưới đây vào file .env.local và điền giá trị thực tế

# ============================================
# 1. SUPABASE (Bắt buộc)
# ============================================
# Lấy từ: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# 2. OPENAI API (Module 2B - AI Intelligence)
# ============================================
# Lấy từ: https://platform.openai.com/api-keys
# Format: sk-...
OPENAI_API_KEY=sk-your-openai-api-key-here

# ============================================
# 3. TELEGRAM BOT (Module 3 - Smart Trigger)
# ============================================
# Lấy từ: Telegram → @BotFather → /newbot
# Format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# ============================================
# 4. RESEND API (Module 3 - Email Notifications)
# ============================================
# Lấy từ: https://resend.com/api-keys
# Format: re_...
# ⚠️ Optional: Chỉ cần nếu muốn dùng email notifications
RESEND_API_KEY=re_your-resend-api-key-here

# ============================================
# 5. LEMON SQUEEZY (Premium Features - Optional)
# ============================================
# Lấy từ: Lemon Squeezy Dashboard → Settings → API
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://your-store.lemonsqueezy.com/checkout/buy/your-product-id
NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL=https://app.lemonsqueezy.com/my-account
LEMON_SQUEEZY_WEBHOOK_SECRET=your-webhook-secret-here

# ============================================
# 6. CRON JOB SECRET (Optional - Cho Vercel Cron)
# ============================================
# Tạo một random string để bảo mật cron endpoint
# Format: Bất kỳ string nào (ví dụ: your-random-secret-123)
# ⚠️ Optional: Chỉ cần nếu dùng Vercel Cron
CRON_SECRET=your-random-cron-secret-here
```

---

## ✅ Checklist các biến cần thiết

### Bắt buộc (Core Features):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Tùy chọn theo tính năng:

#### AI Intelligence (Module 2B):
- [ ] `OPENAI_API_KEY` - Để phân tích bài đăng với AI

#### Smart Trigger (Module 3):
- [ ] `TELEGRAM_BOT_TOKEN` - Để gửi thông báo Telegram
- [ ] `RESEND_API_KEY` - Để gửi email notifications (optional)

#### Premium Features:
- [ ] `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL` - URL checkout
- [ ] `NEXT_PUBLIC_LEMON_SQUEEZY_CUSTOMER_PORTAL_URL` - Customer portal URL
- [ ] `LEMON_SQUEEZY_WEBHOOK_SECRET` - Webhook secret

#### Cron Jobs:
- [ ] `CRON_SECRET` - Bảo mật cron endpoint (optional)

---

## 📖 Hướng dẫn lấy từng giá trị

### 1. Supabase Keys
1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Bảo mật cao

### 2. OpenAI API Key
1. Vào [OpenAI Platform](https://platform.openai.com/api-keys)
2. Đăng nhập hoặc tạo tài khoản
3. Click **Create new secret key**
4. Copy key (format: `sk-...`)
5. ⚠️ Lưu lại ngay, không xem lại được

### 3. Telegram Bot Token
1. Mở Telegram, tìm `@BotFather`
2. Gửi lệnh `/newbot`
3. Làm theo hướng dẫn để tạo bot
4. Copy token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 4. Resend API Key
1. Vào [Resend](https://resend.com)
2. Đăng ký/đăng nhập
3. Vào **API Keys**
4. Tạo API key mới
5. Copy key (format: `re_...`)

### 5. Lemon Squeezy
1. Vào [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
2. Vào **Settings** → **API**
3. Copy các giá trị cần thiết

### 6. Cron Secret
- Tạo một random string bất kỳ (ví dụ: `my-secret-cron-key-2024`)
- Dùng để bảo mật cron endpoint

---

## 🚀 Sau khi tạo file

1. **Lưu file** `.env.local` trong thư mục gốc của project
2. **Restart development server**:
   ```bash
   npm run dev
   ```
3. **Kiểm tra** xem app có chạy không

---

## 🔒 Bảo mật

- ✅ File `.env.local` đã có trong `.gitignore` (không commit lên Git)
- ✅ `NEXT_PUBLIC_*` variables: Có thể truy cập từ client-side
- ✅ Các biến khác: Chỉ dùng server-side (bảo mật cao)
- ⚠️ **KHÔNG BAO GIỜ** chia sẻ file `.env.local` hoặc commit lên Git

---

## 📝 Lưu ý khi deploy lên Vercel

Khi deploy lên Vercel, bạn **PHẢI** set Environment Variables trong Vercel Dashboard:
1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm từng biến (giống như trong `.env.local`)
3. Chọn môi trường: Production, Preview, Development
4. Redeploy project

Xem chi tiết: `VERCEL_ENV_SETUP.md`

