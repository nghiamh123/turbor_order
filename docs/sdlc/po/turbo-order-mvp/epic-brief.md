# Epic: TurboOrder MVP — Sales Management Platform

> **[PO]** Phase 1 | Product Owner  
> **Epic Slug:** `turbo-order-mvp`  
> **Priority:** P0 — Critical  
> **Created:** 2026-04-29  
> **Updated:** 2026-04-29 — User confirmed: Ant Design 5, MongoDB, i18n, P0 scope, Docker Local

---

## 1. Problem Statement

Bạn cần một hệ thống quản lí bán hàng nội bộ (internal) để:
- Theo dõi đơn hàng từ tạo → xử lí → hoàn thành
- Quản lí sản phẩm, tồn kho
- Quản lí thông tin khách hàng
- Xem báo cáo doanh thu, lợi nhuận
- Tối ưu quy trình bán hàng cá nhân

**Yêu cầu đặc biệt:** Nếu sử dụng tốt → thương mại hóa, nên thiết kế scalable từ đầu.

---

## 2. Success Metrics (KPIs)

| KPI | Target | Measurement |
|-----|--------|-------------|
| Thời gian tạo đơn hàng | < 30 giây | Time tracking in-app |
| Page load time | < 1s (SPA) | Lighthouse / Web Vitals |
| Uptime | 99.5%+ | Health check monitoring |
| Số đơn xử lí/ngày | Không giới hạn | Database capacity |
| Thời gian tìm kiếm sản phẩm/khách hàng | < 2 giây | UI response time |
| Report generation | < 3 giây | Backend processing time |

---

## 3. Feasibility Assessment

### 3.1 Technical Feasibility ✅

| Aspect | Assessment | Risk |
|--------|-----------|------|
| React + Vite Frontend | Mature, fast HMR, excellent DX | Low |
| Node.js + Express Backend | Battle-tested, huge ecosystem | Low |
| MongoDB Database | Flexible schema, excellent with Node.js, document-based fits order/product data | Low |
| JWT Authentication | Standard, scalable auth pattern | Low |
| REST API | Simple, well-understood, sufficient for MVP | Low |
| Docker Deployment | Standard containerization | Low |

### 3.2 Operational Feasibility ✅

- Single developer/operator — cần UI intuitive, minimal maintenance
- Dữ liệu nhạy cảm (doanh thu, khách hàng) — cần auth & encryption
- Scalable architecture cho commercial phase

### 3.3 Economic Feasibility ✅

- Open-source stack → $0 license cost
- Docker Local deployment → $0 infrastructure cost
- Dev time: ~3-4 weeks MVP (P0 scope only)

---

## 4. Tech Stack Recommendation

### Frontend

| Technology | Purpose | Version |
|-----------|---------|---------|
| **React 19** | UI Library | ^19.x |
| **Vite 6** | Build tool + Dev server (HMR cực nhanh) | ^6.x |
| **TypeScript 5** | Type safety | ^5.x |
| **React Router v7** | Client-side routing (SPA) | ^7.x |
| **TanStack Query v5** | Server state management, caching, auto-refetch | ^5.x |
| **Zustand** | Client state management (lightweight, simple) | ^5.x |
| **Ant Design 5** | UI Component library (tables, forms, charts — phù hợp admin/dashboard) | ^5.x |
| **react-i18next** | Internationalization (Vietnamese + English from MVP) | ^15.x |
| **Recharts** | Charts/Graphs cho báo cáo | ^2.x |
| **Axios** | HTTP client | ^1.x |
| **Day.js** | Date manipulation (lightweight) | ^1.x |
| **React Hook Form + Zod** | Form handling + validation | latest |

> **Tại sao Ant Design?** — Built-in table với sort/filter/pagination, form components, layout system, date picker Vietnamese locale. Perfect cho admin/management app. User confirmed.

### Backend

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js 22 LTS** | Runtime | ^22.x |
| **Express.js** | HTTP framework | ^5.x |
| **TypeScript 5** | Type safety (shared types FE/BE) | ^5.x |
| **Mongoose** | MongoDB ODM (schema validation, middleware, population) | ^8.x |
| **MongoDB 7** | Primary database (document-based, flexible schema) | ^7 |
| **JWT (jsonwebtoken)** | Authentication | ^9.x |
| **bcryptjs** | Password hashing | ^3.x |
| **Zod** | Request validation (shared with FE) | ^3.x |
| **Winston** | Structured logging | ^3.x |
| **Helmet + CORS** | Security headers | latest |
| **i18next** | Backend i18n (error messages, notifications) | ^24.x |
| **Multer** | File upload (product images) | ^1.x |

