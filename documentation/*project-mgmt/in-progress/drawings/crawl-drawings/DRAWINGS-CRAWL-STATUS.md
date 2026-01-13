# Procore Drawings Crawl - Status Report

**Generated:** 2026-01-12
**Feature:** Drawings
**Crawler:** Enhanced v2 (Network Capture, Resume, Page Role Classification)

## Summary

Successfully captured the core Drawings UI functionality:

| Metric | Count |
|--------|-------|
| **Total Pages Captured** | 11 drawings-specific pages |
| **Dropdown Menus Captured** | 7 |
| **Tab Views Captured** | 1 (QR Code) |
| **UI Buttons** | 38+ per page |
| **Markup Tools Found** | 2 |

## Core Pages Captured

### 1. Drawings Areas (Folder Structure)
- **Page:** `drawings-areas`
- **URL:** `.../tools/drawings/areas`
- **Content:** Folder/area navigation for organizing drawings
- **Dropdowns:** 1 captured

### 2. Drawings Revisions (Main List)
- **Page:** `drawings-revisions`
- **URL:** `.../tools/drawings/areas/{id}/revisions`
- **Content:** Main revisions list with all drawing sheets
- **UI Components:** 38 buttons, 37 inputs, 117 icons
- **Dropdowns Captured:**
  - `drawings-revisions_dropdown_1` - **Reports** menu (3 items)
  - `drawings-revisions_dropdown_2` - **Export** menu (2 items)

### 3. Fullscreen Viewer (Markup/Annotations)
- **Page:** `drawings-viewer-fullscreen`
- **URL:** `.../drawing_log/view_fullscreen/{id}`
- **Content:** Full-page drawing viewer with markup tools
- **UI Components:** 15 clickables, 10 dropdowns, 7 tabs
- **Tabs Available:** QR Code, Markup, Filter, Info, Search, Activity
- **Dropdowns Captured:**
  - `drawings-viewer-fullscreen_dropdown_1`
  - `drawings-viewer-fullscreen_dropdown_3`
  - `drawings-viewer-fullscreen_dropdown_4`
- **Tab Captured:** `drawings-viewer-fullscreen_tab_qr_code`

### 4. Drawings List
- **Page:** `drawings-drawings`
- **URL:** `.../tools/drawings`
- **Content:** Main drawings tool entry page

## Key Features Identified

### Drawing Management
1. **Drawing Areas/Folders** - Hierarchical organization
2. **Revisions List** - Track drawing versions
3. **Drawing Sets** - Group related drawings
4. **Trash/Deletion Log** - Recover deleted drawings

### Viewer Features
1. **Fullscreen Viewer** - Full-page drawing display
2. **QR Code Tab** - Generate QR codes for drawings
3. **Markup Tab** - Annotation and markup tools
4. **Filter Tab** - Filter drawings
5. **Info Tab** - Drawing metadata
6. **Search Tab** - Search within drawings
7. **Activity Tab** - Drawing change history

### Export/Reporting
1. **Reports Menu** - 3 report options
2. **Export Menu** - 2 export formats

## URLs Discovered for Implementation

```
/drawings                           # Main entry
/drawings/areas                     # Area/folder list
/drawings/areas/{id}/revisions      # Revisions for an area
/drawing_log/configure_tab          # Configuration
/drawing_log/drawing_sets           # Drawing sets
/drawing_log/deletion_log           # Trash
/drawing_log/view_fullscreen/{id}   # Fullscreen viewer
```

## Implementation Recommendations

### Database Schema (Inferred)
```sql
-- Drawing Areas (Folders)
CREATE TABLE drawing_areas (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id),
  name TEXT NOT NULL,
  parent_area_id BIGINT REFERENCES drawing_areas(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Drawings
CREATE TABLE drawings (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id),
  area_id BIGINT REFERENCES drawing_areas(id),
  drawing_number TEXT,
  title TEXT,
  discipline TEXT,
  current_revision TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Drawing Revisions
CREATE TABLE drawing_revisions (
  id BIGINT PRIMARY KEY,
  drawing_id BIGINT REFERENCES drawings(id),
  revision_number TEXT,
  file_url TEXT,
  received_date DATE,
  created_at TIMESTAMPTZ
);

-- Drawing Sets
CREATE TABLE drawing_sets (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ
);

-- Drawing Markups/Annotations
CREATE TABLE drawing_markups (
  id BIGINT PRIMARY KEY,
  drawing_id BIGINT REFERENCES drawings(id),
  revision_id BIGINT REFERENCES drawing_revisions(id),
  user_id BIGINT REFERENCES users(id),
  markup_type TEXT, -- 'annotation', 'cloud', 'arrow', 'text', etc.
  markup_data JSONB,
  created_at TIMESTAMPTZ
);
```

### Frontend Components Needed
1. **DrawingAreaTree** - Hierarchical folder navigation
2. **DrawingsRevisionsList** - Main table with filtering/sorting
3. **DrawingViewer** - Full-page viewer with pan/zoom
4. **MarkupToolbar** - Annotation tools (cloud, arrow, text, etc.)
5. **DrawingInfoPanel** - Metadata sidebar
6. **DrawingQRCode** - QR code generator
7. **DrawingCompare** - Side-by-side revision comparison

### API Endpoints Needed
- `GET /projects/{id}/drawing_areas`
- `GET /projects/{id}/drawings`
- `GET /drawing_areas/{id}/drawings`
- `GET /drawings/{id}/revisions`
- `POST /drawings` (upload)
- `PUT /drawings/{id}`
- `DELETE /drawings/{id}`
- `GET /drawings/{id}/markups`
- `POST /drawings/{id}/markups`

## Output Locations

```
documentation/*project-mgmt/in-progress/drawings/crawl-drawings/
├── pages/
│   ├── drawings-areas/
│   ├── drawings-areas_dropdown_1/
│   ├── drawings-drawings/
│   ├── drawings-revisions/
│   ├── drawings-revisions_dropdown_1/
│   ├── drawings-revisions_dropdown_2/
│   ├── drawings-viewer-fullscreen/
│   ├── drawings-viewer-fullscreen_dropdown_1/
│   ├── drawings-viewer-fullscreen_dropdown_3/
│   ├── drawings-viewer-fullscreen_dropdown_4/
│   └── drawings-viewer-fullscreen_tab_qr_code/
├── reports/
│   └── (to be generated)
├── crawl-manifest.json
├── visitedUrls.json
└── DRAWINGS-CRAWL-STATUS.md
```

## Known Issues

1. **Modal Overlay Blocking** - Procore's `StyledModalScrim` component blocks some tab clicks in the fullscreen viewer. The Markup, Filter, Info, Search, and Activity tabs could not be fully captured due to this overlay.

2. **Non-Drawings Pages** - Some non-drawings pages (meetings, home) were captured before the strict URL filter was applied. These can be ignored.

## Next Steps

1. Review screenshots in `pages/drawings-revisions/screenshot.png` for main UI reference
2. Review fullscreen viewer in `pages/drawings-viewer-fullscreen/screenshot.png` for markup tools
3. Use dropdown screenshots for menu item references
4. Design database schema based on observed data structures
5. Build frontend components matching Procore's UI patterns
