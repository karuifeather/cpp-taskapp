# Contributing to cpp-taskapp

This document covers **how we work together**. For installation, app features, scripts, and the repository layout, see [README.md](README.md).

## Workflow

1. **Sync `main`** before starting new work.
2. **Create a short-lived branch** for a focused change:
   - `feat/signup`
   - `fix/timer-state`
   - `docs/api-contract`
   - `chore/db-seed`
3. Make your changes and verify them locally.
4. Open a **pull request into `main`**. Briefly explain what changed, how you tested it, and include a screenshot for visible UI changes.
5. Ask at least **one teammate to review** before merging. Address review comments, then merge when checks pass.

Avoid pushing unfinished work directly to `main`. Keep pull requests small enough for another teammate to understand.

## Code and formatting standards

- **Prettier is the source of truth.** Use the root `.prettierrc.json`; don't add conflicting formatter rules inside `client/`, `server/`, or `db/`.
- The **Husky pre-commit hook** runs `lint-staged`, which formats supported staged files automatically. Leave the hook enabled; don't bypass it to land unformatted code.
- Before opening a PR, run:

  ```bash
  npm run format:check
  npm run build
  ```

- If a formatting check fails, run `npm run format`, inspect the changes, and commit them.
- Use descriptive names and keep functions/components focused. Reuse existing utilities before adding new packages.
- Follow the established code style: JavaScript/JSX with semicolons and single quotes, as enforced by Prettier.

## Local development and configuration

- `npm run dev` starts **only the Express API and Vite client**. It does **not** start PostgreSQL.
- Each contributor is responsible for starting their own PostgreSQL instance or configuring an accessible database via `DATABASE_URL`. Docker Compose is optional.
- Copy `.env.example` to `.env` for local configuration. **Never commit `.env`, credentials, or secrets.** Update `.env.example` when adding a required environment variable (with a safe placeholder).
- Keep the display name controlled by **`APP_NAME`**. Put shared frontend colors in **`client/src/styles/theme.css`**, using semantic Tailwind tokens rather than hard-coded colors in components.

## Coordinating changes

For backend routes, keep the API contract consistent with the README. Use appropriate HTTP status codes, validate incoming data, and never trust client-supplied user IDs, elapsed time, or awarded points. The backend owns timer timestamps and point calculations.

## Database changes

- Make schema changes through the files and scripts in `db/`; don't rely on manual edits to an individual developer's database.
- Update seeds and relevant documentation when the schema changes, and explain migration implications in the PR.
- `npm run db:reset` is **destructive**. Run it only against an explicitly disposable local database. Never enable `ALLOW_DB_RESET` in production.

## Pull request checklist

- [ ] Change is focused and described clearly.
- [ ] `npm run format:check` passes.
- [ ] `npm run build` passes.
- [ ] Relevant feature is tested manually (and automated tests pass, if added).
- [ ] Screenshots are attached for visible UI changes.
- [ ] Shared API, database, or environment changes are documented and communicated.
- [ ] No secrets, generated build output, or unrelated formatting changes are committed.

Commit messages can use conventional prefixes for clarity.
