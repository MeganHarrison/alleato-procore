# Alleato AI Project Manager

## 🤖 AI-Powered Development with Codex

**Complete end-to-end automation pipeline:**

- **🚀 START HERE:** [`.github/CODEX-COMPLETE-AUTOMATION.md`](.github/CODEX-COMPLETE-AUTOMATION.md) ⭐ **NEW**
- **Quick Start:** [`.github/CODEX-QUICK-START.md`](.github/CODEX-QUICK-START.md) (30 seconds)
- **Full Guide:** [`.github/CODEX-CLOUD-TASKS-GUIDE.md`](.github/CODEX-CLOUD-TASKS-GUIDE.md) (comprehensive)
- **Setup Summary:** [`CODEX-SETUP-SUMMARY.md`](CODEX-SETUP-SUMMARY.md) (what you have)

**Usage:**
- **Recommended:** `/codex-task` (Claude Code slash command)
- **Alternative:** `./scripts/create-codex-task.sh` (terminal script)
- **Manual:** GitHub → Actions → "Codex Task Automation" → Run workflow

## Resources

- https://developers.procore.com/documentation/introduction
- https://v2.support.procore.com
- https://procore.com
- https://cookbook.openai.com/articles/codex_PLANS_DOCs
- documentation/CODEX-QUICKSTART.md
- documentation/REPO-MAP.md
- .agents/PLANS.md
- CLAUDE.md

## Folder Structure

See [documentation/REPO-MAP.md](documentation/REPO-MAP.md) for the full breakdown and placement rules.

### Frontend

- `frontend/` – Next.js 15 app code
  - `src/app` for routes
  - `src/components` for shared UI
  - `src/lib` for utilities/hooks
  - `src/types` for shared types. Supabase schema lives at `frontend/src/types/database.ts` and should be imported via `@/types/database.types`.
  - `tests/` – **only** location for Playwright, Jest, and screenshots (keep screenshots in `frontend/tests/screenshots/`).
  - `public/`, `supabase/`, and `scripts/` for static assets and app-specific tooling.

### Backend

- `backend/` – Python APIs, workers, and tests (`backend/src/api|services|workers`, `backend/tests/{unit,integration}`, `backend/scripts`).
- `scripts/` – root-level automation and tooling shared across the monorepo.
- `supabase/` – database migrations and metadata.

### Docs

- `documentation/` – architectural/process documentation referenced by CLAUDE.md and the Plans Doc.

## How to use

### Setting your OpenAI API key

Set your OpenAI API key in your environment variables:

```bash
export OPENAI_API_KEY=your_api_key
```

You can also follow [these instructions](https://platform.openai.com/docs/libraries#create-and-export-an-api-key) to set your OpenAI key at a global level.

Alternatively, you can set the `OPENAI_API_KEY` environment variable in an `.env` file at the root of the `python-backend` folder. You will need to install the `python-dotenv` package to load the environment variables from the `.env` file. And then, add these lines of code to your app:

```bash
from dotenv import load_dotenv

load_dotenv()
```

### Install dependencies

Install the dependencies for the backend by running the following commands:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

```
cd backend
source .venv/bin/activate
python -m uvicorn api:app --reload --port 8000
```

#### Run the backend independently

From the `python-backend` folder, run:

```bash
python -m uvicorn api:app --reload --port 8000
```

### Run the app

You can either run the backend independently if you want to use a separate UI, or run both the UI and backend at the same time.

The backend will be available at: [http://localhost:8000](http://localhost:8000)

For the UI, you can run:

```bash
cd frontend
npm install
```

#### Run the UI & backend simultaneously

From the repo root:

```bash
npm run dev
```

The frontend will be available at: [http://localhost:3000](http://localhost:3000)

This command will also start the backend.

### Actions

```
.save-docs.sh
```

## Budget Tool Implementation Status

### Phase 1: Core Functionality

**Phase 1A - Budget Modifications System** COMPLETE
- Budget modification CRUD operations
- Status workflow (draft -> pending -> approved/rejected/void)
- Modification tracking with sequential numbering (BM-XXXX)
- API endpoints: GET, POST, PATCH, DELETE
- UI components: BudgetModificationModal, BudgetModificationsModal
- See: `documentation/docs/phases/phase-1a-budget-modifications/`

**Phase 1B - Cost Actuals Integration** COMPLETE
- Direct costs API endpoint (`/api/projects/[id]/budget/direct-costs`)
- Real cost aggregation from multiple sources:
  - Direct cost line items (Invoice, Expense, Payroll, Subcontractor Invoice)
  - Pending subcontracts (subcontract_sov_items)
  - Pending purchase orders (purchase_order_sov_items)
  - Pending change orders (change_order_lines)
- Procore cost calculation rules implemented:
  - Job to Date Cost Detail = ALL approved types
  - Direct Costs = Excludes Subcontractor Invoice
- See: `documentation/docs/procore/budget/COST_CODE_MAPPING.md`

**Phase 1C - Project Status Snapshots** (Next)
- Project status snapshots
- Snapshot comparison and export
- Historical variance tracking

### Budget Tool Architecture

See `documentation/docs/procore/budget/` for detailed architecture documentation.

Key files:
- `frontend/src/app/api/projects/[id]/budget/route.ts` - Main budget API
- `frontend/src/app/api/projects/[id]/budget/modifications/route.ts` - Modifications workflow
- `frontend/src/app/api/projects/[id]/budget/direct-costs/route.ts` - Cost actuals
- `frontend/src/components/budget/` - Budget UI components

## Functionality

### Crawl4ai MCP
