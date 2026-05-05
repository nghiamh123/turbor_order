# Architecture Decision Records — TurboOrder MVP

> **[SA]** Phase 4 | Solution Architect  
> **Epic:** `turbo-order-mvp`  
> **Created:** 2026-04-29

---

## ADR-001: Monorepo with pnpm Workspaces

### Status: Accepted

### Context
TurboOrder has separate frontend (React+Vite) and backend (Node.js+Express) apps that share TypeScript types, validation schemas, and constants. Need a project structure that enables code sharing while keeping clear separation.

### Decision
Use **pnpm workspaces** monorepo with structure:
```
apps/web      → Frontend SPA
apps/api      → Backend REST API
packages/shared → Shared types, validators, constants
```

### Rationale
- **Code sharing**: Single source of truth for types (Order, Product, Customer interfaces) and validation schemas (Zod)
- **Atomic changes**: One PR can update API contract + frontend consumer
- **DX**: Single `pnpm install`, coordinated scripts
- **Not over-engineered**: Simple workspace, no Nx/Turborepo needed for 2 apps

### Consequences
- ✅ Type safety across FE/BE boundary
- ✅ Shared Zod schemas = single validation source
- ⚠️ Docker builds need workspace context (multi-stage)
- ⚠️ CI needs to handle workspace dependencies

---

## ADR-002: MongoDB + Mongoose (over PostgreSQL + Prisma)

### Status: Accepted (User Decision)

### Context
User selected MongoDB over PostgreSQL. Data model includes orders with nested items, customers with denormalized counters, products with variable attributes.

### Decision
Use **MongoDB 7** with **Mongoose 8** ODM.

### Rationale
- **User preference**: Familiar with MongoDB
- **Document model fits**: Order = document with embedded items (single read)
- **Schema flexibility**: Products may have variable attributes in commercial phase
- **Mongoose**: Rich middleware (pre/post hooks), validation, population, TypeScript support
- **Denormalization natural**: Customer name in Order (snapshot pattern)

### Trade-offs
| Aspect | MongoDB | PostgreSQL |
|--------|---------|------------|
| Schema flexibility | ✅ Excellent | ❌ Rigid |
| Transactions | ⚠️ Needs replica set | ✅ Built-in |
| Aggregation | ✅ Pipeline (powerful) | ✅ SQL GROUP BY |
| Relations | ⚠️ Manual (populate) | ✅ JOINs |
| Type safety | ⚠️ Mongoose schemas | ✅ Prisma generated |

### Consequences
- Must run MongoDB as replica set for transaction support (order creation = stock deduction)
- Docker Compose config with replica set init
- Denormalize strategically (customer info in orders)
- Use Mongoose discriminators if needed for commercial phase

---

## ADR-003: REST API (over GraphQL)

### Status: Accepted

### Context
Need API protocol between React SPA and Express backend. 10 P0 functional requirements with well-defined CRUD operations.

### Decision
Use **REST API** with versioned endpoints (`/api/v1/...`).

### Rationale
- Simple CRUD operations — REST is perfect fit
- Single client (web SPA) — no over/under-fetching concern
- Team familiarity
- Ant Design table pagination/sort maps naturally to REST query params
- OpenAPI documentation straightforward

### Consequences
- ✅ Simple, well-understood
- ✅ Easy to document (OpenAPI/Swagger)
- ⚠️ May need GraphQL for commercial phase (mobile app, complex queries)

---

## ADR-004: JWT Authentication Strategy

### Status: Accepted

### Context
Single-user MVP needs authentication. Must be stateless for horizontal scaling in commercial phase.

### Decision
Dual-token JWT strategy:
- **Access token**: Short-lived (15min), stored in memory (Zustand)
- **Refresh token**: Long-lived (7 days), stored in httpOnly secure cookie

### Architecture
```
Login → Access Token (memory) + Refresh Token (httpOnly cookie)
         │
         ├── API Request → Authorization: Bearer <access_token>
         │   └── Expired? → POST /auth/refresh (cookie auto-sent)
         │       └── New access token → retry original request
         │
         └── Logout → Clear memory + clear cookie
```

