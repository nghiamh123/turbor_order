# Design Specification — TurboOrder MVP

> **[UX]** Phase 3 | Design  
> **Epic:** `turbo-order-mvp`  
> **Created:** 2026-04-29  
> **Design System:** Ant Design 5 + Custom Theme

---

## 1. Design Philosophy

### Principles
1. **Speed over decoration** — MVP nội bộ, ưu tiên thao tác nhanh
2. **Information density** — Hiển thị nhiều data, ít click
3. **Familiar patterns** — Ant Design standard patterns → zero learning curve
4. **Dark mode ready** — Theme tokens cho cả light/dark
5. **Vietnamese-first** — Default locale vi_VN, nhưng i18n-ready

### Anti-AI Pattern
- Không dùng gradient vô tội vạ
- Không dùng quá nhiều rounded corners
- Color palette có chủ đích, không random
- Typography hierarchy rõ ràng

---

## 2. Color System (Design Tokens)

### Brand Colors
```css
/* Primary — Electric Blue (modern, trustworthy, professional) */
--color-primary: #1677FF;          /* Ant Design default blue — proven */
--color-primary-hover: #4096FF;
--color-primary-active: #0958D9;
--color-primary-bg: #E6F4FF;

/* Secondary — Teal (fresh, distinguishes from generic blue) */
--color-secondary: #13C2C2;
--color-secondary-hover: #36CFC9;
--color-secondary-bg: #E6FFFB;
```

### Semantic Colors
```css
/* Status Colors */
--color-success: #52C41A;         /* Hoàn thành, Còn hàng */
--color-warning: #FAAD14;         /* Sắp hết hàng, Pending */
--color-error: #FF4D4F;           /* Hết hàng, Lỗi, Hủy */
--color-info: #1677FF;            /* Thông tin, Mới */

/* Order Status Specific */
--status-new: #1677FF;            /* Blue — Mới */
--status-confirmed: #722ED1;      /* Purple — Đã xác nhận */
--status-shipping: #FA8C16;       /* Orange — Đang giao */
--status-completed: #52C41A;      /* Green — Hoàn thành */
--status-cancelled: #FF4D4F;      /* Red — Đã hủy */
```

### Neutral Colors
```css
/* Light Theme */
--bg-layout: #F5F5F5;             /* Layout background */
--bg-container: #FFFFFF;          /* Card/container background */
--bg-elevated: #FFFFFF;           /* Modal, dropdown */
--border: #D9D9D9;
--text-primary: rgba(0, 0, 0, 0.88);
--text-secondary: rgba(0, 0, 0, 0.65);
--text-tertiary: rgba(0, 0, 0, 0.45);

/* Dark Theme (future) */
--bg-layout-dark: #141414;
--bg-container-dark: #1F1F1F;
--text-primary-dark: rgba(255, 255, 255, 0.85);
```

---

## 3. Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
             'Apple Color Emoji', 'Segoe UI Emoji';
