# Repo Map (Alleato-Procore)

Use this to jump to the right files fast. Paths are repo-relative.

## Frontend (Next.js 15, App Router)
- Routes: `frontend/src/app/` (notable: `[projectId]/` project pages, `dashboard/`, `admin/`, `actions/`, `tables-directory/`, `auth/`, `api/` routes).
- Components: `frontend/src/components/`
  - Base/UI: `frontend/src/components/ui/`
  - Layout: `frontend/src/components/layout/`
  - Forms: `frontend/src/components/forms/`
  - Tables: `frontend/src/components/tables/` (`README-EDITING.md` for inline edit system)
  - Domain modules (budget, chat, etc.): `frontend/src/components/domain/` and module-specific folders.
- State/Utilities: `frontend/src/lib/` (Supabase client/config under `lib/supabase/`, stores under `lib/stores/`), `frontend/src/hooks/`.
- Types: `frontend/src/types/` (Supabase types in `database.types.ts` regenerated via `npx supabase gen types ...`).
- Styles: `frontend/src/app/globals.css`.

## Frontend Tests & Evidence
- Playwright E2E: `frontend/tests/e2e/`
- Visual regression: `frontend/tests/visual-regression/`
- Screenshots: `frontend/tests/screenshots/`
- Config: `frontend/config/playwright/`
- Unit/component: `frontend/tests` (Jest setup in `frontend/package.json`)

## Backend (Python / RAG)
- Code: `backend/src/` (`api/`, `services/`, `workers/`, `alleato_agent_workflow/` for RAG/agents)
- Entrypoints/scripts: `backend/start.sh`, `backend/deploy.sh`, `backend/Dockerfile`
- Tests: `backend/tests/`, `backend/test_embedding_api.py`
- Config: `backend/nginx.conf`, `backend/docker-compose.yml`

## Database / Supabase
- Migrations/metadata: `supabase/`
- Seeds/config: `seed.config.ts`, `scripts/seed-*.ts`, `scripts/check-*` schema helpers
- Types regeneration: `frontend/src/types/database.types.ts` (command in `CLAUDE.md` and `CODEX-QUICKSTART.md`)

## Automation & Scripts
- Root scripts: `scripts/` (schema checks, seed helpers, deployment env updaters, docs watcher)
- Playwright helpers: `scripts/capture-form-screenshots.js`, etc.
- Monorepo scripts: see root `package.json` (`dev`, `build`, `test`, `seed:*`).

## Documentation
- Rules: `CLAUDE.md`, `.agents/PLANS.md`
- Plans: `documentation/PLANS_DOC.md`, `documentation/EXEC_PLAN.md`
- Onboarding: `documentation/development/QUICKSTART.mdx`, `DEVELOPER_MANUAL.mdx`, `TEAM_ONBOARDING.mdx`
- Verification/feature docs: various `documentation/*` reports (budget, modal, subcontract, etc.)

## Key Commands (root)
- Quality gate: `npm run quality --prefix frontend`
- Playwright: `npm run test --prefix frontend` (target suites in `frontend/tests`)
- Typecheck: `npm run typecheck --prefix frontend`
- Lint fix: `npm run lint:fix --prefix frontend`
- Dev servers: `npm run dev:frontend`, `npm run dev:backend`, or `npm run dev`
- Backend tests: `npm run test:backend`

Use this map alongside `CODEX-QUICKSTART.md` and `CLAUDE.md` to satisfy gates before coding.
