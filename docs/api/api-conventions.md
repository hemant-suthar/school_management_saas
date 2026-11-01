# API Conventions

The Laravel backend at `backend/` is the single source of truth for the API consumed by both
`frontend/web` and `frontend/mobile`.

- Base path: `/api/v1`
- Content type: `application/json`
- Authentication: Laravel Sanctum (bearer tokens)

This document defines the conventions every endpoint must follow. It is a contract, not a
suggestion — web and mobile depend on identical shapes.

---

## 1. Versioning

- The version lives in the URL path: `/api/v1/...`.
- `v1` is additive-only. Fields may be added; existing fields are never renamed, retyped or
  removed within a version.
- Breaking changes require a new version prefix (`/api/v2`) served alongside `v1` until clients
  migrate.
- Unversioned API routes must not exist.

---

## 2. Response envelope

Every JSON response — success or failure — uses the same envelope.

### Success

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

- `data` is an object for a single resource, an array for a collection, or `null` when there is
  no payload (for example after a delete).

### Error

```json
{
  "success": false,
  "message": "Request failed",
  "errors": {}
}
```

- `errors` is an object keyed by field name for validation failures, and an empty object for
  non-field errors.

### Paginated collection

```json
{
  "success": true,
  "message": "Request successful",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "http://127.0.0.1:8000/api/v1/resource?page=1",
    "prev": null,
    "next": "http://127.0.0.1:8000/api/v1/resource?page=2",
    "last": "http://127.0.0.1:8000/api/v1/resource?page=8"
  }
}
```

`meta` and `links` are present only on paginated responses.

---

## 3. HTTP status codes

| Code | Meaning | When |
| --- | --- | --- |
| 200 | OK | Successful read or update |
| 201 | Created | Resource created |
| 204 | No Content | Successful delete with no body |
| 400 | Bad Request | Malformed request that is not a validation failure |
| 401 | Unauthorized | Missing, invalid or expired token |
| 403 | Forbidden | Authenticated but not permitted (role, entitlement or tenant) |
| 404 | Not Found | Resource does not exist **or** is outside the caller's tenant |
| 409 | Conflict | State conflict (duplicate unique value, stale version) |
| 422 | Unprocessable Content | Validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unhandled server failure |

Resource IDs that belong to another tenant return **404**, never 403, so that the existence of
another tenant's record is never disclosed.

---

## 4. Authentication

- All endpoints except `GET /api/v1/health`, `POST /api/v1/auth/login` and
  `POST /api/v1/auth/register` require a Sanctum bearer token.
- Header: `Authorization: Bearer <token>`
- Header: `Accept: application/json` is required so that failures render as JSON rather than HTML.
- Missing or invalid token → `401` with the standard error envelope.
- Roles and entitlements are evaluated after authentication, on the server, on every request.
- Multi-factor and session-lifetime policy are configured per deployment.

---

## 5. Requests

- Request bodies are JSON (`Content-Type: application/json`).
- Filtering, sorting and pagination use query parameters.
- Route parameters are always validated; `school_id` is never accepted from the client
  (see `docs/architecture/multi-tenancy.md`).

### Common query parameters

| Parameter | Example | Notes |
| --- | --- | --- |
| `page` | `?page=2` | 1-based |
| `per_page` | `?per_page=25` | Capped server-side (default 15, max 100) |
| `sort` | `?sort=-created_at` | Leading `-` for descending; whitelisted columns only |
| `filter[field]` | `?filter[status]=active` | Whitelisted fields only |
| `search` | `?search=meera` | Free-text, whitelisted columns only |

Unknown query parameters are ignored, never trusted.

---

## 6. Validation errors

Validation failures return `422`:

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

Clients render `errors` next to the corresponding fields and fall back to `message` for a toast.

---

## 7. Error handling for clients

- The centralized Axios client inspects `success` and the HTTP status.
- `401` → clear the stored token and route the user to sign-in.
- `403` → show a permission/entitlement message, do not retry.
- `422` → map `errors` onto the form.
- `429` → back off; the retry delay comes from `Retry-After`.
- `5xx` → show a generic failure message; safe idempotent `GET` requests may be retried with
  exponential backoff.
- Raw server error text is never surfaced to end users.

---

## 8. Pagination

- Server-driven, page-based, using Laravel's paginator.
- Envelope: `data`, `meta`, `links` as shown above.
- Default `per_page` is 15, maximum 100.
- Infinite-scroll clients read `meta.current_page` and `meta.last_page`.

---

## 9. Naming

- Resource paths are plural, lowercase, kebab-case: `/api/v1/subscription-plans`.
- JSON fields are `snake_case` to match the backend models.
- Dates are ISO-8601 with timezone (`2026-11-01T09:30:00+05:30`).
- Identifiers are the model's primary key unless a public identifier is introduced.
- Currency amounts are integers in the smallest unit (paise) plus an ISO-4217 `currency` field.

---

## 10. Tenant isolation

- Tenant context is resolved from the authenticated user, never from the request.
- Every query on a school-owned table is scoped by the tenant's `school_id`.
- Cross-tenant access exists only for Super Admin operations and is explicit and audited.
- Full rules: [multi-tenancy.md](../architecture/multi-tenancy.md).

---

## 11. Idempotency and money

- Mutating endpoints that create financial records accept an `Idempotency-Key` header; a repeated
  key returns the original result instead of creating a duplicate.
- Razorpay payments are verified against the gateway **on the backend**. A client-reported
  "success" is never sufficient to mark a payment as paid.
- Financial records are append-only with audit logging; corrections are new compensating records,
  not edits.

---

## 12. Health check

```
GET /api/v1/health
```

```json
{
  "success": true,
  "message": "Request successful",
  "data": { "status": "ok" }
}
```

Unauthenticated. Used by uptime checks and by both clients to verify connectivity.
