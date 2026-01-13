# Procore Drawings Crawl Sitemap

**Generated:** 2026-01-12
**Total Drawings Pages:** 11

## Drawings-Specific Pages

| Page Name | Role | Description | Screenshot |
|-----------|------|-------------|------------|
| drawings-areas | areas-list | Folder/area navigation | [View](../pages/drawings-areas/screenshot.png) |
| drawings-areas_dropdown_1 | dropdown | Area actions menu | [View](../pages/drawings-areas_dropdown_1/screenshot.png) |
| drawings-drawings | drawings-list | Main drawings entry | [View](../pages/drawings-drawings/screenshot.png) |
| drawings-revisions | revisions-list | Main revisions table (38 buttons, 62 links) | [View](../pages/drawings-revisions/screenshot.png) |
| drawings-revisions_dropdown_1 | dropdown | **Reports** menu (3 items) | [View](../pages/drawings-revisions_dropdown_1/screenshot.png) |
| drawings-revisions_dropdown_2 | dropdown | **Export** menu (2 items) | [View](../pages/drawings-revisions_dropdown_2/screenshot.png) |
| drawings-viewer-fullscreen | viewer | Fullscreen viewer with markup (15 clickables, 7 tabs) | [View](../pages/drawings-viewer-fullscreen/screenshot.png) |
| drawings-viewer-fullscreen_dropdown_1 | dropdown | Viewer menu 1 | [View](../pages/drawings-viewer-fullscreen_dropdown_1/screenshot.png) |
| drawings-viewer-fullscreen_dropdown_3 | dropdown | Viewer menu 3 | [View](../pages/drawings-viewer-fullscreen_dropdown_3/screenshot.png) |
| drawings-viewer-fullscreen_dropdown_4 | dropdown | Viewer menu 4 | [View](../pages/drawings-viewer-fullscreen_dropdown_4/screenshot.png) |
| drawings-viewer-fullscreen_tab_qr_code | tab | QR Code tab view | [View](../pages/drawings-viewer-fullscreen_tab_qr_code/screenshot.png) |

## Key UI Elements Found

### Revisions List (`drawings-revisions`)
- 38 buttons
- 37 input fields
- 117 icons
- 2 markup tools
- Reports dropdown (3 options)
- Export dropdown (2 options)

### Fullscreen Viewer (`drawings-viewer-fullscreen`)
- 15 clickable elements
- 10 dropdown triggers
- 7 tabs: QR Code, Markup, Filter, Info, Search, Activity
- Canvas/viewport for drawing display
- Markup toolbar

## URLs for Implementation Reference

| Feature | URL Pattern |
|---------|-------------|
| Areas List | `/tools/drawings/areas` |
| Revisions | `/tools/drawings/areas/{areaId}/revisions` |
| Drawing Sets | `/drawing_log/drawing_sets` |
| Trash | `/drawing_log/deletion_log` |
| Configure | `/drawing_log/configure_tab` |
| Fullscreen Viewer | `/drawing_log/view_fullscreen/{drawingId}` |
