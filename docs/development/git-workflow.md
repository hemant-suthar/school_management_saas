# Git Workflow

Monorepo: `school-management-saas`. One repository, three applications, two developers.

---

## 1. Long-lived branches

| Branch | Role |
| --- | --- |
| `main` | Stable, releasable. Every commit here is deployable. |
| `develop` | Integration branch. The next release is assembled here. |

Rules:

- Direct pushes to `main` and `develop` are disabled. Everything arrives via pull request.
- `main` only ever receives merges from `develop` (release) or a `hotfix/*` branch.
- `develop` is kept releasable at all times.

---

## 2. Short-lived branches

```
feature/<scope>-<short-description>
fix/<short-description>
chore/<short-description>
hotfix/<short-description>
```

- Create from `develop` (except `hotfix/*`, created from `main`).
- Rebase onto `develop` before opening the pull request:

  ```bash
  git fetch origin
  git rebase origin/develop
  ```

- Never force-push a branch that another developer may have checked out.
- Delete the branch after merge.

---

## 3. Day-to-day loop

```bash
# 1. start from an up-to-date develop
git checkout develop
git pull --rebase origin develop
git checkout -b feature/backend-subscription-plans

# 2. work, stage only what belongs to this change
git add backend/app/Models/SubscriptionPlan.php backend/database/migrations/xxxx_create_subscription_plans_table.php

# 3. commit
git commit -m "feat(backend): add subscription plan model and migration"

# 4. keep up to date, then push
git fetch origin
git rebase origin/develop
git push -u origin feature/backend-subscription-plans

# 5. open a pull request into develop
```

---

## 4. Pull requests

- Target `develop` (or `main` for `hotfix/*`).
- Complete `.github/pull_request_template.md`.
- CI (`.github/workflows/ci.yml`) must be green.
- One approval from the other developer is required.
- Squash-merge, then delete the source branch.

---

## 5. Releases

1. Open a pull request `develop` → `main` titled `chore(release): vX.Y.Z`.
2. Confirm CI is green and the changelog is updated.
3. Merge, then tag:

   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. Back-merge `main` into `develop` so the release commit is shared, or cherry-pick the version
   bump. Never let `develop` diverge from `main` permanently.

---

## 6. Hotfixes

```bash
git checkout main
git pull origin main
git checkout -b hotfix/web-token-refresh-loop
# fix, commit, open PR into main
```

After the hotfix is merged into `main`, immediately merge `main` into `develop` (or cherry-pick
the fix) so the next release contains it.

---

## 7. Migrations and generated files

- Migrations are created **only** by the backend developer.
- Never edit a migration that has been merged. Add a new migration instead.
- Never commit `.env`, keys, keystores or build output — see `.gitignore` and
  `CONTRIBUTING.md` §7.
- Laravel, Vite and Expo keep their own nested `.gitignore` files; do not delete them.

---

## 8. Keeping the monorepo honest

- One logical change per commit; one feature per branch.
- Prefer rebase over merge for short-lived branches to keep history linear.
- Do not reformat unrelated files in a feature branch.
- Do not commit dependency lockfile churn that is unrelated to the change
  (`composer.lock` and `package-lock.json` **are** committed, but only when dependencies actually
  change).

---

## 9. Useful commands

```bash
git status
git branch -vv
git remote -v
git log --oneline --graph --decorate -n 20
git diff develop...HEAD
```

---

## 10. Remotes

- `origin` is the shared GitHub repository for the monorepo.
- The repository is **private**.
- The remote is configured only after the repository URL is confirmed by the team.
- Never force-push. If a push is rejected, rebase onto the remote branch and push again.