```
> Using Ant Design's default system font stack — optimal for Vietnamese characters, no extra font loading = faster load.

### Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 24px | 600 | Page title |
| H2 | 20px | 600 | Section title |
| H3 | 16px | 600 | Card title |
| Body | 14px | 400 | Default text |
| Caption | 12px | 400 | Helper text, timestamps |
| Tiny | 10px | 400 | Badges only |

### Numbers (Currency)
```
Format: 1.500.000 ₫  (Vietnamese format)
Font feature: tabular-nums (monospaced digits for alignment)
```

---

## 4. Layout & Spacing

### Grid System
```
┌────────────────────────────────────────────────────────┐
│ Header (64px height, fixed top)                        │
├────────┬───────────────────────────────────────────────┤
│Sidebar │              Content Area                     │
│(240px  │         (padding: 24px)                       │
│collapsed│                                              │
│ 80px)  │                                               │
│        │                                               │
│        │                                               │
│        │                                               │
│        │                                               │
└────────┴───────────────────────────────────────────────┘
```

### Spacing Scale (Ant Design default)
| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline spacing |
| sm | 8px | Compact spacing |
| md | 16px | Default gap |
| lg | 24px | Section spacing, content padding |
| xl | 32px | Large section gaps |
| xxl | 48px | Page-level spacing |

### Breakpoints
| Name | Width | Target |
|------|-------|--------|
| xs | < 576px | Mobile (not primary) |
| sm | ≥ 576px | Mobile landscape |
| md | ≥ 768px | Tablet |
| lg | ≥ 992px | Desktop (minimum target) |
| xl | ≥ 1200px | Desktop (primary target) |
| xxl | ≥ 1600px | Large desktop |

---

## 5. Component Specifications

### 5.1 Login Page

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [TurboOrder Logo]                   │
│              ⚡ TurboOrder                       │
│                                                 │
│         ┌─────────────────────────┐             │
│         │                         │             │
│         │  ┌───────────────────┐  │             │
│         │  │ 📧 Email          │  │             │
│         │  └───────────────────┘  │             │
│         │                         │             │
│         │  ┌───────────────────┐  │             │
│         │  │ 🔒 Password    👁 │  │             │
│         │  └───────────────────┘  │             │
│         │                         │             │
│         │  [☑ Ghi nhớ đăng nhập]  │             │
│         │                         │             │
│         │  ┌───────────────────┐  │             │
│         │  │   Đăng nhập  ▶   │  │             │
│         │  └───────────────────┘  │             │
│         │                         │             │
│         └─────────────────────────┘             │
│                                                 │
│         [🌐 Tiếng Việt ▾]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Specs:**
- Centered card (max-width: 400px)
- Background: subtle gradient or solid `--bg-layout`
- Card: `--bg-container` with shadow-md
- Logo: SVG, 48px height
- Form: Ant Design Form + Input components
- Validation: inline error messages
- Submit: Ant Design Button type="primary" block
- Language switcher at bottom

---

### 5.2 App Layout (Sidebar + Header)

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ TurboOrder        [🔍 Tìm kiếm...]        [🌐][🔔][👤 Admin]│ ← Header
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│  📊   │  ┌─ Breadcrumb: Dashboard                              │
│  Bảng  │  │                                                     │
│  điều  │  │  Content loads here...                              │
│  khiển │  │                                                     │
│        │  │                                                     │
│  📦   │  │                                                     │
│  Đơn   │  │                                                     │
│  hàng  │  │                                                     │
│        │  │                                                     │
│  🏷️   │  │                                                     │
│  Sản   │  │                                                     │
│  phẩm  │  │                                                     │
│        │  │                                                     │
│  👥   │  │                                                     │
│  Khách │  │                                                     │
│  hàng  │  │                                                     │
│        │  │                                                     │
│  ──────│  │                                                     │
│  ⚙️   │  │                                                     │
│  Cài   │  │                                                     │
│  đặt   │  │                                                     │
│        │  └─────────────────────────────────────────────────────│
│ [◀ Thu]│                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

**Sidebar Specs:**
- Ant Design `Layout.Sider` with `collapsible`
- Width: 240px (expanded), 80px (collapsed)
- Background: white (light) / dark (dark mode)
- Menu items: Icon + Label (collapsed: icon only with tooltip)
- Active item: primary color background highlight
- Collapse trigger at bottom

**Header Specs:**
- Height: 64px, fixed top
- Left: Logo (linked to Dashboard)
- Center: Global search (Ant Design `Input.Search`)
- Right: Language switcher, Notifications bell, User avatar + dropdown

---

### 5.3 Dashboard Page

```
┌────────────────────────────────────────────────────────────────┐
│  Bảng điều khiển          [Hôm nay|Tuần này|Tháng|Năm]        │
├────────────┬───────────┬───────────┬───────────────────────────┤
│  💰        │  📦       │  🛒       │  👥                      │
│  Doanh thu │  Đơn mới  │  SP bán   │  Khách mới              │
│  15.000.000│  45       │  120      │  12                      │
│  ₫         │  đơn      │  sản phẩm │  khách                  │
│  ↑ 25%     │  ↑ 18%    │  ↑ 26%   │  ↑ 50%                  │
├────────────┴───────────┴───────────┴───────────────────────────┤
│                                                                │
│  [ + Tạo đơn hàng ]   [ + Thêm sản phẩm ]   [ + Thêm khách ] │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**KPI Cards:**
- Ant Design `Card` with `Statistic` component
- 4 columns on desktop, 2 on tablet
- Icon: colored circle background
- Value: 24px, bold, `tabular-nums`
- Change %: green (positive) / red (negative) with arrow icon
- Ant Design `Segmented` for period filter

**Quick Actions:**
- Ant Design `Button` group, type="dashed"
- Icon + text
- Opens respective create form

---

### 5.4 Order List Page

