# Shared API Contracts

Contracts shared by the two client applications (`frontend/web` and `frontend/mobile`).

**There is no runtime shared package here.** This folder contains documentation and JSON schema
artefacts only. Adding a runtime dependency between the two clients is not justified at this stage
and would couple their release cycles.

---

## 1. Source of truth

**Laravel is the source of truth.**

- The API is implemented in `backend/`.
- Request and response shapes are defined by the backend's Form Requests, API Resources and
  exception handling — not by either client.
- If this document and the backend disagree, the backend wins and this document is corrected.

---

## 2. One API, two clients

- React Web (`frontend/web`) and React Native (`frontend/mobile`) consume the **same** API.
- There is no web-only or mobile-only endpoint.
- Behaviour that differs between the platforms (storage, navigation, camera access) is a client
  concern and must not change the API contract.
- API base path: **`/api/v1`**

---

## 3. JSON response conventions

### Success

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Request failed",
  "errors": {}
}
```

### Paginated

Adds `meta` and `links` to the success envelope:

```json
{
  "success": true,
  "message": "Request successful",
  "data": [],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 120,
    "last_page": 8
  },
  "links": {
    "first": "…?page=1",
    "prev": null,
    "next": "…?page=2",
    "last": "…?page=8"
  }
}
```

Rules:

- JSON field names are `snake_case`.
- Dates are ISO-8601 with timezone.
- Money amounts are integers in the smallest unit (paise) with a `currency` field.
- `data` is `null` when there is no payload (for example, after a delete).

Machine-readable schemas live in [`schemas/`](schemas/).

---

## 4. Authentication requirements

- Scheme: Laravel Sanctum bearer tokens.
- Header: `Authorization: Bearer <token>`
- Header: `Accept: application/json` (required, so failures render as JSON).
- Public endpoints: `GET /api/v1/health`, `POST /api/v1/auth/login`,
  `POST /api/v1/auth/register`.
- Everything else requires a valid token.
- `401` means the token is missing, invalid or expired → the client clears local session state and
  routes to sign-in.
- Tokens are stored in platform-appropriate secure storage on each client. Neither client ever
  stores a gateway secret.

---

## 5. Error handling

| Status | Client behaviour |
| --- | --- |
| 401 | Clear token, route to sign-in |
| 403 | Show a permission/entitlement message; do not retry |
| 404 | Show "not found"; never assume the record exists in another tenant |
| 409 | Surface the conflict; refresh the resource |
| 422 | Map `errors` onto the form fields |
| 429 | Back off using `Retry-After` |
| 5xx | Generic failure message; retry only idempotent `GET` requests, with exponential backoff |

Both clients implement this identically so that user-visible behaviour does not drift.
Full status-code table: [docs/api/api-conventions.md](../../docs/api/api-conventions.md).

---

## 6. Pagination conventions

- Server-driven, page-based.
- Query parameters: `page`, `per_page` (default 15, max 100), `sort` (leading `-` for descending),
  `filter[field]`, `search`.
- Only whitelisted sort/filter/search fields are honoured.
- Infinite scroll reads `meta.current_page` and `meta.last_page`.

---

## 7. API versioning

- The version is part of the path: `/api/v1`.
- Within a version, changes are **additive only**.
- Breaking changes ship as `/api/v2` alongside `v1` until both clients migrate.
- Removing or renaming a field, or changing its type, is a breaking change.

---

## 8. Tenant isolation requirements

- **`school_id` is never sent by a client.** It is not a request field, query parameter or header.
- The backend derives the tenant from the authenticated user.
- A resource belonging to another school returns `404`, never `403`.
- Clients must not attempt to "select" a tenant other than through a dedicated, backend-approved
  flow available only to platform staff.
- Cross-tenant access exists only for Super Admins and is explicit and audited.

Details: [docs/architecture/multi-tenancy.md](../../docs/architecture/multi-tenancy.md).

---

## 9. Entitlements

- The backend enforces plan entitlements and returns `403` when a feature is not included.
- Clients may hide or disable UI for unavailable features, but this is cosmetic only.
- A client must never assume that a hidden feature is unreachable on the server.

---

## 10. Payments

- The client may initiate a payment and receive a gateway reference.
- **Verification happens on the backend only.** The backend confirms the signature, amount and
  currency before marking a payment successful.
- Clients must not compute entitlement or payment status locally.

---

## 11. Changing a contract

1. The backend developer updates the endpoint and this folder in the same pull request.
2. `docs/api/api-conventions.md` is updated when the convention itself changes.
3. Clients adopt the change in their own pull requests.
4. Breaking changes require a new API version and a migration note in the pull request.

---

## 12. Schemas

`schemas/` holds machine-readable JSON Schema files for the shared envelope and for resource
payloads as they are introduced. Naming: `<resource>.schema.json`, with the envelope defined once
in `envelope.schema.json` and referenced by the resource schemas.

These schemas are documentation and tooling aids. They do not replace backend validation.
