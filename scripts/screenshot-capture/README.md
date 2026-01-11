# Procore Screenshot Capture & Sitemap Generator

Automated screenshot capture and complete sitemap generation of Procore's construction management platform for UI/UX analysis and potential rebuild evaluation. **Now with enhanced sitemap generation, individual page folders, Supabase storage and AI analysis!**

## 🎯 Purpose

Systematically capture Procore's UI to:
- **Generate complete sitemap with organized page folders**
- **Create comprehensive table and list reports with direct links**
- **🔴 CRITICAL: Capture database schema for every feature/module**
- **🔴 CRITICAL: Create detailed form tables with column mappings**
- Analyze page layouts and information architecture
- Document component patterns and design system
- Create Figma reference boards for custom rebuild
- Identify essential vs. bloat features
- **Store everything in Supabase for querying and AI analysis**

## 📋 Prerequisites

- Node.js 18+
- A Procore account (for authenticated capture)
- **Playwright** (auto-installed with npm install)
- Figma account (for import - optional)
- **Supabase project (for data storage - optional)**
- **OpenAI API key (for AI analysis - optional)**

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (for Supabase integration - optional)
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Enhanced Sitemap Generation (NEW!)
npm run crawl:sitemap
# → Generates complete sitemap with organized folders and reports

# 4. Automatic login crawler (uses saved credentials)
npm run crawl:auto
# → Auto-login version for hands-free operation

# 5. Standalone Sitemap Generator (NEW!)
npm run sitemap:generate
# → Generate sitemap from existing crawl data (no re-crawling needed)

# 6. Alternative crawlers
npm run crawl:simple   # Basic page capture
npm run crawl:deep     # Deep crawl with modals

# 7. Set up Procore authentication (if needed)
npm run auth
# → Browser opens → Log into Procore → Close browser when done

# 8. Capture app pages WITH Supabase storage (optional)
npm run capture:supabase

# 9. Query your data (if using Supabase)
npm run db:modules     # List all Procore modules
npm run db:progress    # Show capture progress
npm run db:estimate    # Show rebuild estimate

# 10. Run AI analysis (requires OpenAI key - optional)
npm run ai:analyze     # Analyze screenshots with GPT-4 Vision
npm run ai:report      # Generate rebuild report
```

## 🗺️ Enhanced Sitemap Generation (NEW!)

The enhanced sitemap crawler (`npm run crawl:sitemap`) provides the most comprehensive analysis:

### ✨ Key Features
- **Individual Page Folders**: Every page gets its own organized folder
- **Complete DOM Snapshots**: Full HTML preserved for each page  
- **Link Analysis**: Extracts and counts all links from every page
- **Multiple Report Formats**: Table, list, and JSON outputs
- **Organized Structure**: Clean folder names and categorization
- **Error Handling**: Continues crawling even if individual pages fail

### 📊 Generated Reports

1. **Sitemap Table** (`reports/sitemap-table.md`)
   - Complete table with page names, categories, URLs
   - Direct links to screenshots and DOM files
   - Link count analysis per page
   - Success/failure status indicators

2. **Sitemap List** (`reports/sitemap-list.md`)
   - Pages organized by category (Project Management, Financials, etc.)
   - Alphabetical listing of all pages
   - Quick overview format

3. **Detailed Report** (`reports/detailed-report.json`)
   - Complete metadata for programmatic access
   - Link analysis and statistics
   - Full page information including extracted links

### 🎯 Perfect for
- **Site Architecture Analysis**: Understanding Procore's complete structure
- **Link Mapping**: Seeing how pages connect to each other
- **Competitive Research**: Organized data for analysis
- **Development Planning**: Structured data for rebuild estimates

See [SITEMAP_README.md](SITEMAP_README.md) for detailed documentation.

## 🗄️ Database Schema Capture (CRITICAL)

**⚠️ THIS IS MANDATORY FOR EVERY MODULE/FEATURE CAPTURED**

When capturing any Procore module or feature, you **MUST** document the database schema required to support that feature.

### Required Schema Documentation

For each module, create a database schema document that includes:

1. **Table Definitions**
   - Table name (following Procore naming conventions)
   - Primary key structure
   - All columns with data types
   - Indexes and constraints
   - Timestamps (created_at, updated_at)

2. **Relationships**
   - Foreign keys to other tables
   - One-to-many relationships
   - Many-to-many join tables
   - Cascade behaviors

3. **Business Logic**
   - Required fields vs optional
   - Validation rules
   - Default values
   - Computed/calculated fields

4. **Performance Considerations**
   - Recommended indexes
   - Partitioning strategies
   - Expected data volume

### Schema Documentation Template

```markdown
# [Module Name] Database Schema

