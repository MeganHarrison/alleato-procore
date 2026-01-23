# Meetings Archive

This directory contains archived documentation that has been superseded by the standardized structure.

## Archived Files

### crawl-meetings/ (Archived: 2025-01-18)
- **Original Purpose**: Procore meetings feature crawl data and analysis
- **Content**: Screenshots, DOM analysis, and component metadata from Procore meetings tool
- **Superseded By**: Standardized 6-file structure in parent directory
- **Reason for Archive**: Information extracted and organized into standardized format

The crawl data was valuable for understanding Procore's meetings interface and has been incorporated into:
- **FORMS-Meetings.md** - Form specifications based on crawl analysis
- **UI-Meetings.md** - Component structure based on screenshots
- **API_ENDPOINTS-Meetings.md** - API design informed by crawl findings
- **SCHEMA-Meetings.md** - Database design supporting crawled features

## Accessing Archived Content

If you need to reference the original crawl data:
1. Navigate to `_archive/crawl-meetings/`
2. Review screenshots in `pages/{page-name}/screenshot.png`
3. Check component analysis in `pages/{page-name}/metadata.json`
4. See full reports in `reports/` directory

## Migration Notes

The following information was extracted from the crawl data:
- **Form Fields**: Identified from `pages/meeting_create/` and other form pages
- **UI Components**: Screenshots analyzed for layout and component structure
- **Navigation Patterns**: Link analysis used for API endpoint design
- **Feature Requirements**: Tutorial pages analyzed for feature specifications

The standardized documentation now provides a cleaner, more maintainable structure while preserving all the valuable insights from the original crawl data.