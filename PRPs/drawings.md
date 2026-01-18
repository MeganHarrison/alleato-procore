<!-- allow-outside-documentation -->
| description: |
| -- |

## Goal

**Feature Goal**: Deliver a Procore-style Drawings tool experience in the project scope that supports drawing areas, drawing sets/revisions, and a viewer workflow aligned to Procore’s Drawings UI patterns.

**Deliverable**: A set of Next.js App Router pages/components (drawings list, areas list, revisions list, viewer) with TypeScript-typed data models and Supabase-backed persistence hooks that mirror Procore’s Drawings workflows.

**Success Definition**: Users can navigate to a project’s Drawings tool, manage drawing areas and revisions, upload drawings, and open a viewer screen with core controls; the UI matches Procore’s captured layouts and behaviors, and all validation commands pass in the repo.

## Why

* Drawings are a core Procore tool; parity unlocks construction teams to manage plans and revisions within Alleato.
* Integrates with existing project tools and file uploads (Supabase storage + files table).
* Enables downstream workflows like markup, QR code sharing, and linking related items.

## What

Implement Drawings tool UI and data flows that reflect Procore’s Drawings screens:

* **Drawings Areas** view with cards per area, “Add Drawing Area,” and context menu (edit/delete) like the captured Procore page.
* **Drawings Revisions** log view with filters, drawing sets, and the table layout shown in Procore’s “Current Drawings” list.
* **Drawing Viewer (fullscreen)** with header controls for drawing + revision selection, and side navigation tabs (Download, QR Code, Markup, Filter, Info, Search, Activity).
* **Upload flow** using Supabase storage (drawings bucket) and files table (existing patterns).
* **Routing** should stay within project-scoped App Router paths and use the existing `[projectId]` param.

### Success Criteria

- [ ] Drawing Areas list renders with action button and area cards.
- [ ] Drawings log table displays columns and filters consistent with Procore screenshot capture.
- [ ] Viewer page renders the header controls and placeholder drawing panel aligned to Procore’s layout.
- [ ] Upload drawing dialog integrates with storage and files table, using existing component patterns.
- [ ] All validation commands in this PRP run successfully with zero errors.

## All Needed Context

### Context Completeness Check

*Before writing this PRP, validate: "If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"*

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://v2.support.procore.com/product-manuals/drawings-project/tutorials
  why: Canonical list of Drawings workflows to mirror in UI
  critical: Identifies expected features (areas, sets, revisions, upload, viewer)
- url: https://v2.support.procore.com/product-manuals/drawings-project/tutorials/upload-drawings
  why: Defines upload flow and required metadata
  critical: Prevents missing fields or steps during upload implementation
- url: https://v2.support.procore.com/product-manuals/drawings-project/tutorials/manage-drawing-log
  why: Defines table layout, filters, and drawing log expectations
  critical: Aligns list/table behaviors with Procore norms
- url: https://v2.support.procore.com/product-manuals/drawings-project/tutorials/view-drawings
  why: Viewer workflow details
  critical: Ensures viewer controls and navigation match expected workflow
- url: https://nextjs.org/docs/app/building-your-application/routing
  why: App Router patterns for project-scoped pages
  critical: Avoids route placement errors and keeps [projectId] param consistent
- url: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  why: API route patterns for Supabase-backed endpoints
  critical: Proper GET/POST handlers and typing
- url: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns
  why: Client vs Server component decisions
  critical: Avoids browser API usage in Server Components
- url: https://tanstack.com/table/v8/docs/guide/column-defs
  why: Table column definitions for the Drawings log
  critical: Ensures typed columns and consistent cell rendering
- url: https://ui.shadcn.com/docs/components/dialog
  why: Upload dialog and modal patterns
  critical: Match existing dialog composition in the repo
- url: https://ui.shadcn.com/docs/components/dropdown-menu
  why: Action menus on area cards or row actions
  critical: Provides correct trigger/content structure
