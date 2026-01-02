# Hướng Dẫn Triển Khai: AI Radar & Interaction Clock

## 📋 Tổng Quan

Hai tính năng mới:
1. **AI Radar (Sales Intent)**: Tinh chỉnh phân tích AI với Contextual Prompting, không dùng keywords
2. **Interaction Clock**: Đo lường "Sức khỏe tương tác" 7 ngày - Badge "Cần chăm sóc"

---

## 🎯 Tính Năng 1: AI Radar (Sales Intent)

### Thay Đổi

**Trước**: Dùng keywords để phát hiện Sales Intent
**Sau**: Dùng Contextual Prompting (phân tích ngữ cảnh)

### Intent Classification

- **Hot Lead**: Tìm kiếm báo giá, tìm nhà cung cấp, hỏi địa chỉ mua, cần tư vấn gấp, than phiền về lỗi nghiêm trọng của đối thủ
- **Warm Lead**: Có dấu hiệu quan tâm nhưng chưa cấp thiết, đang tìm hiểu, so sánh
- **Information**: Chia sẻ thông tin, kiến thức, không có ý định mua
- **Neutral**: Bài đăng thông thường, tin cá nhân, không có giá trị thương mại

### Response Format

```json
{
  "summary": "Tóm tắt dưới 15 từ",
  "signal": "Cơ hội bán hàng" | "Tin cá nhân" | "Tin thị trường" | "Khác",
  "intent": "Hot Lead" | "Warm Lead" | "Information" | "Neutral",
  "intent_score": 1-100,
  "opportunity_score": 0-10,
  "reason": "Giải thích ngắn gọn tại sao (bằng ngôn ngữ của bài đăng)",
  "ice_breakers": ["comment", "inbox", "câu hỏi mở"]
}
```

### Files Đã Cập Nhật

- ✅ `lib/ai/analyzer.ts`: Prompt mới với Contextual Prompting
- ✅ `lib/ai/types.ts`: Thêm `intent` và `reason`
- ✅ `lib/scrapers/social-scraper.ts`: Lưu `intent` và `reason` vào `ai_analysis`

---

## ⏰ Tính Năng 2: Interaction Clock

### Logic

- **Cột mới**: `last_contacted_at` trong `profiles_tracked`
- **Trigger**: Khi user click "Ice Breaker" hoặc "Copy Link"
- **Badge**: Hiển thị "🚨 Cần chăm sóc" nếu:
  - `last_contacted_at` = NULL (chưa từng liên hệ)
  - `NOW() - last_contacted_at > 7 days`

### Database Changes

**SQL Script**: `SQL_AI_RADAR_AND_INTERACTION_CLOCK.sql`

- Thêm cột `last_contacted_at` vào `profiles_tracked`
- Tạo indexes để tối ưu query
- Tạo function `update_profile_last_contacted_at()`

### Code Changes

- ✅ `lib/profiles/contact-actions.ts`: Server action `updateLastContactedAt()`
- ✅ `components/FeedContent.tsx`: Gọi `updateLastContactedAt()` khi copy Ice Breaker/Copy Link
- ✅ `components/ProfileCard.tsx`: Hiển thị badge "Cần chăm sóc"
- ✅ `lib/feed/actions.ts`: Fetch `last_contacted_at` từ `profiles_tracked`
- ✅ `lib/profiles/types.ts`: Thêm `last_contacted_at` vào `Profile` interface

---

## 🚀 Triển Khai

### Bước 1: Chạy SQL Script

1. Mở Supabase Dashboard → SQL Editor
2. Copy toàn bộ nội dung file `SQL_AI_RADAR_AND_INTERACTION_CLOCK.sql`
3. Chạy script

**Verify**:
```sql
-- Kiểm tra cột đã được thêm
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles_tracked' AND column_name = 'last_contacted_at';

-- Kiểm tra function đã được tạo
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'update_profile_last_contacted_at';
```

### Bước 2: Test AI Radar

1. Sync feed để tạo posts mới
2. Verify AI analysis có `intent` và `reason`:
   ```sql
   SELECT 
     id,
     ai_analysis->>'intent' as intent,
     ai_analysis->>'reason' as reason,
     ai_analysis->>'intent_score' as intent_score
   FROM profile_posts
   WHERE ai_analysis IS NOT NULL
   LIMIT 5;
   ```

### Bước 3: Test Interaction Clock

1. Click "Ice Breaker" hoặc "Copy Link" trên một post
2. Verify `last_contacted_at` được cập nhật:
   ```sql
   SELECT id, title, last_contacted_at
   FROM profiles_tracked
   WHERE last_contacted_at IS NOT NULL
   ORDER BY last_contacted_at DESC
   LIMIT 5;
   ```

3. Verify badge "Cần chăm sóc" hiển thị:
   - Nếu `last_contacted_at` = NULL → Badge hiển thị
   - Nếu `last_contacted_at` > 7 days ago → Badge hiển thị
   - Nếu `last_contacted_at` < 7 days ago → Badge không hiển thị

---

## 📊 UI Changes

### FeedContent.tsx

- Badge "🚨 Cần chăm sóc" hiển thị trên Post Card nếu:
  - `profile_last_contacted_at` = NULL
  - `daysSinceContact > 7`

### ProfileCard.tsx

- Badge "🚨 Cần chăm sóc" hiển thị ở góc trên bên phải nếu:
  - `profile.last_contacted_at` = NULL
  - `daysSinceContact > 7`

---

## ✅ Checklist

- [ ] Chạy `SQL_AI_RADAR_AND_INTERACTION_CLOCK.sql`
- [ ] Verify cột `last_contacted_at` đã được thêm
- [ ] Verify function `update_profile_last_contacted_at()` đã được tạo
- [ ] Test AI Radar: Sync feed và verify `intent` và `reason` trong `ai_analysis`
- [ ] Test Interaction Clock: Click Ice Breaker/Copy Link và verify `last_contacted_at` được cập nhật
- [ ] Test Badge: Verify badge "Cần chăm sóc" hiển thị đúng logic

---

## 🎯 Lợi Ích

### AI Radar
- ✅ Phân tích chính xác hơn với Contextual Prompting
- ✅ Hỗ trợ đa ngôn ngữ tốt hơn (không phụ thuộc keywords)
- ✅ Có `reason` để giải thích tại sao phân loại như vậy

### Interaction Clock
- ✅ Giúp doanh nghiệp quản lý nhân viên và khách hàng
- ✅ Đảm bảo không có khách hàng nào bị "bỏ rơi"
- ✅ Tính năng thu phí doanh nghiệp (Enterprise feature)

---

**Hoàn thành AI Radar & Interaction Clock** ✅

