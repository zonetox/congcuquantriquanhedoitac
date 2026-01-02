# Hướng Dẫn Triển Khai Module 4.1: Shared Scraping

## 📋 Tổng Quan

Module 4.1 tái cấu trúc database để hỗ trợ **Shared Scraping** - một bước đi quan trọng về mặt kiến trúc, biến hệ thống từ công cụ cá nhân thành **Data Platform tập trung**.

### Lợi ích:
- ✅ **Giảm chi phí vận hành**: Một profile chỉ được scrape 1 lần/giờ, tất cả users cùng chia sẻ dữ liệu
- ✅ **Tiết kiệm 100% chi phí AI**: Nếu User 1 đã phân tích post A, User 2 sẽ dùng kết quả có sẵn
- ✅ **Tăng hiệu suất**: Không cần gọi API lặp lại cho cùng một profile
- ✅ **Scale tốt hơn**: Khi số lượng users tăng, chi phí không tăng tuyến tính

---

## 🗄️ Thay Đổi Database

### 1. Chạy SQL Script

**Bước 1**: Mở Supabase Dashboard → SQL Editor

**Bước 2**: Copy toàn bộ nội dung file `SQL_MODULE_4_SHARED_SCRAPING.sql` và chạy

**Bước 3**: Kiểm tra kết quả:
```sql
-- Kiểm tra bảng user_post_interactions đã được tạo
SELECT COUNT(*) FROM public.user_post_interactions;

-- Kiểm tra profiles có last_synced_at
SELECT COUNT(*) FROM public.profiles_tracked WHERE last_synced_at IS NOT NULL;

-- Kiểm tra profile_posts không còn user_id
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profile_posts' AND column_name = 'user_id';
-- (Kết quả phải = 0 rows)
```

---

## 📊 Cấu Trúc Mới

### Bảng `profile_posts` (Dữ liệu chung)
- ❌ **Loại bỏ**: `user_id` (không còn gắn với user cụ thể)
- ✅ **Giữ nguyên**: `profile_id`, `content`, `post_url`, `ai_analysis`, `ai_suggestions`
- ✅ **Ý nghĩa**: Một post chỉ tồn tại **1 bản ghi duy nhất** cho tất cả users

### Bảng `user_post_interactions` (Trạng thái riêng)
- ✅ `user_id`: User xem post
- ✅ `post_id`: Post được xem
- ✅ `is_read`: Đã đọc chưa
- ✅ `is_hidden`: Đã ẩn chưa
- ✅ **Ý nghĩa**: Mỗi user có trạng thái riêng với mỗi post

### Bảng `profiles_tracked` (Thêm mới)
- ✅ `last_synced_at`: Thời gian sync cuối cùng
- ✅ **Ý nghĩa**: Track xem profile đã được scrape trong 1 giờ qua chưa

---

## 🔄 Logic Mới

### 1. Sync Feed (`syncFeed`)

**Trước**:
```typescript
// Mỗi user gọi API riêng cho mỗi profile
for (const profile of profiles) {
  const posts = await fetchLatestPosts(profile.url);
  await saveScrapedPosts(profile.id, user.id, posts);
}
```

**Sau**:
```typescript
// Chỉ sync nếu chưa sync trong 1 giờ qua
const profilesToSync = profiles.filter(profile => {
  if (!profile.last_synced_at) return true;
  return new Date(profile.last_synced_at) < oneHourAgo;
});

// Nếu đã sync gần đây, không gọi API
if (profilesToSync.length === 0) {
  return { success: true, postsCreated: 0 };
}

// Chỉ sync profiles cần thiết
for (const profile of profilesToSync) {
  const posts = await fetchLatestPosts(profile.url);
  await saveScrapedPosts(profile.id, posts); // Không cần userId
  await updateLastSyncedAt(profile.id);
}
```

### 2. AI Analysis (`analyzePostWithAI`)

**Trước**:
```typescript
// Mỗi user phân tích riêng
const aiResult = await analyzePostWithAI(content, user.id, postId);
```

**Sau**:
```typescript
// Check xem đã có AI analysis chưa (từ user khác)
const existingAnalysis = await getExistingAnalysis(postId);
if (existingAnalysis) {
  return existingAnalysis; // Dùng kết quả có sẵn
}

// Chỉ phân tích nếu chưa có
const aiResult = await analyzePostWithAI(content, undefined, postId);
```

### 3. Get Feed Posts (`getFeedPosts`)

