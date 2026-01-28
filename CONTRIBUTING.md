# Contributing to Alleato-Procore

This guide is intended for the developer you invite to work on a feature. It pulls together the workflow, gating rules, and organization expectations so the codebase stays discoverable instead of “a freaking disaster.”

## 1. Before you start coding

- **Fork or branch** – Either fork the repo and work there, or create a feature branch off `origin/main` with the pattern `claude/<feature>-<ticket>`. Keep the base repo and any fork in sync before you start.
- **Sync dependencies** – Run `npm install` from the repo root and again inside `frontend/`. Install Python deps for `backend/` if needed.
- **Read the mandatory guides**:
  - `.claude/WORKFLOW.md` for the crawl → ETL → spec → test → PRP phases.
  - `.claude/rules/SUPABASE-GATE.md`, `.claude/patterns/`, and `.claude/scaffolds/crud-resource/` before touching migrations, DB types, hooks, or API routes.

## 2. Feature workflow (keep things organized)

1. **Observe & document** – Use the existing crawl data under `PRPs/<category>/<feature>/` or run a new crawl with `scripts/playwright-crawl`. Every feature begins with that ground truth.
2. **Plan & spec** – Refer to `docs/development/DEVELOPER_MANUAL.mdx` for architecture context. Draft the PRP in `PRPs/<category>/<feature>/prp-*.md` so reviewers can trace UI work back to research and crawls.
3. **Scaffold & gate** – Use `.claude/scaffolds` when building new resources. The husky hook defined by `scripts/enforce-gates.ts` will block DB edits until the Supabase Gate is satisfied (generate types, confirm schema, etc.).
4. **Execute & test** – Develop the frontend in `frontend/src/`, backend in `backend/`, and keep seeds, migrations, and ETL scripts in `scripts/` and `supabase/`. Update tests next to the changed code (`frontend/tests`, `backend/tests`, `playwright/`), and capture artifacts in `screenshot-capture/` if needed.
5. **Document & handoff** – After implementation, update the PRP checklist and note key scripts in `scripts/seed-db`, `scripts/playwright-crawl`, etc. Point the next developer to the relevant `docs/` pages and `.claude/templates/tasks`.

## 3. Testing

- Frontend unit: `npm run test:frontend`
- Backend tests: `npm run test:backend`
- Full suite: `npm run test` or `npm run test:all` (`scripts/run-all-tests.sh`)
- Playwright: `npx playwright test frontend/tests/e2e/*.spec.ts --config=frontend/config/playwright/playwright.config.ts`
- Run `npm run schema:docs` after touching Supabase migrations.

## 4. Keeping the repo tidy

- **Directory awareness** – Refer to `README.md`’s directory tour when adding new folders; new code should land near related domains (`frontend/src/components/budget`, `scripts/seed-db`, `PRPs/pm-tools`, etc.).
- **Avoid duplicate artifacts** – Only keep the latest crawl or spec files; archive older versions under `PRPs/<feature>/.archive/` if you need to preserve them.
- **Preserve docs** – Update `docs/development/DEVELOPER_MANUAL.mdx` or `docs/index/PROCORE-TUTORIALS.md` when you add new workflows. Keep `.claude/` tooling intact; it enforces gates and stores templates the whole team relies on.

## 5. Handoff checklist for the next collaborator

1. Share the feature branch name or fork URL plus any PRP/research file paths.
2. Note the Supabase gates that were completed (types generated, schema confirmed).
3. Highlight which scripts seed data (`scripts/seed-db/seed-config.ts`) and which crawls (`scripts/playwright-crawl`) support the feature.
4. Remind them to read `.claude/WORKFLOW.md`, `docs/development/DEVELOPER_MANUAL.mdx`, and the new `README.md` before diving in.

Thanks for helping keep the repository useful, transparent, and easier to hand to the next developer.