- file: frontend/src/app/(main)/[projectId]/drawings/page.tsx
  why: Existing Drawings page prototype and layout references
  pattern: ProjectToolPage usage, tabs, filters, mock data shape
  gotcha: Uses client components and local state; extend without breaking mock-driven UI
- file: frontend/src/app/(tables)/(procore)/drawings/page.tsx
  why: Existing Drawings table layout using DataTable
  pattern: ColumnDef usage with badges and action menus
  gotcha: Reuse table component patterns to avoid reinventing table logic
- file: frontend/src/components/drawings/upload-drawing-dialog.tsx
  why: Existing upload dialog with Supabase storage + files insert
  pattern: Supabase client usage, storage upload, metadata building
  gotcha: Avoid console.log and keep error handling explicit
- file: frontend/src/components/project-setup-wizard/drawings-setup.tsx
  why: Drawings upload workflow used during setup
  pattern: Dropzone + Supabase storage insert, progress tracking
  gotcha: Ensures consistent storage paths and metadata
- file: frontend/src/components/layout/project-tool-page.tsx
  why: Standard project tool layout
  pattern: PageHeader + PageContainer composition
  gotcha: Tool pages should use this for consistent styling
- docfile: PRPs/ai_docs/drawings-docs.md
  why: Consolidated Procore docs and UI evidence references
  section: All sections
```

### Current Codebase tree (run `tree` in the root of the project) to get an overview of the codebase

```bash
alleato-pm
├── frontend
│   ├── src
│   │   ├── app
│   │   │   ├── (main)
│   │   │   │   └── [projectId]
│   │   │   │       └── drawings
│   │   │   │           └── page.tsx
│   │   │   └── (tables)
│   │   │       └── (procore)
│   │   │           └── drawings
│   │   │               └── page.tsx
│   │   ├── components
│   │   │   ├── drawings
│   │   │   │   └── upload-drawing-dialog.tsx
│   │   │   ├── layout
│   │   │   │   └── project-tool-page.tsx
│   │   │   └── project-setup-wizard
│   │   │       └── drawings-setup.tsx
│   │   └── types
│   │       └── (various domain types)
```

### Desired Codebase tree with files to be added and responsibility of file

```bash
PRPs/
└── drawings.md                           # This PRP
PRPs/ai_docs/
└── drawings-docs.md                      # Procore tutorial + UI evidence notes
frontend/src/types/
└── drawings.ts                           # TypeScript domain models for drawings
frontend/src/components/drawings/
├── drawings-areas.tsx                    # Areas list UI
├── drawings-log-table.tsx                # Drawings list/table + filters
├── drawings-viewer.tsx                   # Viewer layout + toolbar
└── drawings-toolbar.tsx                  # Shared toolbar controls (download, QR, etc.)
frontend/src/app/(main)/[projectId]/drawings/
├── page.tsx                              # Orchestration between tabs (areas/log/viewer)
├── areas/page.tsx                        # Areas route
├── revisions/page.tsx                    # Revisions/log route
└── viewer/[drawingId]/page.tsx           # Viewer route
frontend/src/app/api/drawings/
├── route.ts                              # GET/POST drawings, areas, sets
└── [drawingId]/revisions/route.ts        # GET/POST revisions
frontend/src/hooks/
└── use-drawings.ts                       # Data fetching + mutations
frontend/src/tests/
└── drawings/                             # Playwright tests for Drawings tool
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Next.js App Router uses [projectId] param; keep this consistent across new routes.
// CRITICAL: Client components must include 'use client' for hooks and event handlers.
// CRITICAL: Supabase storage bucket is 'drawings'; files table used for metadata inserts.
// CRITICAL: Avoid banned patterns (@ts-ignore, any, console.log, silent failure handling).
// CRITICAL: Use ProjectToolPage for consistent tool layout.
```

## Implementation Blueprint

### Data models and structure

Create typed models for drawings, areas, sets, revisions, filters, and viewer metadata.

```typescript
export type DrawingStatus = "published" | "draft" | "superseded" | "void";

export interface DrawingArea {
  id: string;
  projectId: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  drawingCount: number;
}

