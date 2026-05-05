# Technical Specification — TurboOrder MVP

> **[BA-Tech]** Phase 5 | Technical Business Analyst  
> **Epic:** `turbo-order-mvp`  
> **Created:** 2026-04-29

---

## 1. API Specification (REST v1)

**Base URL:** `http://localhost:4000/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** `Authorization: Bearer <access_token>` (except auth endpoints)

---

### 1.1 Authentication

#### POST /auth/login
Login and receive tokens.

**Request:**
```json
{
  "email": "admin@turboorder.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "user": {
      "id": "663f...",
      "email": "admin@turboorder.com",
      "name": "Admin",
      "locale": "vi"
    }
  }
}
```
*Set-Cookie: refreshToken=eyJhbG...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800*

**Response 401:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "errors.auth.invalid_credentials"
  }
}
```

#### POST /auth/refresh
Refresh access token using httpOnly cookie.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG..."
  }
}
```

#### POST /auth/logout
Clear refresh token cookie.

**Response 200:**
```json
{ "success": true }
```

---

### 1.2 Orders

#### GET /orders
List orders with filters, pagination, sorting.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max: 100) |
| search | string | — | Search orderNumber, customer name/phone |
| status | string | — | Comma-separated: `new,confirmed,shipping,completed,cancelled` |
| sortBy | string | createdAt | Field to sort by |
| sortOrder | string | desc | `asc` or `desc` |
| from | string | — | ISO date string (start date) |
| to | string | — | ISO date string (end date) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "663f...",
        "orderNumber": "TO-20260429-0001",
        "customer": {
          "_id": "663f...",
          "name": "Nguyễn Văn A",
          "phone": "0901234567"
        },
        "itemCount": 3,
        "subtotal": 1500000,
        "discountAmount": 150000,
        "total": 1350000,
        "status": "new",
        "createdAt": "2026-04-29T03:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### GET /orders/:id
Get order detail with items.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "663f...",
    "orderNumber": "TO-20260429-0001",
    "customer": {
      "_id": "663f...",
      "name": "Nguyễn Văn A",
      "phone": "0901234567",
      "email": "a@email.com"
    },
    "items": [
      {
        "product": "663f...",
        "productName": "Áo thun nam",
        "sku": "SP-0001",
        "unitPrice": 150000,
        "costPrice": 80000,
        "quantity": 2,
        "subtotal": 300000
      }
    ],
    "subtotal": 1500000,
    "discountType": "fixed",
    "discountValue": 150000,
    "discountAmount": 150000,
    "total": 1350000,
    "status": "new",
    "statusHistory": [
      {
        "from": null,
        "to": "new",
        "changedAt": "2026-04-29T03:30:00.000Z",
        "note": ""
      }
    ],
    "note": "Giao trước 5h chiều",
    "createdAt": "2026-04-29T03:30:00.000Z",
    "updatedAt": "2026-04-29T03:30:00.000Z"
  }
}
```

#### POST /orders
Create new order.

**Request:**
```json
{
  "customerId": "663f...",
  "items": [
    { "productId": "663f...", "quantity": 2 },
    { "productId": "663f...", "quantity": 1 }
  ],
  "discountType": "fixed",
  "discountValue": 150000,
  "note": "Giao trước 5h chiều"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "_id": "663f...",
    "orderNumber": "TO-20260429-0001"
  }
}
```

**Business Logic (Service):**
1. Validate customer exists
2. Validate all products exist and have sufficient stock
3. Fetch current prices (snapshot at order time)
4. Calculate subtotal, discount, total
5. Generate orderNumber (TO-YYYYMMDD-XXXX)
6. **Transaction:**
   - Create order document
   - Deduct stock for each product
   - Update customer counters (totalOrders++, totalSpent+=total, lastOrderAt)
7. Return created order

#### PATCH /orders/:id/status
Update order status.

**Request:**
```json
{
  "status": "confirmed",
  "note": "Đã gọi xác nhận với khách"
}
```

**Business Logic:**
- Validate status transition (state machine)
- If cancelling: restore stock for all items
- Push to statusHistory array
- Update order status + updatedAt

---

### 1.3 Products

#### GET /products
List products with filters.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| limit | number | 20 |
| search | string | — |
| category | string | — |
| stockStatus | string | — |
| isActive | boolean | true |
| sortBy | string | createdAt |
| sortOrder | string | desc |

#### GET /products/:id
Get product detail.

#### POST /products
Create product.

**Request (multipart/form-data):**
```
name: "Áo thun nam"
sku: ""  (auto-generate)
description: "Áo thun cotton 100%"
category: "663f..."
costPrice: 80000
sellingPrice: 150000
stock: 50
lowStockThreshold: 10
unit: "cái"
images: [File, File]  (max 5 files, 5MB each)
```

#### PUT /products/:id
Update product.

#### PATCH /products/:id/status
Activate/deactivate product.

---

### 1.4 Customers

#### GET /customers
List customers with search.

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| limit | number | 20 |
| search | string | — |
| tier | string | — |
| sortBy | string | createdAt |
| sortOrder | string | desc |

#### GET /customers/:id
Get customer detail with recent orders.

#### POST /customers
Create customer.

**Request:**
```json
{
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "a@email.com",
  "address": {
    "street": "123 Nguyễn Huệ",
    "ward": "Bến Nghé",
    "district": "Quận 1",
    "city": "TP.HCM"
  },
  "note": "Khách quen, giao hàng buổi sáng"
}
```

#### PUT /customers/:id
Update customer.

---

### 1.5 Dashboard

#### GET /dashboard/overview
Get KPI overview.

