# Functional Requirements — TurboOrder MVP (P0 Scope)

> **[BA]** Phase 2 | Business Analyst  
> **Epic:** `turbo-order-mvp`  
> **Scope:** P0 — Must Have (10 user stories)  
> **Created:** 2026-04-29

---

## FR-001: Đăng nhập hệ thống

**Module:** Authentication  
**User Story:** US-AUTH-001  
**Priority:** P0

### Description
Cho phép chủ cửa hàng đăng nhập bằng email + password để truy cập hệ thống.

### Trigger
User mở app → redirect đến trang Login (nếu chưa có session).

### Process Flow
```
1. User nhập email + password
2. Frontend gửi POST /api/v1/auth/login
3. Backend validate email format (Zod)
4. Backend tìm user trong MongoDB (email)
5. So sánh password hash (bcryptjs)
   ├─ Sai → Return 401 + error message (i18n)
   └─ Đúng → Generate JWT (access token 15min + refresh token 7 days)
6. Return tokens + user profile
7. Frontend lưu access token (memory) + refresh token (httpOnly cookie)
8. Redirect đến Dashboard
```

### Input
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | ✅ | Valid email format |
| password | string | ✅ | Min 8 chars |

### Output
| Field | Type | Description |
|-------|------|-------------|
| accessToken | string | JWT, expires 15min |
| refreshToken | string | JWT, expires 7 days (httpOnly cookie) |
| user | object | { id, email, name, avatar, locale } |

### Error Handling
| Code | Condition | Message (vi) | Message (en) |
|------|-----------|-------------|-------------|
| 401 | Email không tồn tại | Email hoặc mật khẩu không đúng | Invalid email or password |
| 401 | Password sai | Email hoặc mật khẩu không đúng | Invalid email or password |
| 422 | Validation failed | Dữ liệu không hợp lệ | Validation failed |
| 429 | Rate limit (5 attempts/min) | Quá nhiều lần thử, vui lòng thử lại sau | Too many attempts, please try again later |

### Constraints
- Password KHÔNG được log
- Response time < 500ms
- Rate limit: 5 login attempts / minute / IP
- Same error message cho email sai và password sai (security)

---

## FR-002: Duy trì phiên đăng nhập (Session Persistence)

**Module:** Authentication  
**User Story:** US-AUTH-002  
**Priority:** P0

### Description
Tự động refresh token khi access token hết hạn, không yêu cầu user login lại.

### Process Flow
```
1. Frontend gửi API request
2. Interceptor kiểm tra access token
   ├─ Còn hạn → Attach token, gửi request
   └─ Hết hạn → Gọi POST /api/v1/auth/refresh
       ├─ Refresh token hợp lệ → Nhận access token mới → Retry original request
       └─ Refresh token hết hạn → Clear session → Redirect Login
```

### Technical Notes
- Access token stored in memory (Zustand store) — mất khi close tab
- Refresh token stored in httpOnly cookie — persist across sessions
- Token rotation: mỗi lần refresh → issue new refresh token, revoke old

---

## FR-003: Tạo đơn hàng mới

**Module:** Orders  
**User Story:** US-ORD-001  
**Priority:** P0

### Description
Cho phép tạo đơn hàng mới bằng cách chọn khách hàng, thêm sản phẩm, hệ thống tự tính tổng.

### Trigger
User click "Tạo đơn hàng" từ sidebar hoặc Dashboard quick action.

### Process Flow
```
1. User mở form tạo đơn hàng
2. Chọn hoặc tạo mới khách hàng
   ├─ Chọn từ dropdown (search by name/SĐT)
   └─ Tạo mới inline (tên, SĐT — tối thiểu)
3. Thêm sản phẩm vào đơn
   ├─ Search sản phẩm (by name)
   ├─ Chọn sản phẩm → auto-fill giá bán
   ├─ Nhập số lượng
   └─ Hệ thống kiểm tra tồn kho
       ├─ Đủ → Hiển thị thành tiền
       └─ Không đủ → Warning "Chỉ còn X sản phẩm"
4. Repeat step 3 cho mỗi sản phẩm
5. Hệ thống tính tổng:
   - Subtotal = Σ (đơn giá × số lượng)
   - Discount (optional): % hoặc fixed amount
   - Total = Subtotal - Discount
6. User thêm ghi chú (optional)
7. User bấm "Tạo đơn"
8. Backend:
   a. Validate all items (stock, price)
   b. Create Order document (status: "new")
   c. Create OrderItems embedded/referenced
   d. Deduct inventory for each product
   e. Return order ID
9. Frontend redirect đến Order Detail

```

