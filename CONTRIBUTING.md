# Contributing

This document describes how the two-person development team collaborates on the
`school-management-saas` monorepo.

---

## 1. Team responsibilities

### Developer 1 — Backend

- Owns `backend/` (Laravel 12, PHP 8.3+, MySQL 8+, Redis, Sanctum).
- Owns the API contract: routes, request validation, resources, error responses.
- Owns `shared/api-contracts/` and `docs/api/`, `docs/database/`.
- Is the only developer who adds or edits database migrations.
- Reviews any frontend change that consumes or assumes a new API shape.

### Developer 2 — Frontend

- Owns `frontend/web/` (React + Vite) and `frontend/mobile/` (React Native + Expo).
- Owns `docs/development/` for client-side setup notes.
- Proposes API contract changes through the backend owner before implementing against them.

### Shared

- Both developers own `docs/architecture/`, `.github/`, root configuration and CI.
- Neither developer pushes directly to `main` or `develop`; all work arrives through a pull request.

---

## 2. Branching conventions

| Branch | Purpose | Branched from | Merged into |
| --- | --- | --- | --- |
| `main` | Stable, releasable code | — | — |
| `develop` | Integration branch for the next release | `main` | `main` (via release PR) |
| `feature/<scope>-<short-description>` | New functionality | `develop` | `develop` |
| `fix/<short-description>` | Bug fix | `develop` | `develop` |
| `hotfix/<short-description>` | Production fix | `main` | `main` and `develop` |
| `chore/<short-description>` | Tooling, dependencies, docs | `develop` | `develop` |

Rules:

- Branch names are lowercase and hyphen-separated.
- Scope should identify the area: `backend`, `web`, `mobile`, `docs`, `ci`.
  - Example: `feature/backend-subscription-plans`, `fix/web-api-error-handling`.
- Keep branches short-lived. Rebase on `develop` before opening a pull request.
- Never force-push a shared branch.

---

## 3. Commit conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Scope examples: `backend`, `web`, `mobile`, `api`, `db`, `docs`, `ci`, `repo`.

Examples:

```
feat(backend): add subscription plan model and migration
fix(web): propagate API validation errors to the form
docs(api): document pagination envelope
chore(repo): initialize school management SaaS monorepo
```

Rules:

- Summary in the imperative mood, lowercase, no trailing period, under 72 characters.
- One logical change per commit.
- Reference the related issue in the footer when one exists (`Refs: #12`).

---

## 4. Pull request rules

- Every change reaches `develop` (or `main` for hotfixes) through a pull request.
- Use `.github/pull_request_template.md`; complete every applicable section.
- Keep the pull request focused — one feature or fix.
- The CI workflow (`.github/workflows/ci.yml`) must pass.
- A pull request needs **at least one approval** from the other developer.
- The author resolves review conversations; reviewers re-approve after substantial changes.
- Squash-merge into `develop` unless the individual commits carry independent value.
- Delete the source branch after merge.

---

## 5. Code review requirements

Reviewers check, in order:

1. **Correctness** — does the change do what it claims?
2. **Tenant isolation** — every query on a school-owned table is scoped by `school_id`, and
   `school_id` is never taken from client input. See `docs/architecture/multi-tenancy.md`.
3. **API contract** — request/response shapes match `shared/api-contracts/` and
   `docs/api/api-conventions.md`.
4. **Security** — no secrets, no hardcoded credentials, validation at the boundary, server-side
   verification of any payment value.
5. **Database** — migrations are additive and reversible, no edits to already-merged migrations.
6. **Conventions** — framework conventions, naming, formatting (`.editorconfig`), no dead code.
7. **Tests** — meaningful coverage for the changed behaviour.

Reviewers must not approve code that leaves TODO placeholders or incomplete setup files.

---

## 6. API integration workflow

Laravel is the source of truth for the API. Frontend and mobile are consumers.

1. The backend developer updates `shared/api-contracts/` and `docs/api/api-conventions.md`
   if the contract changes.
2. The frontend developer codes against the documented contract, not against a guess.
3. Contract changes that break existing clients require:
   - a new API version under `/api/v2`, or
   - a backward-compatible additive change, plus a note in the pull request.
4. Errors, pagination, envelopes and status codes follow `docs/api/api-conventions.md` exactly so
   that web and mobile share one client behaviour.
5. Feature access is enforced server-side by entitlements. The clients may hide UI for a disabled
   feature, but that is cosmetic only — the backend remains the authority.

---

## 7. Secret management

- **Never commit** `.env`, `.env.local`, `.env.*` other than committed `*.example` templates.
- **Never commit** private keys, signing certificates, keystores, or generated secrets.
- Each developer creates local `.env` files from the committed `.env.example` templates.
- Credentials are shared out of band (password manager), never in the repository or in chat logs.
- Third-party keys (Razorpay, mail, storage) belong to the environment, not the codebase.
- If a secret is committed by accident, rotate it immediately and remove it from history before
  the branch is merged.
- Razorpay secret keys are server-side only and must never be exposed to web or mobile bundles.

---

## 8. Local verification before opening a pull request

```bash
# backend
cd backend && composer validate && php artisan test

# web
cd frontend/web && npm run build

# mobile
cd frontend/mobile && npx expo-doctor
```

Report the commands you ran in the pull request description.