### Rationale
- Memory storage = no XSS attack on access token
- httpOnly cookie = no JavaScript access to refresh token
- Short access token = minimal damage if leaked
- Token rotation on refresh = revoke compromised tokens
- Stateless = no server-side session storage needed

### Consequences
- ✅ Secure against XSS + CSRF (with SameSite)
- ✅ Scalable (stateless)
- ⚠️ Access token lost on page refresh (automatic refresh via cookie)
- ⚠️ Need Axios interceptor for automatic token refresh

---

## ADR-005: Feature-based Module Structure

### Status: Accepted

### Context
Need a code organization pattern that scales from MVP to commercial while keeping things navigable.

### Decision
Feature-based modules for both frontend and backend:

```
# Frontend
src/features/{feature}/
  ├── components/     # Feature-specific components
  ├── hooks/          # Feature-specific hooks
  ├── services/       # API calls (TanStack Query)
  ├── types.ts        # Feature-specific types
  └── index.tsx       # Page component (route entry)

# Backend
src/modules/{module}/
  ├── {module}.controller.ts   # Route handlers
  ├── {module}.service.ts      # Business logic
  ├── {module}.routes.ts       # Express router
  ├── {module}.validation.ts   # Zod schemas
  └── {module}.types.ts        # Module-specific types
```

### Rationale
- **Cohesion**: Everything related to "orders" is in one folder
- **Scalability**: Easy to extract module into microservice
- **DX**: New developer knows exactly where to look
- **SoC**: Controller ↔ Service ↔ Model separation within each module

---

## ADR-006: i18n Strategy

### Status: Accepted

### Context
User requires internationalization from MVP (Vietnamese + English). Need consistent approach across frontend and backend.

### Decision
- **Frontend**: `react-i18next` with JSON locale files
- **Backend**: `i18next` for error messages, return i18n keys
- **Ant Design**: Locale provider (vi_VN, en_US)
- **Day.js**: Locale switching (vi, en)

### Architecture
```
Frontend (react-i18next)
├── src/i18n/locales/vi.json    # Vietnamese translations
├── src/i18n/locales/en.json    # English translations
├── Ant Design ConfigProvider locale={viVN | enUS}
└── Day.js locale(vi | en)

Backend (i18next)
├── Error responses include i18n key: { message: "errors.auth.invalid_credentials" }
└── Frontend resolves key to display language

Shared (packages/shared)
└── i18n keys as TypeScript constants
```

### Consequences
- ✅ Consistent translations across all layers
- ✅ Language switch without page reload
- ✅ Type-safe translation keys possible
- ⚠️ Extra effort to maintain 2 locale files in sync

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │                React SPA (Vite)                        │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │ Zustand  │ │ TanStack │ │ React   │ │ react-    │  │   │
│  │  │ (client  │ │ Query    │ │ Router  │ │ i18next   │  │   │
│  │  │  state)  │ │ (server  │ │ v7      │ │           │  │   │
│  │  │          │ │  state)  │ │         │ │           │  │   │
│  │  └─────────┘ └────┬─────┘ └─────────┘ └───────────┘  │   │
│  │                    │ Axios                             │   │
│  └────────────────────┼──────────────────────────────────┘   │
│                       │ HTTP/REST                             │
└───────────────────────┼─────────────────────────────────────┘
                        │
        ┌───────────────┼──────────────────────┐
        │               ▼                       │
        │  ┌─────────────────────────────────┐  │
        │  │     Express.js API Server        │  │
        │  │                                  │  │
        │  │  ┌──────────┐  ┌─────────────┐  │  │
        │  │  │Middleware │  │   Modules    │  │  │
        │  │  │• Auth JWT │  │ • auth       │  │  │
        │  │  │• CORS     │  │ • orders     │  │  │
        │  │  │• Helmet   │  │ • products   │  │  │
        │  │  │• Rate Lim │  │ • customers  │  │  │
        │  │  │• Validate │  │ • dashboard  │  │  │
        │  │  │• Error    │  │              │  │  │
        │  │  │• i18next  │  │  Controller  │  │  │
        │  │  └──────────┘  │  → Service   │  │  │
        │  │                │  → Model     │  │  │
        │  │                └──────┬───────┘  │  │
        │  │                       │           │  │
        │  │                 Mongoose ODM      │  │
        │  └───────────────────────┼──────────┘  │
        │                Server    │              │
        └──────────────────────────┼──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              ▼               │
                    │  ┌────────────────────────┐  │
                    │  │     MongoDB 7           │  │
                    │  │   (Replica Set)         │  │
                    │  │                         │  │
                    │  │  Collections:           │  │
                    │  │  • users                │  │
                    │  │  • orders               │  │
                    │  │  • products             │  │
                    │  │  • customers            │  │
                    │  │  • categories           │  │
                    │  │  • settings             │  │
                    │  └────────────────────────┘  │
                    │          Database             │
                    └──────────────────────────────┘