```
┌────────────────────────────────────────────────────────────────┐
│  Đơn hàng                                    [ + Tạo đơn ]    │
├────────────────────────────────────────────────────────────────┤
│  [🔍 Tìm mã đơn, khách hàng...]  [📅 Từ - Đến]              │
│  [Tất cả][Mới][Đã XN][Đang giao][Hoàn thành][Đã hủy]        │
├────────────────────────────────────────────────────────────────┤
│  Mã đơn ↕  │ Khách hàng   │ Tổng tiền ↕ │ Trạng thái │ Ngày │
│────────────────────────────────────────────────────────────────│
│  TO-0429-  │ Nguyễn Văn A │ 2.500.000 ₫ │ [🔵 Mới]   │ 29/4 │
│  0001      │ 0901234567   │             │            │ 10:30│
│────────────────────────────────────────────────────────────────│
│  TO-0429-  │ Trần Thị B   │ 850.000 ₫   │ [🟢 Xong]  │ 29/4 │
│  0002      │ 0987654321   │             │            │ 09:15│
│────────────────────────────────────────────────────────────────│
│                          [ 1  2  3  ... 10 ]                   │
└────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Ant Design `Table` with server-side pagination
- Status filter: `Segmented` or `Tag` chips (multi-select)
- Search: `Input.Search` debounced 300ms
- Date range: `DatePicker.RangePicker` 
- Status badge: `Tag` with semantic color
- Row click → navigate to Order Detail
- Row hover: subtle background highlight
- Actions column: Dropdown (View, Update Status, Cancel)

---

### 5.5 Create Order Page

```
┌────────────────────────────────────────────────────────────────┐
│  ← Quay lại    Tạo đơn hàng mới                               │
├────────────────────────────────┬───────────────────────────────┤
│  Thông tin khách hàng          │  Tóm tắt đơn hàng            │
│  ┌───────────────────────┐     │                               │
│  │ 🔍 Tìm khách hàng... │     │  Tạm tính:    2.500.000 ₫    │
│  └───────────────────────┘     │  Giảm giá:   -  250.000 ₫    │
│  [hoặc + Tạo khách mới]       │  ─────────────────────────    │
│                                │  Tổng cộng:   2.250.000 ₫    │
│  👤 Nguyễn Văn A              │                               │
│  📱 0901234567                 │  ┌───────────────────────┐    │
│                                │  │    Tạo đơn hàng  ▶   │    │
│  ──────────────────────        │  └───────────────────────┘    │
│                                │                               │
│  Sản phẩm                      │  Giảm giá                     │
│  ┌───────────────────────┐     │  ( ) Không                    │
│  │ 🔍 Tìm sản phẩm...   │     │  ( ) % ┌────┐                │
│  └───────────────────────┘     │  (•) ₫ │250K│                │
│                                │        └────┘                │
│  ┌─────────────────────────┐   │                               │
│  │ Áo thun nam   150.000 ₫│   │  Ghi chú                     │
│  │ [-] 2 [+]  = 300.000 ₫ │   │  ┌─────────────────────┐     │
│  │                    [🗑] │   │  │ Giao trước 5h chiều │     │
│  ├─────────────────────────┤   │  └─────────────────────┘     │
│  │ Quần jean    350.000 ₫ │   │                               │
│  │ [-] 1 [+]  = 350.000 ₫ │   │                               │
│  │                    [🗑] │   │                               │
│  └─────────────────────────┘   │                               │
└────────────────────────────────┴───────────────────────────────┘
```

**Layout:** 2-column on desktop (8:4 ratio), stack on tablet
- Left: Customer selection + Product list
- Right: Order summary (sticky on scroll)
- Customer search: `Select` with search + create option
- Product search: `Select` with search, shows name + price + stock
- Product item: Card with quantity stepper, auto-calculate subtotal
- Remove item: `Button` danger icon
- Discount: `Radio.Group` (None / Percentage / Fixed) with `InputNumber`
- Total: real-time calculation, bold, large font
- Submit: `Button` type="primary" block, with loading state

---

### 5.6 Product List Page

```
┌────────────────────────────────────────────────────────────────┐
│  Sản phẩm                                  [ + Thêm sản phẩm ] │
├────────────────────────────────────────────────────────────────┤
│  [🔍 Tìm tên, SKU...]  [Danh mục ▾]  [Tồn kho ▾]            │
├────────────────────────────────────────────────────────────────┤
│  [📷] │ Tên SP          │ SKU      │ Giá bán    │ Tồn │ TT   │
│────────────────────────────────────────────────────────────────│
│  [📷] │ Áo thun nam     │ SP-0001  │ 150.000 ₫  │  45 │ 🟢  │
│  [📷] │ Quần jean       │ SP-0002  │ 350.000 ₫  │   8 │ 🟡  │
│  [📷] │ Giày sneaker    │ SP-0003  │ 890.000 ₫  │   0 │ 🔴  │
├────────────────────────────────────────────────────────────────┤
│                          [ 1  2  3 ]                           │
└────────────────────────────────────────────────────────────────┘
```

---

### 5.7 Customer List Page

```
┌────────────────────────────────────────────────────────────────┐
│  Khách hàng                                [ + Thêm khách ]    │
├────────────────────────────────────────────────────────────────┤
│  [🔍 Tìm tên, SĐT...]  [Phân loại ▾]                        │
├────────────────────────────────────────────────────────────────┤
│  Tên           │ SĐT        │ Đơn  │ Tổng chi    │ Loại      │
│────────────────────────────────────────────────────────────────│
│  Nguyễn Văn A  │ 0901234567 │  15  │ 5.200.000 ₫ │ [⭐ VIP]  │
│  Trần Thị B    │ 0987654321 │   3  │   850.000 ₫ │ [Regular] │
│  Lê Văn C      │ 0912345678 │   1  │   150.000 ₫ │ [🆕 New]  │
├────────────────────────────────────────────────────────────────┤
│                          [ 1  2  3 ]                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Interaction Patterns