## Tables

### `table_name`
Primary table for [purpose]

| Column | Type | Nullable | Description | Related To |
|--------|------|----------|-------------|------------|
| id | uuid | NOT NULL | Primary key | - |
| project_id | uuid | NOT NULL | Project reference | projects.id |
| name | varchar(255) | NOT NULL | Display name | - |
| status | varchar(50) | NOT NULL | Current status (draft/active/closed) | - |
| created_at | timestamptz | NOT NULL | Creation timestamp | - |
| updated_at | timestamptz | NOT NULL | Last update timestamp | - |
| created_by | uuid | NOT NULL | User who created | users.id |

**Indexes:**
- `idx_table_project_id` on (project_id)
- `idx_table_status` on (status)
- `idx_table_created_at` on (created_at DESC)

**Relationships:**
- `project_id` → `projects.id` (CASCADE on delete)
- `created_by` → `users.id` (SET NULL on delete)

## Related Tables
- `table_items` - Line items/details
- `table_attachments` - File attachments
- `table_history` - Audit trail
```

### Where to Save Schema Docs
- Primary location: `documentation/docs/database/`
- Module-specific: `documentation/docs/procore/[module-name]/schema.md`

## 📝 Form Field Capture (CRITICAL)

**⚠️ EVERY FORM MUST BE DOCUMENTED WITH COMPLETE FIELD MAPPINGS**

When you encounter ANY form in Procore (create, edit, filters, etc.), you **MUST** create a comprehensive form table documenting all fields.

### Required Form Documentation

Create a markdown table for each form with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| **Field Label** | Exact text shown in UI | "Contract Number" |
| **Field Name** | Technical field name/ID | `contract_number` |
| **Field Type** | Input type | text, number, date, select, textarea, file, checkbox |
| **Required** | Is field required? | Yes/No/Conditional |
| **Validation** | Rules and constraints | "Max 100 chars", "Must be unique", "Format: XXX-####" |
| **Default Value** | Pre-filled value if any | "Draft", current date, empty |
| **Options/Values** | For selects/radios | List all dropdown options |
| **Database Column** | Target column in schema | `contracts.contract_number` |
| **Related Table** | If FK relationship | `companies.id`, `cost_codes.id` |
| **Description** | What the field is for | "Unique identifier for tracking contract in ERP" |
| **Help Text** | Tooltip/helper text shown | "Enter the contract number from your accounting system" |
| **Conditional Logic** | When field shows/hides | "Only shown if contract_type = 'subcontract'" |

### Form Documentation Template

```markdown
# [Form Name] - Field Mapping

**Form Type:** Create / Edit / Filter / Search
**Module:** [Module Name]
**URL Pattern:** `/projects/{id}/[module]/new`
**Primary Table:** `table_name`

## Form Fields