**Query Parameters:**
| Param | Type | Default | Values |
|-------|------|---------|--------|
| period | string | month | today, week, month, year |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "current": 15000000,
      "previous": 12000000,
      "changePercent": 25.0
    },
    "newOrders": {
      "current": 45,
      "previous": 38,
      "changePercent": 18.42
    },
    "itemsSold": {
      "current": 120,
      "previous": 95,
      "changePercent": 26.32
    },
    "newCustomers": {
      "current": 12,
      "previous": 8,
      "changePercent": 50.0
    }
  }
}
```

---

### 1.6 Categories

#### GET /categories
List all categories (flat list, no pagination — small dataset).

#### POST /categories
Create category.

**Request:**
```json
{
  "name": "Áo",
  "description": "Tất cả loại áo"
}
```

---

### 1.7 Health Check

#### GET /health
```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2026-04-29T03:30:00.000Z",
  "database": "connected"
}
```

---

## 2. API Response Format (Standard)

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Success with Pagination
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "errors.validation.failed",
    "details": [
      {
        "field": "email",
        "message": "errors.validation.email_invalid"
      }
    ]
  }
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, PATCH) |
| 201 | Created (POST) |
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate email/phone) |
| 422 | Unprocessable Entity (business rule violation) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 3. MongoDB Schema Design

### Collection: users
```typescript
const UserSchema = new Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  name:     { type: String, required: true },
  avatar:   { type: String },
  locale:   { type: String, default: 'vi', enum: ['vi', 'en'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
```

### Collection: categories
```typescript
const CategorySchema = new Schema({
  name:        { type: String, required: true, unique: true },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
```

### Collection: products
```typescript
const ProductSchema = new Schema({
  name:              { type: String, required: true },
  sku:               { type: String, required: true, unique: true },
  description:       { type: String },
  category:          { type: Schema.Types.ObjectId, ref: 'Category' },
  costPrice:         { type: Number, default: 0, min: 0 },
  sellingPrice:      { type: Number, required: true, min: 0 },
  images:            [{ type: String }],
  stock:             { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  unit:              { type: String, default: 'cái' },
  isActive:          { type: Boolean, default: true },
}, { timestamps: true });

// Indexes
ProductSchema.index({ name: 'text', sku: 'text' });  // Text search
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1, stock: 1 });
```

### Collection: customers
```typescript
const CustomerSchema = new Schema({
  name:  { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true },
  address: {
    street:   { type: String },
    ward:     { type: String },
    district: { type: String },
    city:     { type: String },
  },
  tier:         { type: String, enum: ['new', 'regular', 'vip'], default: 'new' },
  note:         { type: String },
  totalOrders:  { type: Number, default: 0 },
  totalSpent:   { type: Number, default: 0 },
  lastOrderAt:  { type: Date },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// Indexes
CustomerSchema.index({ name: 'text', phone: 'text' });
CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ tier: 1 });
```

### Collection: orders
```typescript
const OrderItemSchema = new Schema({
  product:     { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  sku:         { type: String, required: true },
  unitPrice:   { type: Number, required: true },
  costPrice:   { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  subtotal:    { type: Number, required: true },
}, { _id: false });

const StatusHistorySchema = new Schema({
  from:      { type: String },
  to:        { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  note:      { type: String, default: '' },
}, { _id: false });

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    _id:   { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    name:  { type: String, required: true },
    phone: { type: String, required: true },
  },
  items:          [OrderItemSchema],
  subtotal:       { type: Number, required: true },
  discountType:   { type: String, enum: ['percentage', 'fixed', null], default: null },
  discountValue:  { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total:          { type: Number, required: true },
  status:         { type: String, enum: ['new', 'confirmed', 'shipping', 'completed', 'cancelled'], default: 'new' },
  statusHistory:  [StatusHistorySchema],
  note:           { type: String },
}, { timestamps: true });

// Indexes
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'customer._id': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderNumber: 'text', 'customer.name': 'text', 'customer.phone': 'text' });
```

### Collection: settings
```typescript
const SettingsSchema = new Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

// Pre-populated keys:
// storeName, storeLogo, storePhone, storeAddress
// currency, dateFormat, timezone, defaultLocale
```

---

## 4. Team Breakdown

| Role | Scope | Parallel? |
|------|-------|-----------|
| **Senior Frontend** | React SPA: Auth, Layout, Dashboard, Orders, Products, Customers pages | ⚡ Parallel with Backend |
| **Senior Backend** | Express API: All modules, Mongoose models, middleware | ⚡ Parallel with Frontend |

> Both teams coordinate via API contract defined above. Frontend uses mock data until backend is ready.

---

## 5. Docker Compose Configuration

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: turboorder-db
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "rs.status()"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongo-init:
    image: mongo:7
    depends_on:
      mongodb:
        condition: service_healthy
    command: >
      mongosh --host mongodb --eval '
        rs.initiate({
          _id: "rs0",
          members: [{ _id: 0, host: "mongodb:27017" }]
        })
      '
    restart: "no"

  api:
    build:
      context: ../
      dockerfile: docker/Dockerfile.api
    container_name: turboorder-api
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/turboorder?replicaSet=rs0
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - WEB_URL=http://localhost:3000
    depends_on:
      mongodb:
        condition: service_healthy
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  web:
    build:
      context: ../
      dockerfile: docker/Dockerfile.web
    container_name: turboorder-web
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  mongodb_data:
  uploads:

networks:
  default:
    name: turboorder-network
```

---

⏭️ **NEXT ACTION:** Phase 5a [QE] test plan + Phase 5b [DEV] implementation — **parallel**
