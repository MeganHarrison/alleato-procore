# Developer Onboarding Guide

Welcome to Alleato-Procore! This guide will help you get productive quickly. It covers both the technical setup AND the domain knowledge you need to understand what you're building.

---

## Table of Contents

1. [Quick Start (Day 1)](#quick-start-day-1)
2. [Understanding Construction PM & Procore](#understanding-construction-pm--procore)
3. [Technical Architecture](#technical-architecture)
4. [Development Workflow](#development-workflow)
5. [Key Files Reference](#key-files-reference)

---

## Quick Start (Day 1)

### 1. Clone and Install

```bash
git clone <repo-url>
cd alleato-pm/frontend
npm install
```

### 2. Environment Setup

Create `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://lgveqfnpkxvzbnnwuled.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask for this>
```

### 3. Run the App

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Test Login

Use test credentials: `test1@mail.com` / `test12026!!!`

### 5. Verify Quality Checks Pass

```bash
npm run quality
# Should complete with 0 errors
```

---

## Understanding Construction PM & Procore

**This is the hard part that takes time to learn.** Procore is the industry-leading construction project management software. We're building a clone/improvement of it.

### The Construction Project Lifecycle

```
Preconstruction → Bidding → Construction → Closeout
     ↓              ↓           ↓            ↓
  Planning      Contracts   Execution    Handoff
```

### Key Entities (You'll See These Everywhere)

| Entity | What It Is | Real World Example |
|--------|-----------|-------------------|
| **Project** | A construction job | "Downtown Office Tower" |
| **Company** | An organization involved | "ABC General Contractors" |
| **Contact** | A person at a company | "John Smith, Project Manager" |
| **Client** | Who's paying for the project | "XYZ Development Corp" |

### Financial Entities (The Money Side)

| Entity | What It Is | Why It Matters |
|--------|-----------|----------------|
| **Commitment** | A contract with a subcontractor | "We hired ABC Plumbing for $50,000" |
| **Change Order** | Modification to a commitment | "ABC Plumbing needs $5,000 more for extra work" |
| **Budget** | The planned spending | "We allocated $500,000 for plumbing" |
| **Direct Cost** | An expense that's not part of a commitment | "Bought $2,000 of materials directly" |
| **Invoice** | A bill from a subcontractor | "ABC Plumbing wants payment for work done" |

### Document/Communication Entities

| Entity | What It Is | Real World Example |
|--------|-----------|-------------------|
| **RFI** (Request for Information) | A formal question needing an answer | "What color paint for lobby?" |
| **Submittal** | Documents submitted for approval | "Here's the marble sample for review" |
| **Daily Report** | Daily job site summary | "Today: 10 workers, poured concrete, weather sunny" |
| **Meeting Minutes** | Notes from project meetings | "Discussed schedule delays" |

### Procore-Specific Concepts

#### Ball-in-Court
Who currently needs to take action on something. If you create an RFI, the ball is in the architect's court. When they respond, it comes back to you.

#### Status Workflows
Most items follow a status progression:
```
Draft → Open → In Review → Closed
```

#### Project-Scoped vs Company-Level
- **Project-scoped**: Most things (RFIs, submittals, daily reports) belong to a specific project
- **Company-level**: Some things (contacts, companies) exist across all projects

#### Permission Levels
Procore has granular permissions:
- **Admin**: Full control
- **Standard**: Normal user access
- **Read Only**: Can view but not modify

### Common Procore Patterns We Replicate

1. **List → Detail View**: Click a row to see full details
2. **Status Badges**: Color-coded status indicators
3. **Filters + Search**: Every table has filtering
4. **Bulk Actions**: Select multiple items, perform action
5. **Export**: Download data as CSV/PDF

---

## Technical Architecture

### Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| UI | Tailwind CSS + ShadCN UI |
| Backend | Supabase (Postgres + Auth + Storage) |
| Data Fetching | TanStack React Query |
| Tables | TanStack React Table |
| State | Zustand + React Context |
| Testing | Playwright (E2E) |

### Folder Structure (The Important Parts)

```
frontend/src/
├── app/                    # Pages and API routes
│   ├── (main)/            # Authenticated pages with sidebar
│   │   └── [projectId]/   # Project-scoped pages
│   │       ├── home/
│   │       ├── rfis/
│   │       ├── submittals/
│   │       └── ...
│   ├── (tables-correct)/  # Data table pages
│   ├── api/               # API endpoints
│   └── auth/              # Login, signup pages
│
├── components/            # React components
│   ├── ui/               # ShadCN base components
│   ├── tables/           # Table implementations
│   └── ...
│
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, services
├── types/                 # TypeScript types
│   └── database.types.ts  # AUTO-GENERATED from Supabase
└── contexts/              # React Context providers
```

### Key Patterns

#### 1. Route Parameter Consistency (CRITICAL)

All project routes use `[projectId]` - never `[id]` or `[project]`:

```
✓ /[projectId]/rfis
✓ /[projectId]/submittals
✗ /[id]/rfis         ← WRONG
```

#### 2. Data Fetching (Server Components)

```typescript
// Page component fetches data server-side
export default async function RFIsPage({ params }) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("rfis")
    .select("*")
    .eq("project_id", projectId);

  return <RFIsClient data={data} />;
}
```

#### 3. Table Configuration

Tables use a config object pattern:

```typescript
const config: GenericTableConfig = {
  title: "RFIs",
  searchFields: ["subject", "description"],
  columns: [
    { id: "number", label: "#", type: "text" },
    { id: "subject", label: "Subject", type: "text" },
    { id: "status", label: "Status", type: "badge" },
  ],
  filters: [
    { id: "status", label: "Status", options: [...] }
  ]
};
```

#### 4. Supabase Clients

```typescript
// Server component - user's session
const supabase = await createClient();

// API route - bypass RLS (admin operations)
const supabase = createServiceClient();

// Client component
import { useSupabase } from "@/hooks/useSupabase";
```

---

## Development Workflow

### Before You Start Any Feature

1. **Read CLAUDE.md** - Project rules and requirements
2. **Understand the feature in Procore** - What are we replicating?
3. **Find similar implementations** - We probably have a pattern to follow

### Making Changes

```bash
# 1. Make your changes

# 2. Run quality check (MUST pass)
npm run quality

# 3. Test manually in browser

# 4. Write/run Playwright tests
npm run test
```

### Code Standards

**Banned:**
- `@ts-ignore`
- `any` type
- `console.log` (use proper logging)
- Creating `_backup` or `_old` files

**Required:**
- TypeScript strict mode
- Proper error handling
- Tests for new features

### Testing with Playwright

```bash
# Run all tests
npm run test

# Run specific test
npx playwright test tests/e2e/rfis.spec.ts

# Interactive mode (see browser)
npm run test:ui

# View test report
npm run test:report
```

Test credentials: `test1@mail.com` / `test12026!!!`

### Generating Types After Database Changes

```bash
npx supabase gen types typescript \
  --project-id "lgveqfnpkxvzbnnwuled" \
  --schema public \
  > frontend/src/types/database.types.ts
```

---

## Key Files Reference

| What You Need | Where To Look |
|--------------|---------------|
| Database schema/types | `frontend/src/types/database.types.ts` |
| How tables work | `frontend/src/lib/table-registry.ts` |
| Sidebar menu structure | `frontend/src/lib/menu-list.ts` |
| Common utilities | `frontend/src/lib/utils.ts` |
| Project rules | `CLAUDE.md` (root) |
| Route naming rules | `.agents/rules/CRITICAL-NEXTJS-ROUTING-RULES.md` |
| Playwright patterns | `.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md` |
| Example table page | `frontend/src/app/(tables-correct)/risks/page.tsx` |
| Example API route | `frontend/src/app/api/projects/route.ts` |
| Auth hooks | `frontend/src/hooks/useAuth.ts` |
| Data fetching hooks | `frontend/src/hooks/use-projects.ts` |

---

## Common Tasks

### Add a New Table/List Page

1. Check if table exists in Supabase (`database.types.ts`)
2. Add to table registry (`lib/table-registry.ts`)
3. Create page at `app/(tables-correct)/[table-name]/page.tsx`
4. Follow the pattern in `risks/page.tsx`

### Add a Project-Scoped Feature

1. Create folder at `app/(main)/[projectId]/[feature-name]/`
2. Create `page.tsx` with server-side data fetch
3. Use `params.projectId` to scope queries

### Add an API Endpoint

1. Create `app/api/[resource]/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` as needed
3. Use `createServiceClient()` for admin operations
4. Return `NextResponse.json()`

---

## Questions?

- Check CLAUDE.md for project-specific rules
- Look for similar implementations in the codebase
- Ask in team chat if stuck

Welcome to the team!