**Trước**:
```typescript
// Filter theo user_id trong profile_posts
const posts = await supabase
  .from("profile_posts")
  .select("*")
  .eq("user_id", user.id)
  .in("profile_id", profileIds);
```

**Sau**:
```typescript
// Lấy posts từ shared pool (không filter theo user_id)
const posts = await supabase
  .from("profile_posts")
  .select("*")
  .in("profile_id", profileIds); // Chỉ filter theo profiles user đang theo dõi
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Migration Dữ Liệu
- SQL script tự động tạo `user_post_interactions` từ `user_id` cũ trong `profile_posts`
- Sau khi migration, `user_id` sẽ bị xóa khỏi `profile_posts`
- **Không mất dữ liệu**: Tất cả posts vẫn được giữ nguyên

### 2. RLS Policies
- `profile_posts`: Users chỉ xem posts từ profiles họ đang theo dõi
- `user_post_interactions`: Users chỉ xem interactions của chính họ
- **Bảo mật**: Vẫn đảm bảo users không xem dữ liệu của users khác

### 3. Backward Compatibility
- Code đã được cập nhật để tương thích với cấu trúc mới
- Nếu có code cũ còn dùng `user_id` trong `profile_posts`, sẽ bị lỗi
- **Cần review**: Tất cả queries liên quan đến `profile_posts`

---

## 🧪 Testing

### Test Case 1: Shared Scraping
1. User A sync profile X → Tạo posts
2. User B sync profile X trong vòng 1 giờ → **Không gọi API**, dùng posts có sẵn
3. User B sync profile X sau 1 giờ → **Gọi API**, update posts mới

### Test Case 2: Shared AI Analysis
1. User A sync profile X → AI phân tích post Y
2. User B xem post Y → **Dùng AI analysis có sẵn**, không phân tích lại

### Test Case 3: User Interactions
1. User A xem post Y → Tạo `user_post_interactions` với `is_read = true`
2. User B xem post Y → Tạo `user_post_interactions` riêng cho User B
3. **Mỗi user có trạng thái riêng**

---

## 📈 Kết Quả Mong Đợi

### Trước Shared Scraping:
- 100 users, mỗi user theo dõi 10 profiles
- Mỗi profile được scrape 100 lần/giờ
- **Chi phí**: 1000 API calls/giờ

### Sau Shared Scraping:
- 100 users, mỗi user theo dõi 10 profiles
- Mỗi profile chỉ được scrape 1 lần/giờ (nếu có user sync)
- **Chi phí**: 10 API calls/giờ
- **Tiết kiệm**: 99% chi phí scraping

### AI Analysis:
- Trước: 100 users phân tích cùng 1 post = 100 lần gọi OpenAI
- Sau: 1 user phân tích, 99 users dùng kết quả có sẵn
- **Tiết kiệm**: 99% chi phí AI

---

## ✅ Checklist Hoàn Thành

- [ ] Chạy `SQL_MODULE_4_SHARED_SCRAPING.sql` trong Supabase
- [ ] Verify bảng `user_post_interactions` đã được tạo
- [ ] Verify `profile_posts` không còn `user_id`
- [ ] Verify `profiles_tracked` có `last_synced_at`
- [ ] Test sync feed với 2 users khác nhau
- [ ] Verify AI analysis được share giữa users
- [ ] Verify RLS policies hoạt động đúng

---

## 🆘 Troubleshooting

### Lỗi: "column user_id does not exist"
- **Nguyên nhân**: Code cũ vẫn đang dùng `user_id` trong `profile_posts`
- **Giải pháp**: Đảm bảo đã cập nhật tất cả code theo cấu trúc mới

### Lỗi: "Users không thấy posts"
- **Nguyên nhân**: RLS policy chưa được cập nhật
- **Giải pháp**: Chạy lại phần RLS trong SQL script

### Lỗi: "Duplicate key violation"
- **Nguyên nhân**: Unique constraint `(profile_id, post_url)` đã tồn tại
- **Giải pháp**: Đây là hành vi bình thường, post sẽ được skip

---

## 📝 Notes

- Shared Scraping chỉ áp dụng cho **scraping** và **AI analysis**
- **User interactions** (đã đọc, đã ẩn) vẫn là dữ liệu riêng của mỗi user
- **Notifications** vẫn gửi riêng cho từng user dựa trên settings của họ

---

**Hoàn thành Module 4.1: Shared Scraping** ✅

