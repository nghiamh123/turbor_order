# Non-Functional Requirements — TurboOrder MVP

> **[BA]** Phase 2 | Business Analyst  
> **Epic:** `turbo-order-mvp`  
> **Created:** 2026-04-29

---

## NFR-001: Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **SPA Initial Load** | < 1.5s (first paint) | Lighthouse Performance Score ≥ 90 |
| **SPA Subsequent Navigation** | < 200ms | Client-side routing (no server round-trip) |
| **API Response (p95)** | < 500ms | Winston logging + monitoring |
| **API Response (p50)** | < 200ms | Winston logging |
| **MongoDB Query** | < 100ms | Mongoose debug logging |
| **Search (debounced)** | < 500ms total | From keystop to results rendered |
| **Dashboard Load** | < 2s | Aggregation pipeline response |
| **Image Upload** | < 3s (5MB file) | Multer + compression time |

### Implementation Strategy
- Vite code splitting (lazy routes)
- TanStack Query caching (staleTime: 5min)
- MongoDB indexes on frequently queried fields
- Gzip/Brotli compression (Express middleware)
- Image resize + WebP conversion on upload

---

## NFR-002: Scalability

| Aspect | MVP (P0) | Commercial Phase |
|--------|----------|-----------------|
| **Users** | 1 (single tenant) | Multi-tenant, thousands |
| **Data Volume** | < 10K orders | > 1M orders |
| **Concurrency** | 1 user | 50+ concurrent |
| **Architecture** | Monorepo monolith | Microservices ready |

### Implementation Strategy
- pnpm monorepo: `apps/web` + `apps/api` + `packages/shared`
- Feature-based module structure → easy to extract into services
- MongoDB: Schema design supports horizontal scaling (sharding)
- Stateless API (JWT) → easy horizontal scaling

---

## NFR-003: Security

| Requirement | Implementation |
|-------------|---------------|
| **Authentication** | JWT (access 15min + refresh 7d, httpOnly cookie) |
| **Password Storage** | bcryptjs (salt rounds: 12) |
| **API Security** | Helmet (security headers), CORS (whitelist origin) |
| **Input Validation** | Zod schemas (shared FE/BE) |
| **Rate Limiting** | express-rate-limit (login: 5/min, API: 100/min) |
| **XSS Prevention** | React auto-escaping + Helmet CSP |
| **CSRF Protection** | SameSite cookie + Origin check |
| **Injection Prevention** | Mongoose sanitization, no raw queries |
| **File Upload** | Type check, size limit (5MB), rename files |
| **Secrets** | Environment variables (.env), never committed |

---

## NFR-004: Availability

| Requirement | Target |
|-------------|--------|
| **Uptime** | 99.5% (local Docker — dependent on host machine) |
| **Health Check** | GET /api/v1/health → 200 + DB status |
| **Graceful Shutdown** | SIGTERM → close DB connections → exit |
| **Data Backup** | MongoDB dump (manual for MVP, automated for commercial) |
| **Recovery** | Docker Compose restart policy: `unless-stopped` |

---

## NFR-005: Usability

| Requirement | Implementation |
|-------------|---------------|
| **Internationalization** | i18n from MVP: Vietnamese (default) + English |
| **Responsive** | Desktop-first, tablet-friendly (≥768px) |
| **Accessibility** | WCAG 2.1 AA (Ant Design built-in a11y) |
| **Loading States** | Skeleton loading for tables, spinner for actions |
| **Error Feedback** | Toast notifications (success/error/warning) |
| **Empty States** | Illustrated empty states with CTA |
| **Keyboard Navigation** | Tab order, Enter to submit, Escape to close modal |
| **Theme** | Dark mode ready (Ant Design theme tokens) |

### i18n Strategy
```
Frontend:
  - react-i18next
  - Locale files: src/i18n/locales/{vi,en}.json
  - Ant Design locale: vi_VN, en_US
  - Day.js locale: vi, en
  - Language switcher in Settings/Header
  
Backend:
  - i18next
  - Error messages return i18n keys
  - Frontend resolves to display language
```

---

## NFR-006: Maintainability

| Requirement | Standard |
|-------------|----------|
| **Language** | TypeScript strict mode (both FE/BE) |
| **Code Quality** | ESLint (recommended) + Prettier |
| **Testing** | Vitest, 100% unit test coverage (target) |
| **API Documentation** | OpenAPI 3.x (swagger-jsdoc) |
| **Git** | Conventional commits, feature branches |
| **Shared Code** | packages/shared for types, constants, validators |

---

## NFR-007: Data Integrity

| Requirement | Implementation |
|-------------|---------------|
| **Validation** | Zod (FE + BE) + Mongoose schema validation |
| **Atomic Operations** | MongoDB transactions for order creation (stock deduction) |
| **Denormalization** | Customer name/phone in Order (snapshot at order time) |
| **Audit Trail** | statusHistory array in Order document |
| **Soft Delete** | isActive flag (products, customers) |
| **Unique Constraints** | MongoDB unique indexes (email, phone, orderNumber, SKU) |

---

## NFR-008: Observability

| Requirement | Implementation |
|-------------|---------------|
| **Logging** | Winston (JSON format, levels: error/warn/info/debug) |
| **Request Logging** | Morgan middleware (request method, URL, status, duration) |
| **Error Tracking** | Structured error logging with stack traces |
| **Monitoring** | Health check endpoint + Docker health check |

---

## Summary Matrix

| NFR | P0 MVP | Commercial |
|-----|--------|------------|
| Performance | ✅ Basic optimization | Advanced caching, CDN |
| Scalability | ✅ Single user | Multi-tenant, sharding |
| Security | ✅ JWT + validation | OAuth2, RBAC, audit logs |
| Availability | ✅ Docker restart | K8s, auto-scaling, redundancy |
| Usability | ✅ i18n (vi/en) | More languages, mobile app |
| Maintainability | ✅ TypeScript, tests | Automated CI/CD, coverage gates |
| Data Integrity | ✅ Mongoose validation | Event sourcing, CQRS |
| Observability | ✅ Winston logging | ELK stack, Prometheus + Grafana |