| Field Label | Field Name | Type | Required | Validation | Default | Options | DB Column | Related Table | Description | Help Text | Conditional |
|------------|------------|------|----------|------------|---------|---------|-----------|---------------|-------------|-----------|-------------|
| Contract Number | contract_number | text | Yes | Max 50 chars, unique | - | - | contracts.contract_number | - | Unique contract identifier | Enter contract # from accounting | - |
| Vendor | vendor_id | select | Yes | Must exist | - | [List from companies] | contracts.vendor_id | companies.id | Company providing service | Select subcontractor or supplier | - |
| Contract Type | contract_type | radio | Yes | - | "subcontract" | Subcontract, Purchase Order, Service | contracts.contract_type | - | Type of agreement | - | - |
| Contract Date | contract_date | date | Yes | Not future | Today | - | contracts.contract_date | - | Effective date | - | - |
| Amount | amount | money | Yes | > 0 | - | - | contracts.amount | - | Total contract value | - | - |
| Retention % | retention_percent | number | No | 0-100 | 5 | - | contracts.retention_percent | - | Holdback percentage | Typical is 5-10% | Only if contract_type = 'subcontract' |
| Attachments | attachments | file | No | PDF, max 10MB | - | - | contract_attachments.file_path | - | Supporting docs | Upload signed contract | - |

## Field Groups

### Basic Information
- Contract Number
- Vendor
- Contract Type
- Contract Date

### Financial Details
- Amount
- Retention %
- Payment Terms

### Supporting Documents
- Attachments
- Notes

## Validation Rules

1. Contract Number must be unique within project
2. Contract Date cannot be more than 30 days in future
3. If Retention % is set, must have Payment Terms
4. At least one attachment required if Amount > $100,000

## Database Operations

**On Submit:**
```sql
INSERT INTO contracts (
  project_id, contract_number, vendor_id,
  contract_type, contract_date, amount,
  retention_percent, created_by, created_at
) VALUES (...);

-- If attachments
INSERT INTO contract_attachments (contract_id, file_path, ...) VALUES (...);
```
```

### Where to Save Form Docs
- Primary location: `documentation/docs/procore/[module-name]/forms/`
- Naming convention: `form-[action]-[entity].md`
  - Examples: `form-create-subcontract.md`, `form-edit-change-order.md`, `form-filter-commitments.md`

### Form CSV Export (Optional)

For easy import to spreadsheets:
```csv
Field Label,Field Name,Type,Required,Validation,Default,Database Column,Related Table,Description
Contract Number,contract_number,text,Yes,Max 50 unique,-,contracts.contract_number,-,Unique contract identifier
Vendor,vendor_id,select,Yes,Must exist,-,contracts.vendor_id,companies.id,Company providing service
```

## 🎯 Complete Capture Checklist

For EVERY module/feature you capture:

- [ ] Screenshot(s) of all views/states
- [ ] DOM snapshot for analysis
- [ ] **Database schema document** (tables, columns, relationships)
- [ ] **Form field mapping tables** (for create/edit/filter forms)
- [ ] Component analysis (UI patterns used)
- [ ] Workflow documentation (user flow)
- [ ] API endpoint mapping (if observable)
- [ ] Permission/role requirements
- [ ] Business rules and validation logic
- [ ] Related modules/dependencies

**Remember:** The goal is to capture enough detail to rebuild the feature WITHOUT accessing Procore's source code.

## 🗺️ Standalone Sitemap Generator (NEW!)

Generate sitemap reports without re-crawling pages:

```bash
# Generate sitemap from existing crawl data
npm run sitemap:generate

# Or specify a custom source directory
node scripts/generate-sitemap.js /path/to/crawl/data
```

### ✨ **Features**
- **Works with existing data** - No need to re-crawl pages
- **Fast generation** - Processes existing metadata in seconds
- **Multiple formats** - Table, list, and JSON outputs
- **Analysis preservation** - Maintains all component and table analysis
- **Flexible input** - Works with any crawl directory structure

### 📊 **Output**
Creates a `sitemap-only/` directory with:
- **README.md** - Complete summary with stats
- **reports/sitemap-table.md** - Enhanced table with component counts
- **reports/sitemap-list.md** - Categorized page listing  
- **reports/detailed-report.json** - Complete data export

### 🎯 **Use Cases**
- **Quick updates** - Regenerate sitemap after manual analysis edits
- **Different formats** - Export existing data in new formats
- **Sharing** - Create standalone reports without source data
- **Integration** - Generate reports for other tools/processes

## 🗄️ Supabase Integration

### Database Schema

The migration creates these tables:

| Table | Purpose |
|-------|---------|
| `procore_capture_sessions` | Track each capture run |
| `procore_screenshots` | Screenshot metadata + AI analysis |
| `procore_components` | Detected UI components |
| `procore_modules` | Procore feature catalog with rebuild estimates |
| `procore_features` | Individual features for planning |

### Storage

Screenshots are uploaded to Supabase Storage bucket `procore-screenshots` with this structure:
```
procore-screenshots/
├── project_management/
│   ├── daily-log/
│   │   ├── fullpage.png
│   │   └── viewport.png
│   └── ...
├── financials/
│   └── ...
└── ...
```

### Querying Data

```bash
# From CLI
npm run db:modules      # See all Procore modules with rebuild estimates
npm run db:progress     # Check which modules have been captured
npm run db:estimate     # Get total rebuild effort estimate
npm run db:screenshots  # List recent captures
npm run db:components   # Component detection stats