### Loading States
| Context | Pattern |
|---------|---------|
| Page load | Ant Design `Skeleton` (table rows, cards) |
| Button action | `Button` loading prop (spinner + disabled) |
| Data fetch | `Spin` wrapper around content area |
| Search | Subtle loading indicator in input |

### Empty States
| Context | Message (vi) | CTA |
|---------|-------------|-----|
| No orders | Chưa có đơn hàng nào | + Tạo đơn đầu tiên |
| No products | Chưa có sản phẩm nào | + Thêm sản phẩm |
| No customers | Chưa có khách hàng nào | + Thêm khách hàng |
| No search results | Không tìm thấy kết quả | Thử tìm kiếm khác |

### Notifications (Toast)
| Type | Duration | Example |
|------|----------|---------|
| Success | 3s | ✅ Đã tạo đơn hàng TO-0429-0001 |
| Error | 5s | ❌ Không thể tạo đơn hàng. Vui lòng thử lại. |
| Warning | 4s | ⚠️ Sản phẩm "Áo thun" sắp hết hàng (còn 3) |
| Info | 3s | ℹ️ Đơn hàng đã chuyển sang "Đang giao" |

### Confirmations (Modal)
| Action | Confirmation |
|--------|-------------|
| Cancel order | Modal: "Bạn có chắc muốn hủy đơn TO-0429-0001?" + Lí do (required) |
| Delete product | Modal: "Vô hiệu hóa sản phẩm 'Áo thun nam'?" |
| Logout | No confirmation (instant) |

---

## 7. Ant Design Theme Configuration

```typescript
// theme/themeConfig.ts
const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#1677FF',
    borderRadius: 6,
    fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
    fontSize: 14,
    colorBgLayout: '#F5F5F5',
    controlHeight: 36,
  },
  components: {
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#E6F4FF',
      itemSelectedColor: '#1677FF',
      itemHeight: 48,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerSortActiveBg: '#F0F0F0',
      rowHoverBg: '#FAFAFA',
      cellPaddingBlock: 12,
    },
    Card: {
      paddingLG: 20,
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(5, 145, 255, 0.1)',
    },
    Statistic: {
      contentFontSize: 24,
    },
  },
};
```

---

## 8. Responsive Behavior

| Screen | Sidebar | Layout | Table |
|--------|---------|--------|-------|
| ≥1200px (xl) | Expanded (240px) | Side-by-side | Full columns |
| ≥768px (md) | Collapsed (80px) | Side-by-side | Reduced columns |
| <768px (xs) | Drawer (overlay) | Stacked | Card view / scroll |

> **MVP focus:** Desktop (≥1200px) + Tablet (≥768px). Mobile is nice-to-have.

---

## 9. Review Checklist

### [PO] Review
- [x] All P0 user stories have corresponding screens
- [x] Quick actions on Dashboard match PO requirement
- [x] Order status flow matches defined states
- [x] KPI cards show metrics defined in success criteria

### [BA] Review
- [x] All FR-001 through FR-010 have UI representations
- [x] Data models reflected in forms (all fields present)
- [x] Process flows match navigation structure
- [x] Search/filter capabilities match specifications
- [x] i18n language switcher present

### Design Approval
- **PO:** ✅ Approved — all user stories covered
- **BA:** ✅ Approved — all functional requirements represented

⏭️ **NEXT ACTION:** Handoff to Phase 4 [SA] Architect
