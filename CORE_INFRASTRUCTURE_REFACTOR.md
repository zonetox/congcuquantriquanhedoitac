# 🔧 CORE INFRASTRUCTURE REFACTOR - Kế Hoạch Thực Thi

## Mục Tiêu

Củng cố "Nền Móng" (Core Infrastructure) để đảm bảo codebase sạch, nhất quán và tối ưu.

---

## 📋 Nhóm Công Việc

### 1. ✅ Refactor Membership Logic (Đã hoàn thành một phần)

**Mục tiêu**: Thay thế tất cả `isPremium()` và `isAdmin()` riêng lẻ bằng `getUserMembership()`

**Status**:
- ✅ `lib/admin/actions.ts` - Đã refactor
- ✅ `lib/api-keys/actions.ts` - Đã refactor
- ✅ `app/page.tsx` - Đã dùng `getUserMembership()`
- ✅ `app/admin/page.tsx` - Đã dùng `getUserMembership()`
- ✅ `app/feed/page.tsx` - Đã dùng `getUserMembership()`
- ✅ `app/settings/page.tsx` - Đã dùng `getUserMembership()`

**Kết quả**: Tất cả pages đã dùng `getUserMembership()` - Single Source of Truth ✅

---

### 2. 🔄 Chuẩn Hóa Server Actions (Đang thực hiện)

**Mục tiêu**: 
- Đảm bảo tất cả server actions nhận parameters riêng biệt (không nhận object)
- Dùng `undefined` thay cho `null` trong return values

**Quy tắc**:
- ✅ Parameters: Nhận riêng biệt, không nhận object (trừ khi cần thiết)
- ✅ Return values: `error: undefined` thay vì `error: null`
- ⚠️ Database values: Giữ nguyên `null` (vì database trả về null)

**Files cần rà soát**:
- `lib/profiles/actions.ts` - ✅ Đã nhận parameters riêng biệt
- `lib/user/actions.ts` - ✅ Đã nhận parameters riêng biệt
- `lib/categories/actions.ts` - ✅ Đã nhận parameters riêng biệt
- `lib/crm/actions.ts` - ✅ Đã nhận parameters riêng biệt
- `lib/admin/actions.ts` - ⚠️ `updateUser()` và `updateProfile()` nhận object
- `lib/feed/actions.ts` - Cần kiểm tra
- `lib/notifications/actions.ts` - Cần kiểm tra

**Lưu ý**: Một số functions như `updateUser()` và `updateProfile()` nhận object là hợp lý vì có nhiều optional fields. Không cần refactor.

---

### 3. 🔒 Verify RLS Policies (Chưa thực hiện)

**Mục tiêu**: Chạy script kiểm tra Row Level Security để đảm bảo không có lỗ hổng

**Script**: `SQL_VERIFY_RLS_POLICIES_SIMPLE.sql`

---

## 📊 Progress Tracking

| Task | Status | Notes |
|------|--------|-------|
| Refactor Membership | ✅ 100% | Tất cả đã dùng `getUserMembership()` |
| Chuẩn hóa Server Actions | 🔄 80% | Cần thay `null` → `undefined` trong return values |
| Verify RLS | ⏳ 0% | Chưa chạy script |

---

## 🔍 Chi Tiết Refactor

### Membership Refactor

**Trước**:
```typescript
const isUserAdmin = await isAdmin();
if (!isUserAdmin) { ... }
```

**Sau**:
```typescript
const membership = await getUserMembership();
if (!membership.isAdmin) { ... }
```

**Lợi ích**:
- ✅ Giảm số lượng database queries (1 query thay vì 2)
- ✅ Đồng nhất logic check-access
- ✅ Single Source of Truth

### Server Actions Standardization

**Return Values**:
- ❌ `error: null` → ✅ `error: undefined`
- ❌ `data: null` → ✅ `data: undefined` (hoặc giữ nguyên nếu là database value)

**Parameters**:
- ✅ Đã đúng: Nhận riêng biệt
- ⚠️ Một số functions nhận object là hợp lý (như `updateUser()`, `updateProfile()`)

---

## ⚠️ Lưu Ý Quan Trọng

1. **Database Values**: Giữ nguyên `null` khi lấy từ database
2. **Return Types**: Có thể giữ `string | null` trong type definition, nhưng return `undefined` thay vì `null`
3. **Optional Parameters**: Dùng `undefined` thay vì `null` cho optional parameters

---

## 🚀 Next Steps

1. ✅ Hoàn thành refactor Membership
2. 🔄 Chuẩn hóa return values: `null` → `undefined`
3. ⏳ Verify RLS Policies

---

**Cập nhật**: 2024