```

---

## Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────┐
│                   Docker Compose Environment                 │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   web (React)    │  │   api (Express)  │                  │
│  │                  │  │                  │                   │
│  │  Port: 3000      │──│  Port: 4000      │                  │
│  │                  │  │                  │                   │
│  │  Nginx (prod)    │  │  Node.js 22      │                  │
│  │  Vite (dev)      │  │                  │                  │
│  └─────────────────┘  └────────┬─────────┘                   │
│                                │                              │
│                         ┌──────▼──────┐                       │
│                         │   mongodb    │                      │
│                         │             │                       │
│                         │  Port: 27017│                       │
│                         │  Volume:    │                       │
│                         │  ./data/db  │                       │
│                         └─────────────┘                       │
│                                                              │
│  Volumes:                                                    │
│  - mongodb_data:/data/db                                     │
│  - uploads:/app/uploads                                      │
│                                                              │
│  Networks:                                                   │
│  - turboorder-network (bridge)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Threat Model (STRIDE Summary)

| Threat | Mitigation |
|--------|-----------|
| **Spoofing** | JWT authentication, bcrypt passwords |
| **Tampering** | Input validation (Zod), Mongoose sanitization |
| **Repudiation** | Winston structured logging, statusHistory audit |
| **Information Disclosure** | Helmet headers, CORS whitelist, env secrets |
| **Denial of Service** | Rate limiting (express-rate-limit) |
| **Elevation of Privilege** | Single role MVP; RBAC prepared for commercial |

### Auth Architecture
```
Login Request
  │
  ▼
Rate Limiter (5/min/IP)
  │
  ▼
Zod Validation (email, password)
  │
  ▼
bcrypt.compare(password, hash)
  │
  ├─ Fail → 401 (same message for email/password miss)
  │
  └─ Success → JWT Sign
       ├─ Access Token (15min) → Response body
       └─ Refresh Token (7d) → httpOnly, Secure, SameSite=Strict cookie
```

### API Security Middleware Stack
```
app.use(helmet())                    // Security headers
app.use(cors({ origin: WEB_URL }))   // CORS whitelist
app.use(rateLimit({ max: 100 }))     // Rate limit
app.use(express.json({ limit: '1mb' })) // Body size limit
app.use(authMiddleware)              // JWT verification
app.use(validateRequest(schema))     // Zod validation
```

---

## Engineering Principles Applied

| Principle | Application |
|-----------|-------------|
| **SOLID** | Feature modules with single responsibility; interfaces for services |
| **DRY** | Shared package for types/validators; reusable components |
| **KISS** | REST over GraphQL; Mongoose over raw MongoDB driver; Ant Design over custom UI |
| **SoC** | Controller → Service → Model; Frontend features isolated |
| **Statelessness** | JWT (no server sessions); Docker containers disposable |
| **Config** | Environment variables (.env); no hardcoded values |
| **Backing Services** | MongoDB as attached resource via connection string |
| **Logging & Tracing** | Winston structured JSON logs; request ID correlation |

---

⏭️ **NEXT ACTION:** Handoff to Phase 5 [Technical BA]
