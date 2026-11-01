# Multi-Tenancy

A tenant is a **school**. All tenants share one MySQL database and the same tables.

---

## 1. Model

- **Shared database, shared tables.**
- Every school-owned table carries `school_id`.
- Global, platform-owned reference tables (subscription plan catalogue, entitlement definitions,
  countries, currencies, gateway configuration) carry **no** `school_id`.
- The isolation boundary is enforced in the application layer, in one place, not scattered across
  controllers.

---

## 2. The five rules

### Rule 1 — Every school-owned record has a `school_id`

No exceptions. A table that stores data belonging to a school without a `school_id` column is a
defect, because it cannot be scoped and cannot be audited.

Platform-owned reference tables are the only exempt category, and they must be reviewed
deliberately before being added.

### Rule 2 — Never trust `school_id` from the client

`school_id` is not accepted from:

- request bodies,
- query strings,
- route parameters,
- headers.

A client-supplied `school_id` is ignored. If an endpoint appears to need one, the endpoint is
misdesigned and should be reworked to derive the tenant from the caller.

### Rule 3 — The backend derives tenant context from the authenticated user

The request pipeline is:

```
Request
  → Sanctum authenticates the bearer token
  → resolve the authenticated user
  → resolve the user's school_id and role  ← the ONLY source of tenant context
  → tenant context is bound for the duration of the request
  → every tenant-scoped query applies that school_id automatically
```

Because the context is derived from the authenticated user, a caller cannot influence which
tenant's data they see.

### Rule 4 — Super Admin cross-tenant access is explicit and audited

Platform Super Admins may operate across tenants, but only through:

- endpoints explicitly designated as platform-level, or
- an explicit, deliberate tenant switch.

Every cross-tenant action records: actor user id, target `school_id`, the operation, the entity
and a timestamp. There is no implicit "no tenant filter" fallback.

### Rule 5 — No school can ever reach another school's data

Any request that names an identifier belonging to a different tenant returns **404 Not Found**,
not **403 Forbidden**. Returning 403 would confirm that the record exists in another tenant.

---

## 3. Enforcement strategy

| Layer | Responsibility |
| --- | --- |
| Authentication | Establishes *who* the caller is. |
| Tenant context resolution | Establishes *which school* the caller belongs to. |
| Global query scope | Automatically applies `school_id` to every model read. |
| Write path | Automatically stamps `school_id` on every create; never reads it from input. |
| Policies | Decide whether the caller's role may perform the action at all. |
| Entitlements | Decide whether the school's plan includes the feature. |
| Audit log | Records administrative and financial actions, including cross-tenant ones. |

Isolation is centralised so that a single, reviewed mechanism protects every endpoint rather than
each controller remembering to filter. Adding a new tenant-owned model must automatically inherit
the scope.

---

## 4. Relationships inside a tenant

- Foreign keys between two tenant-owned tables are always *within* the same `school_id`.
- A relationship that would link rows across different tenants is invalid data, not a valid case.
- Composite uniqueness is per tenant, for example a roll number, admission number, class name or
  employee code is unique **within a school**, not globally.
- Cascading behaviour (delete or archive) never crosses the tenant boundary.

---

## 5. Entitlements versus isolation

These are different questions and must not be conflated:

| Question | Answered by |
| --- | --- |
| Is this record in my school? | Tenant isolation (`school_id`) |
| May my role perform this action? | Policies / roles |
| Does my plan include this feature? | Entitlements |

A school can be fully isolated and still be denied a feature because its plan does not include it.
Conversely, a plan that includes every feature never grants access to another school's data.

---

## 6. Audit and compliance

Audit entries are required for at least:

- every cross-tenant (Super Admin) operation,
- every financial mutation (payment, invoice, refund, installment schedule change),
- changes to subscription plan assignment or entitlements,
- user, role and permission changes.

An audit entry is immutable and captures actor, tenant, entity, operation, before/after values and
timestamp.

---

## 7. Backups and data residency

- Backups are whole-database; restores are whole-database.
- Restoring a backup restores every tenant — there is no per-tenant restore in the shared model.
- A per-tenant export must be produced through the application, honouring isolation rules.
- Data residency requirements for Indian schools are satisfied by hosting the database in an
  appropriate region; this is a deployment decision, not an application one.

---

## 8. Tenant lifecycle

| Event | Effect |
| --- | --- |
| Onboarding | A new `school_id` is created; no data is copied from other tenants. |
| Suspension | The tenant's access is blocked at the entitlement/billing layer; data is retained. |
| Offboarding | The tenant is archived. Data is retained according to the retention policy and applicable law. |
| Hard delete | Not performed through the application. |

---

## 9. What is deliberately not built yet

Tenant middleware, the tenant context resolver, the global query scope, tenant-aware policies and
the audit log are **not** implemented in the initialization phase. This document is the specification
they will be built against.