# Or directly in Supabase
SELECT * FROM procore_rebuild_estimate;
SELECT * FROM procore_capture_summary;
```

## 🤖 AI Analysis

With an OpenAI API key, you can analyze screenshots to extract:
- UI component inventory
- Color palettes
- UX observations
- Improvement suggestions
- Rebuild complexity estimates

```bash
# Analyze up to 10 unanalyzed screenshots
OPENAI_API_KEY=sk-xxx npm run ai:analyze

# Analyze more
OPENAI_API_KEY=sk-xxx npx ts-node scripts/analyze-screenshots.ts analyze 50

# Generate rebuild report from all analyzed screenshots
OPENAI_API_KEY=sk-xxx npm run ai:report
```

## 📁 Output Structure

### Enhanced Sitemap Output (NEW!)
```
procore-sitemap/                   # Complete sitemap generation
├── README.md                      # Summary of crawl results
├── pages/                         # Individual page folders
│   ├── project_home/             # Clean page names
│   │   ├── screenshot.png        # Full page screenshot
│   │   ├── dom.html              # Complete DOM snapshot
│   │   └── metadata.json         # Page details + links
│   ├── directory/
│   ├── commitments/
│   └── ... (one folder per page)
└── reports/                      # Generated sitemap reports
    ├── sitemap-table.md          # Table format with links
    ├── sitemap-list.md           # List format by category
    └── detailed-report.json      # Complete JSON data
```

### Legacy Output Folders
```
procore-screenshot-capture/
├── procore-screenshots/           # Public doc screenshots
├── procore-app-screenshots/       # Authenticated app screenshots
├── screenshots/                   # Simple crawler output
├── screenshots_v2/               # Alternative captures
└── figma-ready/                   # Organized for Figma import
    ├── 01-Portfolio/
    ├── 02-Project-Home/
    ├── 03-Core-Tools/
    ├── 04-Quality-Safety/
    ├── 05-Design-Coordination/
    ├── 06-Financials/
    ├── import-manifest.csv
    └── summary.json
