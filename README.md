# Alleato-Procore

Alleato-Procore is the internal repo that powers the Alleato Project Manager add-on for Procore. It combines a Next.js frontend, a Python backend, Supabase schema management, and a large library of automated crawls, documentation, and tooling that mirrors Procore features so new contributors stay aligned with the live system.

## Quick start

### Prerequisites
- Node 18+ (LTS)
- npm (or pnpm) for JavaScript tooling
- Access to the Supabase workspace documented in `frontend/.env.example`
- OpenAI API key for the AI-enhanced features

### One-time setup
```bash
git clone <repo-url>
cd alleato-procore
npm install
cd frontend && npm install
cp frontend/.env.example frontend/.env.local
```
Fill in the Supabase keys, OpenAI key, and any local overrides described in `frontend/.env`, `frontend/.env.local`, and `backend/.env.template`.

### Running locally
- Frontend: `npm run dev:frontend` or `npm run dev`
- Backend: `npm run dev:backend`
- Combined dev (frontend + backend): `npm run dev`
- Schema docs: `npm run schema:docs`
- Seed data: `npm run seed:db`

## Repository tour

- `frontend/` – Next.js 15 App Router application with component-level domains (`components/budget`, `components/scheduling`, `components/ui`, etc.), Playwright tests, and app routes.
- `backend/` – Python services, FastAPI endpoints, and pytest suites.
- `supabase/` – Postgres migrations, RLS policies, and schema helpers.
- `scripts/` – Automation scripts (Playwright crawls, seeders, schema extractors, quality gates, etc.).
- `PRPs/` – Crawl output, research notes, and PRP plans organized by finance, PM, or core tools.
- `docs/` – Written guidance; start with `docs/development/DEVELOPER_MANUAL.mdx` and `docs/index/PROCORE-TUTORIALS.md`.
- `.claude/` & `.agents/` – Internal Claude/agent tooling that enforces gates, scaffolds, and workflows; do not delete.
- `playwright/`, `e2e/`, `tests/` – Test suites and runners for visual regression, unit, and end-to-end validation.
- `screenshot-capture/`, `scripts/screenshot-capture/` – Legacy crawls and DOM/screenshot artifacts used for documentation and regression artifacts.
- `tools/` – Smaller helpers such as feature tracker imports.

## Key docs & workflow references
- `.claude/WORKFLOW.md` – Mandatory workflow phases (crawl → ETL → spec → testing → PRP) and gating instructions.
- `docs/development/DEVELOPER_MANUAL.mdx` – Architecture overview, directory structure, and developer handbook.
- `docs/index/PROCORE-TUTORIALS.md` – Tutorial reference for key Procore workflows.
- `PRPs/<category>/<feature>` – Each Procore feature has a crawl folder (`crawl-<feature>`) with DOM, metadata, screenshots, and engineering decisions.
- `scripts/playwright-crawl` – ETL for ingesting crawls and generating specs.
- `supabase/migrations` – All SQL migration history; run `npm run schema:docs` after editing.

## Collaboration pointers

1. **Branching & handoff** – Use feature branches: `git checkout -b claude/<feature-name>-<ticket>` or fork + branch when a developer needs access. Keep changelists small per tool so the reviewer can trace Procore features to PRPs.
2. **Gates before database code** – Follow the `.claude/rules/SUPABASE-GATE.md` and `.claude/patterns/` registry. The `scripts/enforce-gates.ts` hook blocks DB-related edits until the Supabase Gate unlocks. Consult `.claude/scaffolds/crud-resource/` when a scaffold exists.
3. **Testing smoke** – Run `npm run test:frontend` and `npm run test:backend` after changes, and `npx playwright test ...` for UI features. The `scripts/run-all-tests.sh` wrapper executes the full suite if you want to verify everything locally.
4. **Handoff checklist** – Document the feature’s PRP (`PRPs/<category>/<feature>/prp-*.md`), include crawl references, share seed data scripts (`scripts/seed-db`), and point collaborators to the checklist in `.claude/templates/tasks`.

## What to do next

1. Decide whether the next developer works from a feature branch (`claude/<feature>`) or a fork. Keep both the base repo and the fork synced with `origin/main`.
2. Share this README plus `docs/development/DEVELOPER_MANUAL.mdx` and `.claude/WORKFLOW.md` so the new developer understands the workflow and gating expectations.
3. Encourage them to run the standard setup steps and to add tests before any PRP execution work begins.
