---
name: "Codex Bug Report"
about: "Structured bug report for Codex to reproduce, fix, and validate"
title: ""
labels: ["bug", "codex"]
assignees: ""
---

## Bug Summary
- What is broken (observable behavior):
- Expected behavior:

## Repro Steps
1. 
2. 
3. 
Include test data/seed steps if needed.

## Scope & Starting Points
- Affected routes/pages/components/files (full paths):
- Logs/screenshots showing failure:
- Relevant docs to load (CLAUDE.md, CODEX-QUICKSTART, REPO-MAP, domain docs):

## Acceptance Criteria (observable)
- [ ] Repro no longer occurs (describe exact verification)
- [ ] Regression covered by tests (Playwright for UI, unit for logic)
- [ ] Screenshots/videos captured if UI

## Required Commands
- `npm run quality --prefix frontend`
- Targeted Playwright/Jest suite:
- Backend tests if applicable:

## Evidence to Attach
- Playwright artifacts under `frontend/tests/screenshots/`
- Test output snippets (before/after if available)
- Notes on rule violations logged to `RULE-VIOLATION-LOG.md` (if any)