### Data Model — Order Document (MongoDB)
```typescript
{
  _id: ObjectId,
  orderNumber: string,           // Auto-generated: TO-YYYYMMDD-XXXX
  customer: {
    _id: ObjectId,               // ref: Customer
    name: string,                // Denormalized for display
    phone: string,               // Denormalized
  },
  items: [{
    product: ObjectId,           // ref: Product
    productName: string,         // Denormalized (snapshot at order time)
    sku: string,
    unitPrice: number,           // Price at time of order
    costPrice: number,           // Cost at time of order (for profit calc)
    quantity: number,
    subtotal: number,            // unitPrice × quantity
  }],
  subtotal: number,              // Σ items.subtotal
  discountType: "percentage" | "fixed" | null,
  discountValue: number,
  discountAmount: number,        // Calculated discount
  total: number,                 // subtotal - discountAmount
  status: "new" | "confirmed" | "shipping" | "completed" | "cancelled",
  statusHistory: [{
    from: string,
    to: string,
    changedAt: Date,
    note: string,
  }],
  note: string,
  createdAt: Date,
  updatedAt: Date,
}
```

### Business Rules
- Order number format: `TO-YYYYMMDD-XXXX` (auto increment per day)
- Minimum 1 item per order
- Quantity > 0
- Cannot add product with stock = 0 (warning, not blocking — owner override)
- Discount cannot exceed subtotal
- Stock deduction happens atomically on order creation

---

## FR-004: Xem danh sách đơn hàng

**Module:** Orders  
**User Story:** US-ORD-002  
**Priority:** P0

### Description
Hiển thị danh sách tất cả đơn hàng dạng table với filter, sort, search, pagination.

### Table Columns
| Column | Sort | Filter | Type |
|--------|------|--------|------|
| Mã đơn (orderNumber) | ✅ | Search | string |
| Khách hàng (customer.name) | ✅ | Search | string |
| Tổng tiền (total) | ✅ | Range | currency |
| Trạng thái (status) | ❌ | Multi-select | enum |
| Ngày tạo (createdAt) | ✅ | Date range | datetime |

### Filters
| Filter | Type | Options |
|--------|------|---------|
| Trạng thái | Multi-select chips | Mới, Đã xác nhận, Đang giao, Hoàn thành, Đã hủy |
| Thời gian | Date range picker | Từ ngày - Đến ngày |
| Tìm kiếm | Text input | Mã đơn, Tên khách hàng, SĐT |

### Pagination
- Default: 20 items/page
- Server-side pagination (skip/limit)
- Show total count

### API
```
GET /api/v1/orders?page=1&limit=20&status=new,confirmed&search=TO-2026&sortBy=createdAt&sortOrder=desc&from=2026-04-01&to=2026-04-30
```

---

## FR-005: Cập nhật trạng thái đơn hàng

**Module:** Orders  
**User Story:** US-ORD-003  
**Priority:** P0

### Status Flow (State Machine)
```
                    ┌──────────────┐
                    │    Mới       │
                    │   (new)      │
                    └──────┬───────┘
                           │ Xác nhận
                    ┌──────▼───────┐
                    │ Đã xác nhận  │
                    │ (confirmed)  │
                    └──────┬───────┘
                           │ Giao hàng
                    ┌──────▼───────┐
                    │  Đang giao   │
                    │ (shipping)   │
                    └──────┬───────┘
                           │ Hoàn thành
                    ┌──────▼───────┐
                    │ Hoàn thành   │
                    │ (completed)  │
                    └──────────────┘

    * Hủy đơn: từ bất kỳ trạng thái nào (trừ completed)
      → status = "cancelled"
      → Hoàn tồn kho
      → Yêu cầu nhập lí do
```

### Allowed Transitions
| From | To | Action | Side Effect |
|------|----|--------|-------------|
| new | confirmed | Xác nhận | — |
| confirmed | shipping | Giao hàng | — |
| shipping | completed | Hoàn thành | Revenue counted |
| new | cancelled | Hủy đơn | Restore stock, require reason |
| confirmed | cancelled | Hủy đơn | Restore stock, require reason |
| shipping | cancelled | Hủy đơn | Restore stock, require reason |

### API
```
PATCH /api/v1/orders/:id/status
Body: { status: "confirmed", note?: "Đã gọi xác nhận với khách" }
```

---

## FR-006: Thêm sản phẩm mới

**Module:** Products  
**User Story:** US-PROD-001  
**Priority:** P0

### Data Model — Product Document (MongoDB)
```typescript
{
  _id: ObjectId,
  name: string,                  // Required, unique
  sku: string,                   // Auto-generated or manual
  description: string,
  category: ObjectId,            // ref: Category
  costPrice: number,             // Giá gốc (vốn)
  sellingPrice: number,          // Giá bán
  images: [string],              // URLs to uploaded images
  stock: number,                 // Current inventory quantity
  lowStockThreshold: number,     // Default: 10
  unit: string,                  // cái, kg, hộp, etc.
  isActive: boolean,             // Soft delete / hide
  createdAt: Date,
  updatedAt: Date,
}
```

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | ✅ | 1-200 chars, unique |
| sku | text | ❌ | Auto-gen if empty: `SP-XXXX` |
| description | textarea | ❌ | Max 2000 chars |
| category | select | ❌ | From Category collection |
| costPrice | number | ❌ | ≥ 0 |
| sellingPrice | number | ✅ | > 0 |
| images | file upload | ❌ | Max 5 files, 5MB each, JPG/PNG/WebP |
| stock | number | ✅ | ≥ 0 |
| lowStockThreshold | number | ❌ | Default: 10 |
| unit | text | ❌ | Default: "cái" |