```

## 🎨 Importing to Figma

### Method 1: Direct Drag & Drop
1. Open Figma, create a new file
2. Create frames for each category (Portfolio, Core Tools, Financials, etc.)
3. Drag folders from `figma-ready/` directly into Figma frames

### Method 2: Using Figma Plugins
Recommended plugins for bulk import:
- **Insert Big Image** - Handles large full-page screenshots
- **Content Reel** - Batch import from folders
- **Image Palette** - Extract color schemes from screenshots

### Method 3: Create a Reference Board
```
Figma Structure:
├── 📁 Procore Analysis
│   ├── 🖼 Portfolio & Company Level
│   ├── 🖼 Project Dashboard
│   ├── 🖼 Daily Operations (Daily Log, Photos, etc.)
│   ├── 🖼 Document Management
│   ├── 🖼 Financial Tools
│   ├── 🖼 Quality & Safety
│   └── 🖼 Component Library (extracted patterns)
```

## 🔍 Key Procore Modules to Analyze

### Must-Have for Construction PM
- **Daily Log** - Time tracking, weather, notes
- **Directory** - Contacts, companies, roles
- **Documents** - File management, folders, permissions
- **Drawings** - Plan management, markups, revisions
- **RFIs** - Request for information workflow
- **Submittals** - Document approval workflow
- **Budget** - Cost tracking, forecasting
- **Change Orders** - Change management
- **Punch List** - Deficiency tracking

### Nice-to-Have (Often Overengineered)
- Meetings (most use Google Calendar)
- Emails (most use Gmail/Outlook)
- Bidding (specialized tools exist)
- 3D Models (Autodesk dominates)

### Probably Don't Need
- Workforce planning (complex, rarely used)
- Equipment tracking (most use spreadsheets)
- Insurance certificates (Compliance tools better)

## 🔧 Customization

### Capture Specific Pages Only
Edit `capture-authenticated.ts` and modify `PROCORE_APP_SECTIONS`:

```typescript
const PROCORE_APP_SECTIONS = {
  projectLevel: [
    // Add only what you need
    { name: 'daily-log', path: '/projects/{PROJECT_ID}/project/daily_log' },
    { name: 'budget', path: '/projects/{PROJECT_ID}/project/budget' },
  ],
};
```

### Capture Additional Modals
Uncomment the modal capture in the test:
```typescript
await captureModals(page, section.name);
```

### Change Viewport Size
Modify the context options:
```typescript
context = await browser.newContext({
  storageState: AUTH_FILE,
  viewport: { width: 2560, height: 1440 }, // 2K resolution
});
```

## 📊 Rebuild Feasibility Assessment

Based on Procore's architecture, here's a complexity estimate:

| Module | Complexity | Build Time | Priority |
|--------|------------|------------|----------|
| Directory | Low | 2 weeks | High |
| Documents | Medium | 4 weeks | High |
| Daily Log | Low | 2 weeks | High |
| Photos | Low | 1 week | Medium |
| Drawings | High | 8 weeks | High |
| RFIs | Medium | 3 weeks | High |
| Submittals | Medium | 3 weeks | High |
| Budget | High | 6 weeks | Medium |
| Change Orders | High | 6 weeks | Medium |
| Punch List | Low | 2 weeks | High |
| Schedule | Very High | 12 weeks | Low |

### Recommended MVP Scope
1. Directory (people, companies)
2. Documents (basic file management)
3. Daily Log (time, weather, notes)
4. Photos (simple gallery)
5. RFIs (request workflow)
6. Punch List (deficiency tracking)

**Estimated MVP Timeline**: 12-16 weeks with 2 developers

## 🤖 AI Integration Opportunities

Areas where AI can add value Procore doesn't have:

1. **Daily Log Generation** - Voice-to-text field notes
2. **Document Classification** - Auto-categorize uploads
3. **RFI Drafting** - Generate RFI text from photos/notes
4. **Photo Analysis** - Progress detection, safety hazards
5. **Budget Predictions** - Cost overrun forecasting
6. **Smart Search** - Natural language document search
7. **Automated Reports** - Generate weekly summaries

## ⚠️ Legal Considerations

- Screenshots are for internal analysis only
- Do not redistribute Procore's UI designs
- Building similar functionality is legal (ideas aren't patentable)
- Don't copy their exact visual design/branding
- Focus on functionality, create your own design system

## 🐛 Troubleshooting

### Authentication expires
Re-run `npm run auth` to refresh your session

### Screenshots are blank
Increase the wait time in the script:
```typescript
await page.waitForTimeout(3000); // Increase from 2000
```

### Modal capture fails
Some modals require specific data to open. Capture these manually.

### Pages timeout
Procore can be slow. Increase timeout:
```typescript
await page.goto(url, { timeout: 120000 }); // 2 minutes
```

## 📝 Next Steps After Capture

1. **Import to Figma** - Create reference boards
2. **Document Patterns** - Note common components/layouts
3. **Identify Scope** - Decide what to build vs. skip
4. **Design System** - Create your own component library
5. **Prototype** - Build clickable mockups
6. **Develop** - Start with MVP modules

---

Built for Alleato's construction software modernization initiative.
