# Database Design

**Engine:** MySQL 8+ (MariaDB 10.4+ is acceptable for local development).
**Database:** single shared database — `school_management_saas`.
**Isolation:** shared tables with `school_id` on every school-owned row.

> Status: design specification. No business migrations exist yet — the initialization phase
> deliberately creates none.

---

## 1. Principles

1. Every school-owned table has `school_id`, indexed, foreign key to `schools.id`.
2. Platform reference tables have no `school_id`.
3. Foreign keys between tenant-owned tables never cross a `school_id`.
4. Financial tables are append-only: corrections are new rows, never edits or deletes.
5. Migrations are additive and reversible; already-merged migrations are never edited.
6. Money is stored as integers in the smallest unit (paise) plus a currency code — never floats.
7. Timestamps are stored in UTC.

---

## 2. Conventions

| Aspect | Convention |
| --- | --- |
| Table names | `snake_case`, plural (`schools`, `students`, `fee_invoices`) |
| Primary key | `id` — unsigned big integer, auto-increment |
| Tenant key | `school_id` — unsigned big integer, indexed, FK to `schools.id` |
| Foreign keys | `<singular>_id` (`student_id`, `school_id`) |
| Timestamps | `created_at`, `updated_at` (UTC) |
| Soft delete | `deleted_at` where historical retention is required |
| Booleans | `is_*` / `has_*` (`is_active`) |
| Enumerations | Small, stable sets as string columns backed by PHP enums |
| Money | `*_amount` integer (paise) + `currency` char(3), ISO-4217 |
| Audit | `created_by`, `updated_by` where relevant |

---

## 3. Table groups (target)

### 3.1 Platform (no `school_id`)

| Table | Purpose |
| --- | --- |
| `users` | Authentication identities (platform + school users) |
| `roles`, `permissions`, `role_permissions` | Role-based access control catalogues |
| `subscription_plans` | Plan catalogue |
| `plan_entitlements` | Which features/limits a plan includes |
| `features` | Feature/module definitions used by entitlements |
| `countries`, `currencies` | Reference data |
| `payment_gateway_settings` | Gateway configuration (keys stored outside the DB) |

### 3.2 Tenant core (`school_id`)

| Table | Purpose |
| --- | --- |
| `schools` | The tenant itself (the root of the tenant tree) |
| `school_users` | Membership of a user in a school, with the school-scoped role |
| `academic_years` | Academic session boundaries |
| `school_settings` | Per-school configuration |

### 3.3 People (`school_id`)

`students`, `guardians`, `student_guardians`, `staff`, `classes`, `sections`,
`class_sections`, `subjects`, `student_enrollments`, `staff_assignments`.

### 3.4 Operations (`school_id`)

`attendance_records`, `timetables`, `exams`, `exam_results`, `assignments`,
`fee_heads`, `fee_structures`, `fee_invoices`, `fee_invoice_items`, `fee_payments`,
`fee_waivers`, `notices`, `messages`.

### 3.5 Billing & entitlement

| Table | Tenant-scoped | Purpose |
| --- | --- | --- |
| `subscriptions` | yes | A school's active subscription, period and plan |
| `subscription_invoices` | yes | Recurring billing documents |
| `software_purchases` | yes | One-time software purchase records |
| `installment_plans` | yes | Installment schedule definition for a purchase |
| `installments` | yes | Individual scheduled installments |
| `payments` | yes | Every payment against an invoice or installment |
| `entitlement_usage` | yes | Metered consumption against plan limits |

### 3.6 Audit (append-only)

`audit_logs`, `payment_events`, `activity_logs`.

---

## 4. Tenant isolation in the schema

- `school_id` is indexed on every tenant-owned table, and it is the leading column of composite
  indexes that are used for tenant-scoped queries.
- Composite unique constraints include `school_id`:

  ```
  UNIQUE (school_id, admission_number)
  UNIQUE (school_id, employee_code)
  UNIQUE (school_id, academic_year_id, name)   -- classes within a year
  ```

- Foreign keys from a tenant-owned table to another tenant-owned table are always paired with the
  same `school_id`, enforced by the application layer and verified by tests.

---

## 5. Subscription and one-time purchase are separate

Two independent billing tracks, sharing only the `payments` ledger:

```
subscription_plans ──▶ subscriptions ──▶ subscription_invoices ──▶ payments
                     (monthly/quarterly/half-yearly/yearly)

software_purchases ──▶ installment_plans ──▶ installments ──▶ payments
                     (one-time, optionally in installments)
```

- Changing a subscription plan never alters installment schedules.
- An installment schedule never changes subscription renewals.
- Entitlements are derived from whichever track is currently active for the school.

---

## 6. Money and immutability

- `fee_invoices`, `subscription_invoices`, `payments`, `installments` and credit/refund documents
  are append-only.
- A correction is a new row (credit note, adjustment payment) referencing the original.
- Every financial write records actor, tenant, entity, before/after values and timestamp in
  `audit_logs`.
- Balance and outstanding amounts are derived from the ledger, not stored as editable fields.
- Razorpay identifiers (`order_id`, `payment_id`, signature verification result) are stored on the
  payment record; the gateway is the source of truth for status.

---

## 7. Indexing and performance

- Index every foreign key.
- Index `school_id` first in composite indexes used by tenant-scoped list screens.
- Index `(school_id, created_at)` for chronological lists and `(school_id, status)` for work queues.
- Avoid unbounded queries: all list endpoints paginate (default 15, max 100).
- Soft-deleted rows are excluded by default; archive tables are considered only if volume demands it.

---

## 8. Local environment setup

The database is **not** created by the initialization step. To prepare a local database:

```sql
CREATE DATABASE school_management_saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

`backend/.env` must then contain:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_management_saas
DB_USERNAME=root
DB_PASSWORD=
```

These are example values only. Never point a local environment at production, and never commit a
real `.env`. Migrations are run with `php artisan migrate` — but there are no business migrations
yet, only Laravel's default ones.

---

## 9. Migration policy

- The backend developer is the only person who creates migrations.
- One logical change per migration; the file name describes the change.
- Always implement a working `down()`.
- Never edit a migration that has been merged to `develop` or `main` — add a new one.
- Destructive migrations (dropping a column or table) require explicit review and a documented
  data-retention justification.

---

## 10. What is deliberately not built yet

None of the tables above are created in the initialization phase. The only migrations present are
the ones Laravel ships with by default (`users`, `cache`, `jobs`). Business schema work begins in
the next phase, in this order: tenant core → RBAC → subscriptions and entitlements → billing →
academics → operations.