export interface DrawingSet {
  id: string;
  projectId: number;
  name: string;
  issuedAt?: string;
  status: "active" | "archived";
}

export interface DrawingRevision {
  id: string;
  drawingId: string;
  revision: string;
  drawingDate?: string;
  receivedDate?: string;
  setId?: string;
  status: DrawingStatus;
  fileId?: string;
}

export interface DrawingRecord {
  id: string;
  projectId: number;
  areaId?: string;
  number: string;
  title: string;
  discipline: string;
  revision: string;
  status: DrawingStatus;
  setId?: string;
  drawingDate?: string;
  receivedDate?: string;
}
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE frontend/src/types/drawings.ts
  - IMPLEMENT: DrawingArea, DrawingSet, DrawingRecord, DrawingRevision types
  - FOLLOW pattern: frontend/src/types/project.ts (export naming, interface layout)
  - NAMING: PascalCase for interfaces, camelCase for fields
  - PLACEMENT: frontend/src/types/

Task 2: CREATE frontend/src/components/drawings/drawings-areas.tsx
  - IMPLEMENT: Areas list UI matching Procore screenshot (cards + Add Drawing Area)
  - FOLLOW pattern: frontend/src/app/(main)/[projectId]/drawings/page.tsx (layout + cards)
  - DEPENDENCIES: Types from Task 1
  - PLACEMENT: frontend/src/components/drawings/

Task 3: CREATE frontend/src/components/drawings/drawings-log-table.tsx
  - IMPLEMENT: Drawings log table with filters and columns (Drawing No., Title, Revision, Dates, Set, Status)
  - FOLLOW pattern: frontend/src/app/(tables)/(procore)/drawings/page.tsx (ColumnDef + Badges)
  - DEPENDENCIES: Types from Task 1
  - PLACEMENT: frontend/src/components/drawings/

Task 4: CREATE frontend/src/components/drawings/drawings-viewer.tsx
  - IMPLEMENT: Viewer layout aligned with fullscreen screenshot (header selects + tab rail)
  - FOLLOW pattern: frontend/src/app/(main)/[projectId]/drawings/page.tsx (mock viewer area)
  - DEPENDENCIES: Types from Task 1
  - PLACEMENT: frontend/src/components/drawings/

Task 5: CREATE frontend/src/components/drawings/drawings-toolbar.tsx
  - IMPLEMENT: Download/QR/Markup/Filter/Info/Search/Activity controls
  - FOLLOW pattern: frontend/src/components/ui/button + dropdowns
  - DEPENDENCIES: Task 4
  - PLACEMENT: frontend/src/components/drawings/

Task 6: UPDATE frontend/src/app/(main)/[projectId]/drawings/page.tsx
  - IMPLEMENT: Route orchestration (tabs or nested routes) for Areas, Revisions, Viewer
  - FOLLOW pattern: ProjectToolPage usage and existing tabs
  - DEPENDENCIES: Tasks 2-5

Task 7: CREATE frontend/src/app/(main)/[projectId]/drawings/areas/page.tsx
  - IMPLEMENT: Areas route page using ProjectToolPage + DrawingsAreas
  - FOLLOW pattern: frontend/src/app/(main)/[projectId]/documents/page.tsx

Task 8: CREATE frontend/src/app/(main)/[projectId]/drawings/revisions/page.tsx
  - IMPLEMENT: Revisions list route using DrawingsLogTable
  - FOLLOW pattern: frontend/src/app/(main)/[projectId]/drawings/page.tsx layout and filters

Task 9: CREATE frontend/src/app/(main)/[projectId]/drawings/viewer/[drawingId]/page.tsx
  - IMPLEMENT: Viewer route using DrawingsViewer
  - FOLLOW pattern: App Router dynamic route pattern
  - DEPENDENCIES: Task 4

Task 10: CREATE frontend/src/hooks/use-drawings.ts
  - IMPLEMENT: fetch + mutate wrappers for drawings, areas, revisions
  - FOLLOW pattern: existing hooks in frontend/src/hooks
  - DEPENDENCIES: Types from Task 1

