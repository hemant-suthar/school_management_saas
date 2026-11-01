## Summary

<!-- One or two sentences describing what this PR does and why. -->

## Area

- [ ] Backend (`backend/`) — Laravel 12 API
- [ ] Web (`frontend/web/`) — React
- [ ] Mobile (`frontend/mobile/`) — React Native / Expo
- [ ] Shared contracts (`shared/api-contracts/`)
- [ ] Documentation (`docs/`)
- [ ] Tooling / CI / configuration

## Changes

<!-- Bullet list of the concrete changes. -->

-

## API impact

<!-- Required when the API contract changes. -->

- Endpoints added / changed / removed:
- Request payload changes:
- Response payload changes:
- Backward compatible: yes / no

## Tenant isolation checklist

<!-- Required for any backend change that touches tenant-owned data. -->

- [ ] Every query on a school-owned table is scoped by `school_id`.
- [ ] `school_id` is derived from the authenticated user, never trusted from the request body or query string.
- [ ] Any deliberate cross-tenant (Super Admin) access is explicit and documented.

## Security checklist

- [ ] No secrets, `.env` files, keys or credentials are included in this PR.
- [ ] No hardcoded credentials, tokens or API keys.
- [ ] Input is validated at the boundary (Form Requests / Zod schemas).
- [ ] Payment-related values (if any) are verified server-side.

## Testing

<!-- Describe how the change was verified. Paste commands and relevant output. -->

- Backend: `php artisan test`
- Web: `npm run build`
- Mobile: `npx expo-doctor`

## Migration notes

<!-- Required if database migrations are included. -->

- New migrations:
- Rollback verified: yes / no / n-a
- Destructive change: yes / no

## Reviewer notes

<!-- Anything the reviewer should pay particular attention to. -->
