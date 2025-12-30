# ✅ Checklist - Kiểm tra sẵn sàng chạy ứng dụng

## 🔍 Kiểm tra hiện tại

### ✅ Đã hoàn thành:

1. **Dependencies**
   - ✅ `node_modules` đã được cài đặt
   - ✅ Tất cả packages trong `package.json` đã có

2. **Environment Variables**
   - ✅ `.env.local` đã có với Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL=https://ykxihyfoqetedvxfvzua.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6hODwmKIxttOfmoJ3ZdCtQ_PUJBSI5A`

3. **Database Schema**
   - ✅ Bạn đã tạo bảng `profiles_tracked` trong Supabase với đầy đủ các trường:
     - `id`, `user_id`, `title`, `url`
     - `rss_url`, `category`, `notes`, `has_new_update`
     - `created_at`
   - ✅ RLS đã được bật
   - ✅ Policy "Users can manage their own tracked profiles" đã tạo
   - ✅ Index `idx_profiles_user_id` đã tạo

4. **Backend (Server Actions)**
   - ✅ `lib/profiles/actions.ts` - addProfile, deleteProfile, getProfiles
   - ✅ `lib/auth/actions.ts` - signIn, signUp, signOut
   - ✅ Console.log đã được thêm để debug
   - ✅ Auto-refresh sau khi thêm/xóa

5. **Frontend Components**
   - ✅ `components/AddProfileForm.tsx` - Form với URL, Title, Notes
   - ✅ `components/ProfileGrid.tsx` - Grid hiển thị profiles
   - ✅ `components/ProfileCard.tsx` - Card với favicon, notes, AI icon
   - ✅ `components/auth/login-form.tsx` - Login/Register
   - ✅ `components/LandingPage.tsx` - Landing page

6. **Pages**
   - ✅ `app/page.tsx` - Home page với logic điều kiện
   - ✅ `app/login/page.tsx` - Login page
   - ✅ `app/layout.tsx` - Root layout với Toaster

7. **Features**
   - ✅ Authentication (Sign In/Sign Up)
   - ✅ Add Profile với validation
   - ✅ Delete Profile
   - ✅ Display Profiles Grid
   - ✅ Quick Notes
   - ✅ Free limit (5 profiles)
   - ✅ Toast notifications
   - ✅ Loading states
   - ✅ Auto-refresh

## 🚀 Cách chạy ứng dụng

### Bước 1: Đảm bảo dependencies đã cài
```bash
npm install
```

### Bước 2: Kiểm tra .env.local
Đảm bảo file `.env.local` có:
```
NEXT_PUBLIC_SUPABASE_URL=https://ykxihyfoqetedvxfvzua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6hODwmKIxttOfmoJ3ZdCtQ_PUJBSI5A
```

### Bước 3: Kiểm tra Database trong Supabase
Đảm bảo bảng `profiles_tracked` đã được tạo với đúng schema:
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `title` (TEXT)
- `url` (TEXT)
- `rss_url` (TEXT, nullable)
- `category` (TEXT, default 'General')
- `notes` (TEXT, nullable)
- `has_new_update` (BOOLEAN, default false)
- `created_at` (TIMESTAMP)

### Bước 4: Chạy development server
```bash
npm run dev
```

### Bước 5: Mở trình duyệt
Truy cập: http://localhost:3000

## 🧪 Test Checklist

### Test Authentication:
- [ ] Truy cập `/` → Hiển thị Landing Page
- [ ] Click "Get Started for Free" → Chuyển đến `/login`
- [ ] Đăng ký tài khoản mới → Thành công
- [ ] Đăng nhập → Redirect về `/` và hiển thị Dashboard

### Test Add Profile:
- [ ] Nhập URL hợp lệ → Favicon preview hiển thị
- [ ] Nhập Title và Notes → Form submit
- [ ] Click "Add" → Loading spinner hiển thị
- [ ] Thành công → Toast notification + ProfileGrid tự động refresh
- [ ] Console log hiển thị đúng thông tin

### Test Display Profiles:
- [ ] Profiles hiển thị trong Grid (4-5 cột desktop)
- [ ] Favicon hiển thị đúng
- [ ] Notes hiển thị mờ bên dưới title (nếu có)
- [ ] AI Update icon hiển thị ở góc trên trái
- [ ] Click vào card → Mở URL trong tab mới

### Test Delete Profile:
- [ ] Hover vào card → Nút xóa hiển thị
- [ ] Click xóa → Confirmation dialog
- [ ] Confirm → Profile bị xóa + Toast notification + Auto refresh

### Test Free Limit:
- [ ] Thêm 5 profiles → Button "Add" bị disable
- [ ] Hiển thị thông báo "Free limit reached"
- [ ] Counter hiển thị "5 / 5 profiles used"

## ⚠️ Lưu ý quan trọng

1. **Database Schema**: Đảm bảo bảng `profiles_tracked` trong Supabase khớp với schema bạn đã tạo (có các trường: rss_url, category, notes, has_new_update)

2. **RLS Policies**: Đảm bảo RLS policy cho phép user quản lý profiles của chính họ

3. **Console Logs**: Mở Developer Tools (F12) để xem console logs khi test

4. **Network Tab**: Kiểm tra Network tab để xem các API calls đến Supabase

## 🐛 Nếu gặp lỗi

### Lỗi kết nối Supabase:
- Kiểm tra `.env.local` có đúng credentials không
- Kiểm tra Supabase project có đang active không

### Lỗi authentication:
- Kiểm tra Supabase Auth đã được enable chưa
- Kiểm tra email confirmation settings

### Lỗi database:
- Kiểm tra bảng `profiles_tracked` đã được tạo chưa
- Kiểm tra RLS policies đã được tạo chưa
- Kiểm tra index đã được tạo chưa

### Lỗi build:
```bash
npm run build
```
Kiểm tra lỗi TypeScript hoặc build errors

## ✅ Kết luận

**Ứng dụng đã sẵn sàng để test!**

Tất cả các tính năng đã được implement:
- ✅ Authentication
- ✅ CRUD Profiles
- ✅ UI/UX hoàn chỉnh
- ✅ Validation & Error handling
- ✅ Loading states
- ✅ Toast notifications
- ✅ Auto-refresh
- ✅ Free tier limit
- ✅ Premium feature teaser

Chỉ cần chạy `npm run dev` và test!

