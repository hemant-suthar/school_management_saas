# System Architecture

**Project:** School Management SaaS — multi-tenant, cloud-based school management software.
**Model:** MVP first, enterprise-ready architecture.
**Status of this document:** architecture record for the initialization phase. No business module
is implemented yet.

---

## 1. High-level shape

```
                    ┌───────────────────────────────┐
                    │        React Web (SPA)        │
                    │  Vite · Tailwind · shadcn/ui  │
                    └───────────────┬───────────────┘
                                    │
                                    │  HTTPS · JSON
                                    │  /api/v1
                    ┌───────────────▼───────────────┐
                    │      Laravel 12 REST API      │
                    │  Sanctum · Policies · Queues  │
                    │      (source of truth)        │
                    └───────┬───────────────┬───────┘
                            │               │
        ┌───────────────────▼──┐        ┌───▼─────────────────┐
        │  MySQL 8+ (shared)   │        │  Redis (cache/queue)│
        │  shared DB, shared   │        │  optional at start  │
        │  tables, school_id   │        └─────────────────────┘
        └──────────────────────┘
                            ▲
                            │  HTTPS · JSON · /api/v1
                    ┌───────┴───────────────────────┐
                    │   React Native (Expo) Mobile  │
                    │   Expo Router · TanStack Query│
                    └───────────────────────────────┘
```

---

## 2. Applications

| Application | Path | Responsibility |
| --- | --- | --- |
| API | `backend/` | Owns all business rules, data, authorization, entitlements, payments. |
| Web | `frontend/web/` | Staff and administrator experience in the browser. |
| Mobile | `frontend/mobile/` | Parent / teacher / student experience on phones. |
| Contracts | `shared/api-contracts/` | Documentation and JSON schemas for the API. No runtime code. |

Each application is independently runnable, independently deployable, and has its own
`.env.example`. Nothing is shared at runtime between web and mobile except the documented API
contract.

---

## 3. Architecture decisions

### 3.1 Shared database, shared tables

All tenants live in one MySQL database using shared tables. Each tenant-owned table carries a
`school_id` foreign key. This keeps operations, migrations and reporting simple for an MVP while
retaining a clean isolation boundary that can later be moved to schema-per-tenant or
database-per-tenant without changing application code, because the tenant scoping is centralised.

### 3.2 Every school-owned record is isolated by `school_id`

No school-owned row exists without an owning `school_id`. Global reference data (subscription plan
catalogue, entitlement definitions, countries, currencies) is the deliberate exception and is
owned by the platform, not by a school.

### 3.3 Never trust `school_id` from the request

`school_id` is **never** accepted from a request body, query string or client header. Accepting it
would let a caller read or write another school's data. See
[multi-tenancy.md](multi-tenancy.md).

### 3.4 Tenant context comes from the authenticated user

After Sanctum authenticates the request, the backend resolves the caller's tenant (and role) from
the authenticated user record. That resolved context is the only source of `school_id` for the
request, and it is applied automatically to every tenant-scoped query.

### 3.5 Super Admin has controlled cross-tenant access

Platform Super Admins operate across tenants for support and administration. Their cross-tenant
access is:

- explicit (a deliberate scope switch or an explicitly scoped endpoint, never a silent default),
- restricted to a defined set of administrative operations,
- audit-logged (who, what, which tenant, when).

Regular school users can never cross the tenant boundary, regardless of their role within the school.

### 3.6 One API for web and mobile

React Web and React Native consume the identical Laravel REST API under `/api/v1`. There is no
web-only or mobile-only backend. Response shapes, error codes and pagination are defined once in
[docs/api/api-conventions.md](../api/api-conventions.md) and in `shared/api-contracts/`.

### 3.7 Subscriptions and one-time purchases are independent

The platform supports two commercially distinct models:

1. **Recurring subscriptions** — monthly, quarterly, half-yearly, yearly.
2. **One-time software purchase**, optionally paid in installments.

They are modelled as independent concerns. A school's billing history may contain either or both,
and a change to subscription plan configuration must not affect installment schedules (or vice
versa). Both feed the same entitlement layer but neither is derived from the other.

### 3.8 Razorpay verification happens on the backend

The client may initiate a payment, but the backend:

- creates the order,
- verifies the gateway signature,
- confirms the captured amount and currency,
- and is the only component allowed to mark a payment as successful.

A client-side "payment succeeded" is treated as a hint, never as truth.

### 3.9 Financial records are immutable and audited

Payments, invoices, credit notes, refunds and installment schedules are append-only. Corrections
are new compensating records, never in-place edits or deletes. Every financial mutation writes an
audit entry capturing actor, tenant, entity, before/after values and timestamp.

### 3.10 Feature access is enforced by backend entitlements

Each subscription plan maps to a set of entitlements (enabled modules, quotas, limits). The backend
resolves the tenant's entitlements per request and enforces them. The clients may hide or disable
UI for an unavailable feature, but that is cosmetic: the server is the authority and returns `403`
when an entitlement is missing.

---

## 4. Business model served by the architecture

| Model | Billing rhythm |
| --- | --- |
| Subscription | Monthly, quarterly, half-yearly, yearly |
| One-time purchase | Single payment |
| Installment purchase | One-time purchase split into scheduled installments |

Payment gateway: **Razorpay (India)**.

Subscription plans and their feature entitlements are configuration, not code — an operator can
change what a plan includes without a release.

---

## 5. Cross-cutting concerns

| Concern | Approach |
| --- | --- |
| Authentication | Laravel Sanctum bearer tokens |
| Authorization | Policies + role checks + entitlement checks, all server-side |
| Tenant isolation | Centralised scoping from the authenticated user context |
| Validation | Form Requests for the API (backend), Zod schemas (clients) |
| Error shape | Single JSON envelope, defined in `docs/api/api-conventions.md` |
| Background work | Laravel queues (Redis driver in production) |
| Audit | Dedicated audit log for financial and administrative events |
| Observability | Structured logs, per-request correlation id |
| Time zone | Store UTC, render in the school's time zone |

---

## 6. Deployment topology (target)

- **API + workers** — PHP 8.3+ application server with a queue worker and scheduler.
- **Database** — managed MySQL 8+ with point-in-time recovery.
- **Cache/queue** — managed Redis.
- **Web** — static build of `frontend/web` served from a CDN.
- **Mobile** — Expo build distributed through the app stores / EAS.

Environments: local → staging → production. Each environment has its own credentials; none are
committed.

---

## 7. What is deliberately not built yet

Initialization delivers structure, tooling and documentation only. The following are explicitly
deferred: authentication flows, tenant middleware, subscription and billing modules, entitlement
resolution, Razorpay integration, and every academic, administrative and reporting module.
