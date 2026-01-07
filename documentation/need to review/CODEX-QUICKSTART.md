# Codex Quickstart (Alleato-Procore)

This guide is the starting point for Codex agents. Follow it before any change.

## Non-Negotiables
- Read `CLAUDE.md` and `.agents/PLANS.md` first; obey execution gates (Playwright for UI, Supabase gate for DB).
- Run `npm run quality --prefix frontend` after every code change; fix all errors.
- Never use `@ts-ignore`, `any`, or `console.log`.
- Log any gate violations in `RULE-VIOLATION-LOG.md`.

## Environment & Context
- Workdir: repository root unless noted.
- Frontend env: create `frontend/.env.local` with Supabase keys and `OPENAI_API_KEY` if needed (see `documentation/development/QUICKSTART.mdx`).
- Supabase types: `npx supabase gen types typescript --project-id "lgveqfnpkxvzbnnwuled" --schema public > frontend/src/types/database.types.ts`.
- Seed/reset data: see `seed.config.ts` and scripts under `scripts/` (`seed:db`, `seed:db:reset`, `seed:project`, `seed:financial`).

## Core Commands (run from repo root)
- Quality gate: `npm run quality --prefix frontend`
- Typecheck only: `npm run typecheck --prefix frontend`
- Lint fix: `npm run lint:fix --prefix frontend`
- Playwright E2E: `npm run test --prefix frontend` (or targeted suites in `frontend/tests`)
- Backend tests: `npm run test:backend`
- Start dev: `npm run dev:frontend` and `npm run dev:backend` (or `npm run dev`)

## Playwright / UI Gate
- Any UI or rendering change requires Playwright evidence.
- Tests live in `frontend/tests/e2e/`; screenshots/videos in `frontend/tests/screenshots/`.
- If you add/modify UI, add or update Playwright tests and capture final-state screenshots.

## Supabase Gate
- Generate and read `frontend/src/types/database.types.ts` before DB work.
- Validate tables/columns from types; do not invent schema.

## Issue & PR Expectations
- Issues for Codex must include: target paths/files, acceptance criteria as observable behavior, required commands to run, seed/setup steps, and needed screenshots/tests.
- PRs must show: quality command output, Playwright evidence for UI, Supabase types confirmation for DB, and note any rule violations.

## Quick Navigation
- Frontend app: `frontend/src/app/`
- Components: `frontend/src/components/` (ui/layout/forms/domain/tables)
- Tests: `frontend/tests/` (e2e, visual-regression, screenshots)
- Backend: `backend/src/`
- Scripts: `scripts/` (seed, schema checks)
- Docs hub: `documentation/` (see `REPO-MAP.md`, `PLANS_DOC.md`, `development/` guides)
