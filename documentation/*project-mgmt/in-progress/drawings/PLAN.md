# Drawings Feature Plan

- Pages/Routes: `/[projectId]/drawings` using `ProjectToolPage` layout
- API Endpoints: None (use client-side mock data for now)
- Database Tables: None (model drawing areas, drawings, revisions, sketches, download logs in memory)
- UI Components/Patterns: Cards, table layout, filters (search/select), tabs, dropdown menus, dialogs, badges, inputs, textarea, file placeholder, viewer modal with sample image, QR code modal (icon-based)
- Tests: Playwright e2e covering navigation, filtering, viewer modal, tab interactions, sketch creation validation, and email form rendering