Task 11: CREATE frontend/src/app/api/drawings/route.ts
  - IMPLEMENT: GET/POST for drawings and areas using Supabase
  - FOLLOW pattern: frontend/src/app/api/procore-docs/ask/route.ts (error handling + typing)

Task 12: CREATE frontend/src/app/api/drawings/[drawingId]/revisions/route.ts
  - IMPLEMENT: GET/POST revisions (filter by drawingId)
  - FOLLOW pattern: Next.js route handlers with typed responses

Task 13: ADD Playwright tests under frontend/tests/drawings/
  - IMPLEMENT: navigation to drawings areas/log/viewer, upload dialog smoke
  - FOLLOW pattern: frontend/tests/e2e/* (auth + networkidle)
```

### Implementation Patterns & Key Details

```typescript
// ProjectToolPage usage
<ProjectToolPage title="Drawings" description="View, manage, and upload drawings">
  <DrawingsAreas areas={areas} onAddArea={...} />
</ProjectToolPage>

// Table column pattern
const columns: ColumnDef<DrawingRecord>[] = [
  { accessorKey: "number", header: "Drawing No." },
  { accessorKey: "title", header: "Drawing Title" },
  { accessorKey: "revision", header: "Revision" },
  { accessorKey: "drawingDate", header: "Drawing Date" },
  { accessorKey: "receivedDate", header: "Received Date" },
  { accessorKey: "setName", header: "Set" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge>{row.getValue("status")}</Badge> },
];

// Viewer layout pattern
<DrawingsViewer
  drawing={selectedDrawing}
  revision={currentRevision}
  onDownload={...}
  onSelectRevision={...}
  onSelectDrawing={...}
/>
```

### Integration Points

```yaml
DATABASE:
  - table: files (existing) for uploaded drawings metadata
  - storage: Supabase bucket `drawings`
  - client: createClient() for client components (upload)
ROUTES:
  - app/(main)/[projectId]/drawings
  - app/(main)/[projectId]/drawings/areas
  - app/(main)/[projectId]/drawings/revisions
  - app/(main)/[projectId]/drawings/viewer/[drawingId]
API:
  - app/api/drawings/route.ts
  - app/api/drawings/[drawingId]/revisions/route.ts
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
npm run lint --prefix frontend
npx tsc --noEmit --project frontend/tsconfig.json
npm run format --prefix frontend
```

### Level 2: Unit Tests (Component Validation)

```bash
cd frontend
npm test -- drawings
```

### Level 3: Integration Testing (System Validation)

```bash
cd frontend
npm run dev &
sleep 5
curl -I http://localhost:3000/PROJECT_ID/drawings
```

### Level 4: Creative & Domain-Specific Validation

```bash
cd frontend
npx playwright test --reporter=html --grep "drawings"
```

## Final Validation Checklist

### Technical Validation

- [ ] Level 1 validation passes with zero errors
- [ ] Level 2 tests pass for drawings components
- [ ] Level 3 routes return 200 for Drawings pages
- [ ] Level 4 Playwright tests pass and report generated

### Feature Validation

- [ ] Areas, Revisions log, and Viewer routes align with Procore screenshots
- [ ] Upload dialog works and inserts to Supabase storage + files table
- [ ] Filter/search UI behaves as documented in Procore tutorials

### Code Quality Validation

- [ ] Follows existing TypeScript patterns (no any, no @ts-ignore)
- [ ] Uses ProjectToolPage for consistent layout
- [ ] Next.js dynamic params consistent with [projectId]

### TypeScript/Next.js Specific

- [ ] Client/Server components split appropriately
- [ ] Route handlers use named exports and typed responses
- [ ] No browser APIs in Server Components

---

## Anti-Patterns to Avoid

* ❌ Don’t add new [id] params (must use [projectId]).
* ❌ Don’t introduce new UI primitives when shadcn/ui components exist.
* ❌ Don’t hardcode values that should be derived from Supabase data.
* ❌ Don’t skip Playwright tests; user-visible features require E2E coverage.
