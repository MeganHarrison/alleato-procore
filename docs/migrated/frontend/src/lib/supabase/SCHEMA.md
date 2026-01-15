# Database Schema Reference

This document provides a quick reference for the Supabase database schema.
Use this when writing queries to ensure correct table and column names.

> **Note:** For the most accurate and up-to-date schema, always check the generated
> types in `src/types/database.types.ts` or run `./scripts/gen-types.sh`.

## Core Tables

### `projects`
Main project entity. Most other tables reference this via `project_id`.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key (auto-increment) |
| `name` | text | Yes | Project name |
| `client` | text | Yes | Client name |
| `project_number` | text | Yes | Project identifier |
| `address` | text | Yes | Street address |
| `city` | text | Yes | City |
| `state` | text | Yes | State/Province |
| `zip` | text | Yes | Postal code |
| `start_date` | date | Yes | Project start date |
| `end_date` | date | Yes | Project end date |
| `status` | text | Yes | Project status |
| `contract_amount` | numeric | Yes | Total contract value |
| `created_at` | timestamptz | Yes | Record creation time |
| `updated_at` | timestamptz | Yes | Last update time |

### `project_tasks`
Tasks associated with a project.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | No | FK to projects.id |
| `task_description` | text | Yes | Task details |
| `assigned_to` | text | Yes | Assignee name |
| `status` | text | Yes | pending, in_progress, completed, blocked |
| `priority` | text | Yes | low, medium, high |
| `due_date` | date | Yes | Task due date |
| `created_at` | timestamptz | Yes | Record creation time |
| `updated_at` | timestamptz | Yes | Last update time |

### `document_metadata`
Metadata for documents, meetings, and other files.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `type` | text | Yes | meeting, document, drawing, photo, email |
| `title` | text | Yes | Document title |
| `date` | date | Yes | Document date |
| `content` | text | Yes | Full text content |
| `summary` | text | Yes | AI-generated summary |
| `participants` | text | Yes | Comma-separated list |
| `storage_path` | text | Yes | Path in Supabase Storage |
| `created_at` | timestamptz | Yes | Record creation time |

### `meeting_segments`
Segments/sections of parsed meeting transcripts.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `metadata_id` | uuid | No | FK to document_metadata.id |
| `segment_index` | integer | Yes | Order in meeting |
| `speaker` | text | Yes | Speaker name |
| `content` | text | Yes | Segment text |
| `tasks` | jsonb | Yes | Array of extracted tasks |
| `risks` | jsonb | Yes | Array of extracted risks |
| `decisions` | jsonb | Yes | Array of extracted decisions |
| `created_at` | timestamptz | Yes | Record creation time |

## Financial Tables

### `contracts`
Prime contracts with clients.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `contract_number` | text | Yes | Contract identifier |
| `title` | text | Yes | Contract title |
| `vendor` | text | Yes | Vendor/client name |
| `amount` | numeric | Yes | Contract amount |
| `status` | text | Yes | Contract status |
| `start_date` | date | Yes | Start date |
| `end_date` | date | Yes | End date |

### `commitments`
Subcontracts and purchase orders.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `commitment_number` | text | Yes | Commitment identifier |
| `vendor` | text | Yes | Vendor name |
| `amount` | numeric | Yes | Committed amount |
| `status` | text | Yes | Commitment status |

### `change_orders`
Changes to contracts.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `change_order_number` | text | Yes | CO identifier |
| `title` | text | Yes | Description |
| `amount` | numeric | Yes | CO amount |
| `status` | text | Yes | draft, pending, approved, rejected |

### `budget_line_items`
Project budget breakdown by cost code.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `cost_code` | text | Yes | Cost code |
| `description` | text | Yes | Line item description |
| `original_budget` | numeric | Yes | Original budgeted amount |
| `current_budget` | numeric | Yes | Current budget |
| `actual_cost` | numeric | Yes | Actual spent |

## Project Management Tables

### `rfis`
Requests for Information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `rfi_number` | text | Yes | RFI identifier |
| `subject` | text | Yes | RFI subject |
| `status` | text | Yes | draft, open, pending, closed |
| `assigned_to` | text | Yes | Assignee |
| `due_date` | date | Yes | Response due date |

### `daily_logs`
Daily site reports.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `log_date` | date | Yes | Date of log |
| `weather` | text | Yes | Weather conditions |
| `notes` | text | Yes | Daily notes |
| `headcount` | integer | Yes | Workers on site |

### `schedule_tasks`
Project schedule/timeline items.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `task_name` | text | Yes | Task name |
| `start_date` | date | Yes | Start date |
| `end_date` | date | Yes | End date |
| `percent_complete` | numeric | Yes | Completion percentage |
| `status` | text | Yes | Task status |

### `ai_insights`
AI-generated insights and recommendations.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | integer | No | Primary key |
| `project_id` | integer | Yes | FK to projects.id |
| `insight_type` | text | Yes | Type of insight |
| `title` | text | Yes | Insight title |
| `description` | text | Yes | Full description |
| `severity` | text | Yes | low, medium, high |
| `created_at` | timestamptz | Yes | When generated |

## Common Query Patterns

### Fetching project data with proper ID conversion

```typescript
// URL params are strings, convert to number for queries
const numericProjectId = parseInt(projectId, 10)

const { data } = await supabase
  .from('project_tasks')
  .select('*')
  .eq('project_id', numericProjectId)
```

### Using the project-fetcher utility

```typescript
import { getProjectInfo } from '@/lib/supabase/project-fetcher'

const { project, numericProjectId, supabase } = await getProjectInfo(projectId)

// Now use numericProjectId for related queries
const { data: tasks } = await supabase
  .from('project_tasks')
  .select('*')
  .eq('project_id', numericProjectId)
```

### Fetching meetings with segments

```typescript
const { data: meeting } = await supabase
  .from('document_metadata')
  .select('*')
  .eq('id', meetingId)
  .single()

const { data: segments } = await supabase
  .from('meeting_segments')
  .select('*')
  .eq('metadata_id', meetingId)
  .order('segment_index', { ascending: true })
```

## Tables That DON'T Exist

The following tables do NOT exist (avoid referencing them):

- ❌ `schedule_items` - Use `schedule_tasks` instead
- ❌ `schedule_of_values` - No direct project_id column

## Column Gotchas

- `document_metadata.duration` - May not exist in all environments
- `meeting_segments.opportunities` - May not exist in all environments
- `documents.metadata_id` - The `documents` table may not have this column

When in doubt, check the generated types in `database.types.ts`.
