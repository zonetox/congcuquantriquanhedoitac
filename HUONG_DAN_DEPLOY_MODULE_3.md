# 🚀 HƯỚNG DẪN DEPLOY MODULE 3 ENHANCEMENTS

## ⚠️ QUAN TRỌNG: ĐỌC KỸ TRƯỚC KHI DEPLOY

---

## 📋 CHECKLIST TRƯỚC KHI DEPLOY

### ✅ Bước 1: Database Setup (BẮT BUỘC)

**File SQL cần chạy**: `SQL_MODULE_3_ENHANCEMENTS.sql`

**Cách chạy**:
1. Mở Supabase Dashboard → SQL Editor
2. Copy toàn bộ nội dung từ file `SQL_MODULE_3_ENHANCEMENTS.sql`
3. Paste vào SQL Editor
4. Click "Run" để execute
5. Verify: Kiểm tra xem có 3 bảng mới được tạo:
   - `notification_history`
   - `ai_usage_logs`
   - `telegram_rate_limits`

**Lưu ý**: 
- Script sử dụng `IF NOT EXISTS` nên có thể chạy nhiều lần an toàn
- Nếu có lỗi, kiểm tra xem có bảng/function/index nào đã tồn tại chưa

---

### ✅ Bước 2: Environment Variables (Vercel)

#### Đã có (không cần làm gì):
- [x] `TELEGRAM_BOT_TOKEN` - ✅ Đã thêm

#### Optional (chỉ cần nếu muốn dùng Email):
- [ ] `RESEND_API_KEY` - Resend API key (nếu muốn dùng email notifications)
- [ ] `RESEND_FROM_EMAIL` - From email address (optional, default: "Partner Center <notifications@partnercenter.com>")

**Cách thêm** (nếu cần):
1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
3. Thêm `RESEND_FROM_EMAIL` = `your-email@domain.com` (optional)
4. Redeploy project

**Lưu ý**: Email notifications là optional, không bắt buộc. Nếu không thêm `RESEND_API_KEY`, email notifications sẽ fail gracefully.

---

### ✅ Bước 3: Deploy Code

1. Commit và push code lên GitHub
2. Vercel sẽ tự động deploy
3. Hoặc manual deploy: Vercel Dashboard → Deployments → Redeploy

---

### ✅ Bước 4: Verify Deployment

#### Test 1: Telegram Notification
1. Vào Settings page
2. Nhập Telegram Chat ID
3. Click "Gửi tin thử nghiệm"
4. ✅ Verify: Nhận được tin nhắn trong Telegram

#### Test 2: Sync Feed với Notification
1. Vào Feed page
2. Click "Sync Feed"
3. ✅ Verify: Nếu có Sales Opportunity, nhận được notification trong Telegram

#### Test 3: Check Database
1. Mở Supabase Dashboard → Table Editor
2. Kiểm tra bảng `notification_history`:
   - ✅ Có records mới sau khi gửi notification
   - ✅ Status = "sent" hoặc "failed"
3. Kiểm tra bảng `ai_usage_logs`:
   - ✅ Có records mới sau khi sync feed
   - ✅ Có `estimated_cost_usd` > 0
4. Kiểm tra bảng `telegram_rate_limits`:
   - ✅ Có records sau khi gửi notification

#### Test 4: Rate Limiting
1. Gửi nhiều test notifications liên tiếp (31+ messages trong 1 phút)
2. ✅ Verify: Message thứ 31+ bị block với error "Rate limit exceeded"

---

## 🔍 VERIFY SQL SCRIPT ĐÃ CHẠY THÀNH CÔNG

### Query để kiểm tra:

```sql
-- 1. Kiểm tra tables đã được tạo
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notification_history', 'ai_usage_logs', 'telegram_rate_limits');

-- Kết quả mong đợi: 3 rows

-- 2. Kiểm tra functions đã được tạo
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('cleanup_old_rate_limits', 'get_ai_usage_stats');

-- Kết quả mong đợi: 2 rows

-- 3. Kiểm tra indexes đã được tạo
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND (indexname LIKE '%notification%' OR indexname LIKE '%ai_usage%' OR indexname LIKE '%telegram_rate%');

-- Kết quả mong đợi: 9 rows
```

---

## 📊 MONITORING SAU KHI DEPLOY

### 1. AI Usage Cost
Query để xem cost:
```sql
SELECT 
  SUM(estimated_cost_usd) as total_cost_usd,
  COUNT(*) as total_requests,
  AVG(response_time_ms) as avg_response_time_ms
FROM ai_usage_logs
WHERE created_at >= now() - INTERVAL '7 days';
```

### 2. Notification Success Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM notification_history
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY status;
```

### 3. Rate Limit Violations
```sql
SELECT 
  chat_id,
  COUNT(*) as violation_count
FROM notification_history
WHERE status = 'failed' 
  AND error_message LIKE '%rate limit%'
  AND created_at >= now() - INTERVAL '7 days'
GROUP BY chat_id;
```

---

## ⚠️ TROUBLESHOOTING

### Lỗi: "relation does not exist"
**Nguyên nhân**: Chưa chạy SQL script  
**Giải pháp**: Chạy `SQL_MODULE_3_ENHANCEMENTS.sql` trong Supabase

### Lỗi: "Rate limit exceeded"
**Nguyên nhân**: Đã gửi quá 30 messages trong 1 phút  
**Giải pháp**: Đợi 1 phút rồi thử lại

### Lỗi: "TELEGRAM_BOT_TOKEN is not configured"
**Nguyên nhân**: Chưa thêm environment variable  
**Giải pháp**: Thêm `TELEGRAM_BOT_TOKEN` vào Vercel Environment Variables

### Lỗi: "Invalid Telegram Chat ID"
**Nguyên nhân**: Chat ID sai hoặc chưa start conversation với bot  
**Giải pháp**: 
1. Kiểm tra Chat ID từ @userinfobot
2. Start conversation với bot trước
3. Thử lại

### Notification không được gửi
**Kiểm tra**:
1. `notification_history` table có record không? Status là gì?
2. `profile_posts.notification_sent` = true chưa?
3. Profile có `notify_on_sales_opportunity = true` không?
4. Profile có `notify_telegram_chat_id` không?

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Đã chạy `SQL_MODULE_3_ENHANCEMENTS.sql` trong Supabase
- [ ] Đã verify 3 tables được tạo
- [ ] Đã verify 2 functions được tạo
- [ ] Đã verify 9 indexes được tạo
- [ ] Đã test Telegram notification
- [ ] Đã test sync feed với notification
- [ ] Đã check `notification_history` có records
- [ ] Đã check `ai_usage_logs` có records
- [ ] Đã test rate limiting

---

## 📞 SUPPORT

Nếu gặp vấn đề:
1. Kiểm tra logs trong Vercel Dashboard → Functions → Logs
2. Kiểm tra Supabase Logs → API Logs
3. Query database để verify data
4. Xem file `BAO_CAO_HOAN_THIEN_MODULE_3.md` để biết chi tiết implementation

---

**📅 Last Updated**: 2024-12-20  
**Version**: 3.3.1  
**Status**: ✅ READY FOR DEPLOYMENT

