# ExportDialog Component

## Overview
Modal dialog component for exporting direct costs data with customizable options.

## Location
`/frontend/src/components/direct-costs/ExportDialog.tsx`

## Features
- **Format Selection**: CSV (Excel-compatible) or PDF (Printable report)
- **Template Selection**:
  - Standard - All fields included
  - Accounting - Financial focus
  - Summary - High-level overview
- **Include Line Items**: Toggle to include/exclude line item details
- **Filter Support**: Automatically applies current filters from the table
- **Loading States**: Visual feedback during export
- **Error Handling**: User-friendly error messages
- **File Download**: Automatic file download with proper naming

## Props

```typescript
interface ExportDialogProps {
  isOpen: boolean;           // Controls dialog visibility
  onClose: () => void;       // Callback when dialog closes
  projectId: string;         // Project ID for API call
  filters?: DirectCostFilter; // Optional filters to apply
}
```

## Usage Example

```tsx
import { ExportDialog } from '@/components/direct-costs';

function DirectCostsPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [filters, setFilters] = useState<DirectCostFilter>({});

  return (
    <>
      <Button onClick={() => setIsExportOpen(true)}>
        Export Direct Costs
      </Button>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectId={projectId}
        filters={filters}
      />
    </>
  );
}
```

## API Endpoint

The component calls the following endpoint:

```
POST /api/projects/[projectId]/direct-costs/export
```

**Request Body:**
```json
{
  "format": "csv" | "pdf",
  "template": "standard" | "accounting" | "summary",
  "include_line_items": boolean,
  "filters": {
    "status": "Draft" | "Approved" | "Rejected" | "Paid",
    "cost_type": "Expense" | "Invoice" | "Subcontractor Invoice",
    "date_from": "YYYY-MM-DD",
    "date_to": "YYYY-MM-DD",
    "amount_min": number,
    "amount_max": number,
    "search": string
  }
}
```

**Response:**
- Content-Type: `text/csv` or `application/pdf`
- Content-Disposition: `attachment; filename="direct-costs-YYYY-MM-DD.{csv|pdf}"`

## Accessibility

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support via ARIA labels
- ✅ Focus management (Radix UI Dialog)
- ✅ Error announcements
- ✅ Proper label associations
- ✅ WCAG AA color contrast

## Performance

- ✅ Minimal re-renders with targeted state updates
- ✅ Automatic cleanup of blob URLs
- ✅ State reset on dialog close
- ✅ Loading states prevent duplicate submissions

## Dependencies

- `@radix-ui/react-dialog` - Dialog primitives
- `lucide-react` - Icons (FileDown, Loader2)
- `zod` - Schema validation (via DirectCostExportSchema)

## Next Steps

1. **Backend Implementation**: Create the export API endpoint at `/api/projects/[id]/direct-costs/export/route.ts`
2. **CSV Generation**: Implement CSV export logic
3. **PDF Generation**: Implement PDF export logic (consider using jsPDF or Puppeteer)
4. **Testing**: Add Playwright test for export functionality
5. **Integration**: Add export button to DirectCostTable header

## Status

✅ Component created
✅ TypeScript compiles without errors
✅ Exported from barrel file
⏳ Awaiting backend API implementation
⏳ Awaiting integration into DirectCostTable
⏳ Awaiting E2E tests
