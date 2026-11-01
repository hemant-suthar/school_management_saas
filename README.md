# School Management SaaS

Multi-tenant, cloud-based School Management Software delivered as a monorepo.

One Laravel REST API serves two independent clients:

| App | Path | Stack |
| --- | --- | --- |
| Backend API | `backend/` | Laravel 12, PHP 8.3+, MySQL 8+, Redis, Sanctum |
| Web client | `frontend/web/` | React, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Mobile client | `frontend/mobile/` | React Native, Expo, Expo Router, TanStack Query |
| API contracts | `shared/api-contracts/` | Documentation only (no runtime package) |
| Documentation | `docs/` | Architecture, API, database and development guides |

> Status: **initialization only**. The monorepo skeleton, tooling and documentation are in place.
> No business modules (auth flows, tenants, subscriptions, billing, academics) are implemented yet.

---

## Repository layout

```
school-management-saas/
├── backend/            Laravel 12 API (source of truth)
├── frontend/
│   ├── web/            React web client (Vite)
│   └── mobile/         React Native client (Expo)
├── shared/
│   └── api-contracts/  API conventions and JSON schemas
├── docs/               Architecture / API / database / development docs
└── .github/            CI workflows and pull request template
```

The three applications are independently runnable and independently deployable.

---

## Getting started (clone → running)

### 1. Clone the repository

```bash
git clone https://github.com/hemant-suthar/school_management_saas.git
cd school_management_saas
```

The repository has two long-lived branches: `main` (stable, releasable) and `develop`
(integration branch). Check out `develop` for feature work:

```bash
git checkout develop
```

### 2. Install prerequisites

| Tool | Version |
| --- | --- |
| PHP | 8.3+ (extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `fileinfo`, `zip`, `bcmath`) |
| Composer | 2.x |
| Node.js | LTS (20+ / 22+) |
| npm | 10+ |
| MySQL | 8.0+ (MariaDB 10.4+ also acceptable for local development) |
| Redis | Optional for local development |
| Git | 2.x |

Verify the toolchain:

```bash
git --version
php --version
composer --version
node --version
npm --version
```

### 3. Backend API (Laravel)

```bash
cd backend
composer install
cp .env.example .env          # Windows: Copy-Item .env.example .env
php artisan key:generate      # only needed if APP_KEY is empty
```

Create the database (it is **not** created automatically — see
[Database design](docs/database/database-design.md)):

```sql
CREATE DATABASE school_management_saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Point the database credentials in `backend/.env` at that database
(`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`), then run the migrations and
start the server:

```bash
php artisan migrate
php artisan serve             # http://127.0.0.1:8000
```

- API base path: `/api/v1`
- Health endpoint: `GET /api/v1/health`
- Verify routes: `php artisan route:list --path=api`

### 4. Web client

```bash
cd frontend/web
npm install
cp .env.example .env.local     # Windows: Copy-Item .env.example .env.local
npm run dev                    # http://localhost:5173
npm run build                  # production build
```

`VITE_API_BASE_URL` points at the Laravel API (default `http://127.0.0.1:8000/api/v1`).

### 5. Mobile client

```bash
cd frontend/mobile
npm install
cp .env.example .env           # Windows: Copy-Item .env.example .env
npx expo start                 # press a / i for a device or simulator
```

`EXPO_PUBLIC_API_BASE_URL` must use the **LAN IP of the machine running Laravel** (for example
`http://192.168.1.10:8000/api/v1`) when testing on a physical device — `localhost` resolves to the
device itself. Start Laravel with `php artisan serve --host=0.0.0.0` so it accepts LAN connections.

### 6. Verify the setup

| Check | Command / URL | Expected |
| --- | --- | --- |
| API up | `GET http://127.0.0.1:8000/api/v1/health` | `200` with a success envelope |
| Routes registered | `php artisan route:list --path=api` | `/api/v1/health` listed |
| Migrations applied | `php artisan migrate:status` | all migrations `Ran` |
| Web client | `http://localhost:5173` | home page renders |
| Mobile client | `npx expo start` | Metro bundler starts without errors |

---

## Documentation

- [System architecture](docs/architecture/system-architecture.md)
- [Multi-tenancy](docs/architecture/multi-tenancy.md)
- [API conventions](docs/api/api-conventions.md)
- [Database design](docs/database/database-design.md)
- [Git workflow](docs/development/git-workflow.md)
- [Contributing](CONTRIBUTING.md)

---

## Branching

- `main` — stable, releasable.
- `develop` — integration branch for the next release.
- `feature/*`, `fix/*`, `chore/*` — short-lived branches off `develop`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.