### Shared / DevOps

| Technology | Purpose |
|-----------|---------|
| **pnpm** | Package manager (workspace monorepo) |
| **ESLint + Prettier** | Code quality |
| **Vitest** | Unit testing (FE + BE) |
| **Docker + Docker Compose** | Containerization |
| **GitHub Actions** | CI/CD |

---

## 5. Project Structure

```
TurboOrder/
├── apps/
│   ├── web/                          # Frontend (React + Vite)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── assets/               # Images, fonts, icons
│   │   │   ├── components/           # Shared/reusable components
│   │   │   │   ├── ui/               # Base UI wrappers (Button, Modal, etc.)
│   │   │   │   ├── layout/           # AppLayout, Sidebar, Header
│   │   │   │   └── common/           # SearchBar, StatusBadge, etc.
│   │   │   ├── features/             # Feature-based modules
│   │   │   │   ├── dashboard/        # Dashboard page + components
│   │   │   │   ├── orders/           # Order management
│   │   │   │   ├── products/         # Product/inventory management
│   │   │   │   ├── customers/        # Customer management
│   │   │   │   ├── reports/          # Reports & analytics
│   │   │   │   ├── settings/         # App settings
│   │   │   │   └── auth/             # Login, auth guards
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── i18n/                 # i18n config + locale files
│   │   │   │   ├── locales/
│   │   │   │   │   ├── vi.json       # Vietnamese translations
│   │   │   │   │   └── en.json       # English translations
│   │   │   │   └── index.ts          # i18next setup
│   │   │   ├── lib/                  # Utilities, API client, helpers
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── types/                # TypeScript types/interfaces
│   │   │   ├── routes/               # Route definitions
│   │   │   ├── styles/               # Global CSS, theme
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Backend (Node.js + Express)
│       ├── src/
│       │   ├── config/               # DB, env, constants
│       │   ├── models/               # Mongoose schemas/models
│       │   ├── modules/              # Feature-based modules
│       │   │   ├── auth/             # Auth controller, service, routes
│       │   │   ├── orders/           # Order CRUD + business logic
│       │   │   ├── products/         # Product management
│       │   │   ├── customers/        # Customer management
│       │   │   ├── reports/          # Report generation
│       │   │   └── settings/         # App configuration
│       │   ├── middleware/           # Auth, error handler, validation
│       │   ├── lib/                  # Shared utilities
│       │   ├── types/               # Shared TypeScript types
│       │   └── server.ts            # Express app entry
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                      # Shared types, constants, validation schemas
│       ├── src/
│       │   ├── types/               # Shared TypeScript interfaces
│       │   ├── constants/           # Shared enums, status codes
│       │   └── validation/          # Shared Zod schemas
│       ├── tsconfig.json
│       └── package.json
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── docker-compose.yml
│
├── docs/
│   └── sdlc/                       # SDLC documentation (existing)
│
├── .github/
│   └── workflows/                   # CI/CD pipelines
│
├── pnpm-workspace.yaml
├── package.json                     # Root workspace config
├── tsconfig.base.json               # Base TS config
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. Feature Modules (MVP Scope)

### 6.1 🔐 Authentication (auth)
- Login/Logout (email + password)
- JWT token management (access + refresh tokens)
- Protected routes
- Session persistence

### 6.2 📊 Dashboard (dashboard)
- Tổng quan doanh thu hôm nay / tuần / tháng
- Số đơn hàng mới, đang xử lí, hoàn thành
- Top sản phẩm bán chạy
- Biểu đồ doanh thu theo thời gian (line chart)
- Biểu đồ đơn hàng theo trạng thái (doughnut chart)
- Quick actions: Tạo đơn nhanh, Thêm sản phẩm

### 6.3 📦 Order Management (orders)
- **Tạo đơn hàng mới:** Chọn khách hàng, thêm sản phẩm, tính tổng tự động
- **Danh sách đơn hàng:** Table với filter, sort, search, pagination
- **Trạng thái đơn:** Mới → Xác nhận → Đang giao → Hoàn thành → Hủy
- **Chi tiết đơn:** Xem/sửa thông tin, lịch sử thay đổi trạng thái
- **In hóa đơn:** Export PDF/Print
- **Ghi chú đơn hàng:** Notes cho từng đơn

### 6.4 🏷️ Product Management (products)
- **CRUD sản phẩm:** Tên, mô tả, giá gốc, giá bán, hình ảnh, danh mục
- **Quản lí tồn kho:** Số lượng, cảnh báo hết hàng
- **Danh mục sản phẩm:** Categories hierarchy
- **Tìm kiếm & filter:** Theo tên, danh mục, trạng thái tồn kho
- **Import/Export:** CSV import sản phẩm hàng loạt

### 6.5 👥 Customer Management (customers)
- **CRUD khách hàng:** Tên, SĐT, email, địa chỉ, ghi chú
- **Lịch sử mua hàng:** Xem tất cả đơn của khách
- **Phân loại khách:** VIP, Regular, New
- **Tìm kiếm nhanh:** Theo tên hoặc SĐT

### 6.6 📈 Reports & Analytics (reports)
- **Báo cáo doanh thu:** Theo ngày / tuần / tháng / năm
- **Báo cáo lợi nhuận:** Doanh thu - Giá vốn
- **Báo cáo sản phẩm:** Top bán chạy, tồn kho chậm
- **Báo cáo khách hàng:** Top khách hàng, tần suất mua
- **Export:** PDF, Excel (xlsx)

### 6.7 ⚙️ Settings (settings)
- **Thông tin cửa hàng:** Tên, logo, địa chỉ, SĐT
- **Cấu hình:** Đơn vị tiền tệ, định dạng ngày, timezone
- **Quản lí tài khoản:** Đổi mật khẩu, profile
- **Backup data:** Export/Import database

---

## 7. Non-Functional Requirements (NFR Summary)

| NFR | Target |
|-----|--------|
| Performance | Page load < 1s, API response p95 < 500ms |
| Scalability | Monorepo structure ready for microservices migration |
| Security | JWT auth, bcrypt passwords, CORS, Helmet, input validation |
| Availability | Docker Local deployment, health checks |
| Usability | i18n (Vietnamese + English), responsive (tablet-friendly for POS scenarios) |
| Maintainability | TypeScript strict, 100% unit test coverage, ESLint/Prettier |
| Data integrity | MongoDB transactions (replica set), Mongoose validation |

---

## 8. Dependencies & Constraints

- **Database:** MongoDB 7 (Docker container)
- **Node.js:** v22 LTS required
- **Browser support:** Chrome/Edge latest (internal use)
- **Language:** i18n — Vietnamese (default) + English, English codebase
- **Deployment:** Docker Local (docker-compose)
- **Scope:** P0 features only (10 user stories)
- **Single tenant MVP:** 1 user, 1 store (multi-tenant cho commercial phase)

---

## 9. Phased Delivery Plan

### Phase A: Foundation (Week 1)
- Project setup (monorepo, configs, Docker Compose with MongoDB)
- Auth module (login, JWT, protected routes)
- Mongoose models + seed data
- App layout (Sidebar, Header, theme)
- i18n setup (react-i18next + locale files)

### Phase B: Core Features (Week 2-3)
- Product management (CRUD — P0)
- Customer management (CRUD, search — P0)
- Order management (create, list, status flow — P0)
- Dashboard KPI overview (P0)

### Phase C: Production Ready (Week 3-4)
- Docker Local deployment (docker-compose.yml)
- Testing (unit + integration)
- Security hardening
- Documentation

> **P1/P2 features** (Reports, Settings, Export, Import) will be added in subsequent iterations.

---

## 10. Future Scope (Commercial Phase)

> Không thuộc MVP, nhưng architecture phải support:

- Multi-tenant (nhiều cửa hàng)
- Role-based access (Admin, Manager, Staff)
- POS mode (bán tại quầy)
- Payment gateway integration (VNPay, Momo)
- Notification system (email, SMS)
- Barcode/QR scanning
- Supplier management
- Multi-warehouse
- API for mobile app
