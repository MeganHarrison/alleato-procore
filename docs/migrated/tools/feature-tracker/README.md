# Feature Tracker

A centralized database and toolset for tracking Procore feature implementation in Alleato-Procore.

## Quick Start

```bash
cd tools/feature-tracker

# Build the database (parses all crawled data)
npm run build

# Query features
npx tsx query-tracker.ts features

# Query pages for a feature
npx tsx query-tracker.ts pages budget

# View table schema
npx tsx query-tracker.ts schema prime_contracts

# Export to CSV (for spreadsheets)
npx tsx query-tracker.ts export-csv

# Clean up noise folders (preview first!)
npx tsx cleanup-crawls.ts --dry-run
npx tsx cleanup-crawls.ts --execute

# Generate schema documentation
npx tsx generate-schema-docs.ts

# Preview Linear sync
npx tsx sync-to-linear.ts --preview

# Export for Linear import
npx tsx sync-to-linear.ts --export
```

## What's in the Database

The SQLite database (`tracker.db`) contains:

| Table | Description |
|-------|-------------|
| `procore_features` | Top-level features (Budget, Commitments, etc.) |
| `procore_pages` | Individual crawled pages with URLs and paths |
| `page_components` | Buttons, forms, tables extracted from pages |
| `supabase_tables` | Current database schema (from types file) |
| `supabase_columns` | Column details for each table |
| `feature_table_mapping` | Which tables support which features |
| `schema_gaps` | Identified differences between Procore and our schema |

## Files Generated

| File | Description |
|------|-------------|
| `tracker.db` | SQLite database with all data |
| `pages-export.csv` | All pages in CSV format |
| `tracker-export.json` | Full database export as JSON |
| `linear-export.json` | Issues formatted for Linear import |
| `SCHEMA-DOCUMENTATION.md` | Schema comparison document |

## Workflow

### 1. Initial Setup

```bash
npm install
npm run build
```

### 2. Clean Up Noise

```bash
# Preview what will be deleted
npx tsx cleanup-crawls.ts --dry-run

# Execute cleanup (removes dropdown captures, numbered ID folders)
npx tsx cleanup-crawls.ts --execute

# Rebuild database after cleanup
npm run rebuild
```

### 3. Explore the Data

```bash
# List all features with page counts
npx tsx query-tracker.ts features

# See pages for a specific feature
npx tsx query-tracker.ts pages prime-contracts

# View current database schema for a table
npx tsx query-tracker.ts schema prime_contracts

# See feature-to-table mappings
npx tsx query-tracker.ts mapping
```

### 4. Export for External Tools

```bash
# CSV for Google Sheets / Excel
npx tsx query-tracker.ts export-csv

# JSON for programmatic use
npx tsx query-tracker.ts export-json

# Linear issues format
npx tsx sync-to-linear.ts --export
```

### 5. Generate Documentation

```bash
# Creates SCHEMA-DOCUMENTATION.md with:
# - Current schema for each feature
# - Calculated fields that should be views
# - Missing columns
# - Schema issues
npx tsx generate-schema-docs.ts
```

## Database Schema

### procore_features
```sql
CREATE TABLE procore_features (
    id TEXT PRIMARY KEY,           -- "budget", "prime-contracts"
    name TEXT NOT NULL,            -- "Budget", "Prime Contracts"
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    priority TEXT,                 -- critical, high, medium, low
    status TEXT,                   -- not_started, in_progress, complete
    match_score REAL,              -- 0.0 to 100.0
    linear_project_id TEXT,
    linear_issue_id TEXT
);
```

### procore_pages
```sql
CREATE TABLE procore_pages (
    id TEXT PRIMARY KEY,           -- "budget/budget-main-view"
    feature_id TEXT NOT NULL,
    name TEXT NOT NULL,            -- "Budget Main View"
    slug TEXT NOT NULL,            -- "budget-main-view"
    page_type TEXT,                -- list, detail, form, modal, tab, etc.
    procore_url TEXT,              -- Full Procore URL
    screenshot_path TEXT,          -- Path to screenshot.png
    dom_path TEXT,                 -- Path to dom.html
    metadata_path TEXT,            -- Path to metadata.json
    alleato_route TEXT,            -- Our Next.js route
    status TEXT,
    button_count INTEGER,
    form_field_count INTEGER,
    table_column_count INTEGER
);
```

### Useful Views

```sql
-- Feature overview with stats
SELECT * FROM v_feature_overview;

-- Pages needing work (sorted by priority)
SELECT * FROM v_pages_needing_work;

-- Schema comparison summary
SELECT * FROM v_schema_comparison;
```

## Integration with Linear

The feature tracker can sync with Linear for project management:

1. **Preview** what issues would be created:
   ```bash
   npx tsx sync-to-linear.ts --preview
   ```

2. **Export** issues as JSON:
   ```bash
   npx tsx sync-to-linear.ts --export
   ```

3. **Import to Linear** via API or Linear's import feature

Each Procore feature becomes a parent issue with:
- Priority mapped from feature priority
- Labels for `procore-feature` and priority
- Child issues for each page

## Rebuilding After Changes

If you modify the crawled data or schema:

```bash
# Regenerate Supabase types
npx supabase gen types typescript \
  --project-id "lgveqfnpkxvzbnnwuled" \
  --schema public \
  > frontend/src/types/database.types.ts

# Rebuild tracker database
npm run rebuild

# Regenerate schema docs
npx tsx generate-schema-docs.ts
```

## Adding Feature-Table Mappings

Edit `build-tracker-db.ts` to add mappings:

```typescript
const featureTableMappings: Array<[string, string, string]> = [
  ['feature-slug', 'table_name', 'primary'],   // or 'supporting'
  // Add more mappings here
];
```

Then rebuild: `npm run rebuild`