### Business Rules
- Warning khi `sellingPrice < costPrice` (nhưng vẫn cho lưu)
- SKU auto-generate: `SP-0001`, `SP-0002`...
- Image upload → resize to max 800px, compress WebP

---

## FR-007: Xem / Quản lí danh sách sản phẩm

**Module:** Products  
**User Story:** US-PROD-002  
**Priority:** P0

### Table Columns
| Column | Sort | Filter |
|--------|------|--------|
| Ảnh (thumbnail) | ❌ | ❌ |
| Tên SP (name) | ✅ | Search |
| SKU | ✅ | Search |
| Danh mục (category) | ✅ | Multi-select |
| Giá bán (sellingPrice) | ✅ | Range |
| Tồn kho (stock) | ✅ | Range + status filter |
| Trạng thái | ❌ | Active/Inactive |

### Stock Status Indicators
| Condition | Badge | Color |
|-----------|-------|-------|
| stock > lowStockThreshold | Còn hàng | 🟢 Green |
| 0 < stock ≤ lowStockThreshold | Sắp hết | 🟡 Yellow |
| stock = 0 | Hết hàng | 🔴 Red |

### Actions per Row
- Edit (modal or navigate)
- Deactivate / Activate (soft delete)
- View detail

---

## FR-008: Thêm khách hàng mới

**Module:** Customers  
**User Story:** US-CUST-001  
**Priority:** P0

### Data Model — Customer Document (MongoDB)
```typescript
{
  _id: ObjectId,
  name: string,                  // Required
  phone: string,                 // Required, unique
  email: string,                 // Optional
  address: {
    street: string,
    ward: string,
    district: string,
    city: string,
  },
  tier: "new" | "regular" | "vip",  // Default: "new"
  note: string,
  totalOrders: number,           // Denormalized counter
  totalSpent: number,            // Denormalized sum
  lastOrderAt: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### Form Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | text | ✅ | 1-100 chars |
| phone | text | ✅ | Vietnamese phone format (10 digits, starts with 0) |
| email | text | ❌ | Valid email |
| address.street | text | ❌ | — |
| address.ward | text | ❌ | — |
| address.district | text | ❌ | — |
| address.city | text | ❌ | — |
| note | textarea | ❌ | Max 500 chars |

---

## FR-009: Xem / Tìm kiếm khách hàng

**Module:** Customers  
**User Story:** US-CUST-002  
**Priority:** P0

### Search Behavior
- Search field: tìm theo `name` hoặc `phone`
- Debounce: 300ms
- Minimum 2 characters
- Results: highlight matched text
- Response time < 500ms

### Table Columns
| Column | Sort | Filter |
|--------|------|--------|
| Tên (name) | ✅ | Search |
| SĐT (phone) | ✅ | Search |
| Email | ❌ | ❌ |
| Tổng đơn (totalOrders) | ✅ | ❌ |
| Tổng chi (totalSpent) | ✅ | ❌ |
| Phân loại (tier) | ❌ | Multi-select |

---

## FR-010: Dashboard KPI Overview

**Module:** Dashboard  
**User Story:** US-DASH-001  
**Priority:** P0

### KPI Cards (Top Section)
| Card | Metric | Calculation | Comparison |
|------|--------|-------------|------------|
| 💰 Doanh thu | Total revenue | Σ completed orders total | vs. previous period (%) |
| 📦 Đơn hàng mới | New orders count | Count(status = "new") today | vs. yesterday |
| 🛒 Sản phẩm bán ra | Items sold | Σ completed order items qty | vs. previous period |
| 👥 Khách hàng mới | New customers | Count(createdAt = today) | vs. yesterday |

### Quick Filters
- Hôm nay | Tuần này | Tháng này (default) | Năm nay

### API
```
GET /api/v1/dashboard/overview?period=month
```

### Response
```json
{
  "revenue": { "current": 15000000, "previous": 12000000, "changePercent": 25 },
  "newOrders": { "current": 45, "previous": 38, "changePercent": 18.4 },
  "itemsSold": { "current": 120, "previous": 95, "changePercent": 26.3 },
  "newCustomers": { "current": 12, "previous": 8, "changePercent": 50 }
}
```

---

## Summary — P0 Functional Requirements

| FR ID | Module | User Story | Description |
|-------|--------|-----------|-------------|
| FR-001 | Auth | US-AUTH-001 | Đăng nhập |
| FR-002 | Auth | US-AUTH-002 | Session persistence |
| FR-003 | Orders | US-ORD-001 | Tạo đơn hàng |
| FR-004 | Orders | US-ORD-002 | Danh sách đơn hàng |
| FR-005 | Orders | US-ORD-003 | Cập nhật trạng thái đơn |
| FR-006 | Products | US-PROD-001 | Thêm sản phẩm |
| FR-007 | Products | US-PROD-002 | Quản lí DS sản phẩm |
| FR-008 | Customers | US-CUST-001 | Thêm khách hàng |
| FR-009 | Customers | US-CUST-002 | Tìm kiếm khách hàng |
| FR-010 | Dashboard | US-DASH-001 | Dashboard KPI overview |
