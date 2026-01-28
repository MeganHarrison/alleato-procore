# Commitments UI Components Specification

## Component Specifications

### 1. CommitmentsListPage
**File**: `/frontend/src/app/(main)/[projectId]/commitments/page.tsx`
**Purpose**: Main list view with advanced table features matching Procore
**Status**: ✅ Complete
**Screenshot Reference**: `procore-crawl-output/pages/commitments/screenshot.png`

#### Props Interface
```typescript
interface CommitmentsListPageProps {
  params: {
    projectId: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    type?: string;
    companyId?: string;
  };
}
```

#### Layout Structure
```
┌─ Page Header ──────────────────────────────────────────────┐
│ Commitments                           [Create ▼] [More ▼] │
│ 127 total commitments                                      │
└────────────────────────────────────────────────────────────┘
┌─ Filters Panel ──────────────────────────────────────────┐
│ [Search: ___________] [Status: All ▼] [Type: All ▼]      │
│ [Company: All ▼] [Show Executed ☐] [Show Private ☐]      │
└────────────────────────────────────────────────────────────┘
┌─ Data Table ─────────────────────────────────────────────┐
│ ☐ # ↕ │ Title ↕ │ Company ↕ │ Status ↕ │ Type │ Amount ↕ │
├────────┼─────────┼───────────┼──────────┼──────┼─────────┤
│ ☐ SC01 │ Found..│ ABC Corp  │ Approved │ SC   │ $150K   │
│ ☐ PO02 │ Steel..│ XYZ Steel │ Executed │ PO   │ $75K    │
├────────┼─────────┼───────────┼──────────┼──────┼─────────┤
│        │ TOTALS  │           │          │      │ $225K   │
└────────┴─────────┴───────────┴──────────┴──────┴─────────┘
┌─ Pagination ──────────────────────────────────────────────┐
│ Showing 1-20 of 127        [◄] [1] 2 3 ... 7 [►]        │
└────────────────────────────────────────────────────────────┘
```

#### Key Features
- **Advanced Table**: TanStack Table with sorting, filtering, grouping
- **Column Configuration**: Show/hide columns, reorder (planned)
- **Row Selection**: Bulk operations on selected commitments
- **Grand Totals**: Aggregated financial summaries
- **Export Options**: CSV, PDF, Excel (planned)
- **Real-time Search**: Debounced search with highlighting

### 2. CommitmentDetailPage
**File**: `/frontend/src/app/(main)/[projectId]/commitments/[commitmentId]/page.tsx`
**Purpose**: Complete detail view with tabbed interface
**Status**: ✅ Complete (6 tabs, 29 tests passing)
**Screenshot Reference**: `procore-crawl-output/pages/562949957166626/screenshot.png`

#### Props Interface
```typescript
interface CommitmentDetailPageProps {
  params: {
    projectId: string;
    commitmentId: string;
  };
}
```

#### Layout Structure
```
┌─ Detail Header ──────────────────────────────────────────┐
│ ← Back to Commitments                                    │
│ SC-001: Foundation Work                   [Edit] [▼More] │
│ ABC Construction • Created 2024-01-15 • Draft           │
└────────────────────────────────────────────────────────────┘
┌─ Financial Summary Cards ────────────────────────────────┐
│ ┌─Original─┐ ┌─Approved─┐ ┌─Revised──┐ ┌─Invoiced─┐     │
│ │ $150,000 │ │  $25,000 │ │ $175,000 │ │  $87,500 │     │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
│ ┌─Payments─┐ ┌─% Paid──┐ ┌─Remaining┐               │
│ │  $75,000 │ │    43%   │ │ $100,000 │               │
│ └─────────┘ └─────────┘ └─────────┘               │
└────────────────────────────────────────────────────────────┘
┌─ Tabbed Content ──────────────────────────────────────────┐
│ [Overview] [Financial] [Schedule] [COs] [Invoices] [Files]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│ [Tab content area with dynamic loading]                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 3. CommitmentDetailHeader
**File**: `/frontend/src/components/commitments/CommitmentDetailHeader.tsx`
**Purpose**: Header section with commitment info and actions
**Status**: ✅ Complete

#### Props Interface
```typescript
interface CommitmentDetailHeaderProps {
  commitment: {
    id: string;
    contractNumber: string;
    title: string;
    status: string;
    companyName: string;
    createdAt: string;
    isPrivate: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onEmail: () => void;
  onDownloadPdf: () => void;
  showActions?: boolean;
}
```

### 4. CommitmentTabs
**File**: `/frontend/src/components/commitments/CommitmentTabs.tsx`
**Purpose**: Tab navigation and content switching
**Status**: ✅ Complete with 6 tabs

#### Props Interface
```typescript
interface CommitmentTabsProps {
  commitmentId: string;
  commitmentType: 'subcontract' | 'purchase_order';
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}
```

### 5. OverviewTab
**File**: `/frontend/src/components/commitments/tabs/OverviewTab.tsx`
**Purpose**: General information display (dates, scope, description)
**Status**: ✅ Complete

#### Layout Structure
```
┌─ Contract Information ───────────────────────────────────┐
│ Contract #: SC-001                                       │
│ Status: Draft                     Company: ABC Corp     │
│ Executed: No                      Private: Yes           │
└────────────────────────────────────────────────────────────┘
┌─ Dates ──────────────────────────────────────────────────┐
│ Start Date: 02/01/2024           Contract Date: 01/15/24 │
│ Est. Completion: 04/30/2024      Signed Received: -     │
│ Actual Completion: -             Issued On: 01/16/24    │
└────────────────────────────────────────────────────────────┘
┌─ Scope ──────────────────────────────────────────────────┐
│ Description:                                             │
│ Foundation work including excavation, rebar placement,   │
│ concrete pouring and finishing.                         │
│                                                          │
│ Inclusions:                                             │
│ • Site preparation and layout                           │
│ • All materials and equipment                           │
│                                                          │
│ Exclusions:                                             │
│ • Permit fees and inspections                           │
│ • Utility connections                                    │
└────────────────────────────────────────────────────────────┘
```

### 6. FinancialTab
**File**: `/frontend/src/components/commitments/tabs/FinancialTab.tsx`
**Purpose**: Financial metrics and calculations (Alleato enhancement)
**Status**: ✅ Complete

#### Layout Structure
```
┌─ Financial Overview ─────────────────────────────────────┐
│ ┌─ Costs ──────────────────┐ ┌─ Revenue ─────────────────┐ │
│ │ Original Amount  $150,000│ │ Billed to Date   $87,500 │ │
│ │ Change Orders     $25,000│ │ Payments Received $75,000│ │
│ │ Revised Total    $175,000│ │ Outstanding       $12,500│ │
│ └──────────────────────────┘ └───────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
┌─ Cash Flow Projection ───────────────────────────────────┐
│ [Chart showing payment schedule and projected cash flow] │
└────────────────────────────────────────────────────────────┘
┌─ Retainage Tracking ─────────────────────────────────────┐
│ Current Rate: 10%        Total Held: $17,500            │
│ Completed Work: $100,000  Released: $7,500              │
│ Available Release: $2,500                               │
└────────────────────────────────────────────────────────────┘
```

### 7. ScheduleTab
**File**: `/frontend/src/components/commitments/tabs/ScheduleTab.tsx`
**Purpose**: Schedule of Values line items management
**Status**: ✅ Complete with inline editing

#### Layout Structure
```
┌─ Schedule of Values ─────────────────────────────────────┐
│ [+ Add Line Item]                    Total: $175,000     │
│                                                          │
│ ┌───┬──────────┬─────────────────┬─────────┬──────────┐   │
│ │ # │Code      │ Description     │ Amount  │ Actions  │   │
│ ├───┼──────────┼─────────────────┼─────────┼──────────┤   │
│ │ 1 │01-100    │ Site prep work  │ $75,000 │ [Edit] X │   │
│ │ 2 │01-200    │ Concrete work   │$100,000 │ [Edit] X │   │
│ │ + │[Select]▼ │ [Description]   │ [$____] │ [Save]   │   │
│ └───┴──────────┴─────────────────┴─────────┴──────────┘   │
│                                                          │
│ Billed Summary:                                          │
│ Total SOV: $175,000  Billed: $87,500  Remaining: $87,500│
└────────────────────────────────────────────────────────────┘
```

### 8. ChangeOrdersTab
**File**: `/frontend/src/components/commitments/tabs/ChangeOrdersTab.tsx`
**Purpose**: Display related change orders with links
**Status**: ✅ Complete with tests

#### Props Interface
```typescript
interface ChangeOrdersTabProps {
  commitmentId: string;
}
```

#### Layout Structure
```
┌─ Change Orders ──────────────────────────────────────────┐
│ ┌───────┬─────────────────┬──────────┬─────────┬───────┐  │
│ │Number │ Title           │ Status   │ Amount  │ Date  │  │
│ ├───────┼─────────────────┼──────────┼─────────┼───────┤  │
│ │CCO-001│ Extra excavation│ Approved │ $15,000 │ 2/15  │  │
│ │CCO-002│ Foundation depth│ Pending  │ $10,000 │ 2/20  │  │
│ │CCO-003│ Concrete additiv│ Draft    │  $5,000 │ 2/22  │  │
│ └───────┴─────────────────┴──────────┴─────────┴───────┘  │
│                                                          │
│ Summary: 3 change orders totaling $30,000               │
│ Approved: $15,000 • Pending: $10,000 • Draft: $5,000   │
└────────────────────────────────────────────────────────────┘
```

### 9. InvoicesTab
**File**: `/frontend/src/components/commitments/tabs/InvoicesTab.tsx`
**Purpose**: Display related invoices with payment tracking
**Status**: ✅ Complete with totals card

#### Layout Structure
```
┌─ Invoice Summary ────────────────────────────────────────┐
│ ┌─ Total Invoiced ─┐ ┌─ Total Paid ──┐ ┌─ Remaining ──┐ │
│ │    $87,500       │ │   $75,000     │ │   $12,500    │ │
│ └──────────────────┘ └───────────────┘ └──────────────┘ │
└────────────────────────────────────────────────────────────┘
┌─ Invoice History ────────────────────────────────────────┐
│ ┌──────┬──────────┬─────────┬─────────┬──────────┬──────┐ │
│ │Number│ Date     │ Amount  │ Paid    │ Status   │Action│ │
│ ├──────┼──────────┼─────────┼─────────┼──────────┼──────┤ │
│ │INV001│ 01/31/24 │ $37,500 │ $37,500 │ Paid     │ View │ │
│ │INV002│ 02/29/24 │ $50,000 │ $37,500 │ Partial  │ View │ │
│ └──────┴──────────┴─────────┴─────────┴──────────┴──────┘ │
│                                                          │
│ Average Days to Payment: 14 days                        │
└────────────────────────────────────────────────────────────┘
```

### 10. AttachmentsTab
**File**: `/frontend/src/components/commitments/tabs/AttachmentsTab.tsx`
**Purpose**: File attachment management with upload/download
**Status**: ✅ Complete with drag-drop upload

#### Layout Structure
```
┌─ File Upload ────────────────────────────────────────────┐
│                     📎                                   │
│         Drop files here or click to browse               │
│      Supported: PDF, DOC, XLS, JPG, PNG (10MB max)     │
│                [Browse Files]                            │
└────────────────────────────────────────────────────────────┘
┌─ Attached Files ─────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 📄 contract-signed.pdf                              │  │
│ │ 2.1MB • Uploaded 2024-01-15 by John Smith          │  │
│ │ Contract document                    [⬇] [🗑]       │  │
│ └─────────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 📊 specifications.xlsx                              │  │
│ │ 856KB • Uploaded 2024-01-16 by Jane Doe           │  │
│ │ Technical specifications             [⬇] [🗑]       │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ Total: 4 files (5.2MB)                                  │
└────────────────────────────────────────────────────────────┘
```

### 11. SubcontractForm
**File**: `/frontend/src/components/commitments/SubcontractForm.tsx`
**Purpose**: Create/edit form for subcontracts with all Procore fields
**Status**: ✅ Basic version complete, needs enhancement

#### Form Sections Layout
```
┌─ Create Subcontract ─────────────────────────────────────┐
│                                                          │
│ ┌─ Basic Information ─────────────────────────────────┐  │
│ │ Title* [________________________________]         │  │
│ │ Status [Draft ▼]   Company* [Select... ▼]         │  │
│ │ Contract # [SC-001] (auto-generated)               │  │
│ │ Description [Rich text editor area...]             │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Settings & Dates ──────────────────────────────────┐  │
│ │ ☑ Executed  ☑ Private   Retainage [10]%           │  │
│ │ Method: ● Amount-based ○ Unit/Quantity             │  │
│ │                                                     │  │
│ │ Start [01/15/24] Est.Complete [04/30/24]          │  │
│ │ Contract Date [01/15/24] Signed Rcvd [____]       │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Scope (Rich Text) ─────────────────────────────────┐  │
│ │ Inclusions: [Rich text editor...]                  │  │
│ │ Exclusions: [Rich text editor...]                  │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ Access Control ────────────────────────────────────┐  │
│ │ Non-Admin Users [Multi-select users...]            │  │
│ │ ☐ Allow Non-Admins to View SOV                     │  │
│ │ Invoice Contacts [Multi-select contacts...]        │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ [SOV Line Items Section - embedded component]           │
│ [Attachments Section - embedded component]              │
│                                                          │
│           [Cancel]    [Save Draft]    [Submit]          │
└────────────────────────────────────────────────────────────┘
```

### 12. PurchaseOrderForm
**File**: `/frontend/src/components/commitments/PurchaseOrderForm.tsx`
**Purpose**: Create/edit form for purchase orders with PO-specific fields
**Status**: ✅ Basic version complete

#### Additional PO Sections
```
┌─ Shipping & Terms ───────────────────────────────────────┐
│ Ship To:    [Text area for shipping address...]         │
│ Ship Via:   [FedEx Ground ▼]                           │
│ Bill To:    [Text area for billing address...]          │
│ Delivery:   [03/15/24]   Payment: [Net 30 days]       │
│ Assigned:   [Select User ▼]                             │
└────────────────────────────────────────────────────────────┘
```

### 13. SOVLineItemsEditor
**File**: `/frontend/src/components/commitments/SOVLineItemsEditor.tsx`
**Purpose**: Inline editing of schedule of values with budget code integration
**Status**: ✅ Complete with CRUD operations

#### Props Interface
```typescript
interface SOVLineItemsEditorProps {
  commitmentId: string;
  commitmentType: 'subcontract' | 'purchase_order';
  items: SOVLineItem[];
  onItemsChange: (items: SOVLineItem[]) => void;
  readOnly?: boolean;
  showBudgetCodes?: boolean;
}

interface SOVLineItem {
  id?: string;
  lineNumber: number;
  budgetCodeId: string;
  description: string;
  amount: number;
  billedToDate?: number;
  amountRemaining?: number;
  // PO specific
  quantity?: number;
  unitCost?: number;
  unitOfMeasure?: string;
}
```

### 14. AttachmentsManager
**File**: `/frontend/src/components/commitments/AttachmentsManager.tsx`
**Purpose**: File upload, preview, and management with Supabase storage
**Status**: ✅ Complete with drag-drop

#### Props Interface
```typescript
interface AttachmentsManagerProps {
  commitmentId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFileSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
  maxFiles?: number;
  readOnly?: boolean;
}

interface Attachment {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  downloadUrl: string;
  description?: string;
}
```

### 15. CommitmentSettingsPage
**File**: `/frontend/src/app/(main)/[projectId]/commitments/configure/page.tsx`
**Purpose**: Project-level commitment configuration
**Status**: ❌ Not implemented (81 Procore settings)

#### Layout Structure
```
┌─ Commitment Settings ────────────────────────────────────┐
│                                                          │
│ ┌─ Tabs ──────────────────────────────────────────────┐  │
│ │ [General] [Distribution] [Defaults] [Billing]      │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ [Dynamic tab content based on selection]                │
│                                                          │
│ ┌─ Actions ───────────────────────────────────────────┐  │
│ │                     [Cancel] [Save Settings]       │  │
│ └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Responsive Design Details

### Breakpoint Strategy
```scss
// Tailwind breakpoints used throughout
$mobile: 640px;    // sm:
$tablet: 768px;    // md:
$desktop: 1024px;  // lg:
$wide: 1280px;     // xl:
```

### Mobile Adaptations

#### List Page Mobile
```
┌─ Mobile List ────────┐
│ Commitments    [☰]   │
│ [Search.........]    │
│ [Filters ▼]          │
│                      │
│ ┌─ Card ───────────┐ │
│ │ SC-001           │ │
│ │ Foundation Work  │ │
│ │ ABC Corp • Draft │ │
│ │ $150,000        │ │
│ │ [View] [Edit]   │ │
│ └──────────────────┘ │
│                      │
│ ┌─ Card ───────────┐ │
│ │ PO-002          │ │
│ │ Steel Materials │ │
│ │ XYZ Steel • Exec│ │
│ │ $75,000         │ │
│ │ [View] [Edit]   │ │
│ └──────────────────┘ │
└──────────────────────┘
```

#### Detail Page Mobile
```
┌─ Mobile Detail ──────┐
│ ← Foundation Work    │
│ SC-001 • Draft       │
│                      │
│ ┌─ Summary ────────┐ │
│ │ Original $150K   │ │
│ │ Revised  $175K   │ │
│ │ Invoiced $87K    │ │
│ │ Paid     $75K    │ │
│ └──────────────────┘ │
│                      │
│ ┌─ Tabs ──────────┐  │
│ │[Overview][More▼]│  │
│ └─────────────────┘  │
│                      │
│ [Tab content...]     │
└──────────────────────┘
```

## State Management Patterns

### Page-Level State
```typescript
// List page state
interface CommitmentsListState {
  commitments: Commitment[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  selectedIds: string[];
  pagination: PaginationState;
  sortState: SortState;
}

// Detail page state
interface CommitmentDetailState {
  commitment: Commitment | null;
  activeTab: string;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
}
```

### Form State Management
```typescript
// Using React Hook Form + Zod
const commitmentForm = useForm<CommitmentFormData>({
  resolver: zodResolver(commitmentSchema),
  defaultValues: {
    title: '',
    status: 'draft',
    isPrivate: true,
    accountingMethod: 'amount_based',
    sovItems: [],
  },
});

// Auto-save draft functionality
useEffect(() => {
  const timer = setTimeout(() => {
    if (commitmentForm.formState.isDirty) {
      saveDraft(commitmentForm.getValues());
    }
  }, 5000);

  return () => clearTimeout(timer);
}, [commitmentForm.watch()]);
```

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical flow through form fields and interactive elements
- **Skip Links**: Direct navigation to main content areas
- **Focus Management**: Proper focus handling in modals and dynamic content

### Screen Reader Support
```typescript
// ARIA labels and descriptions
<input
  aria-label="Commitment title"
  aria-describedby="title-help"
  aria-invalid={!!errors.title}
  aria-required="true"
/>

// Status announcements
<div role="status" aria-live="polite">
  {saveStatus === 'saving' && 'Saving commitment...'}
  {saveStatus === 'saved' && 'Commitment saved successfully'}
</div>
```

### Color and Contrast
- **High Contrast**: All text meets WCAG AA standards (4.5:1 ratio)
- **Color Independence**: Information not conveyed by color alone
- **Focus Indicators**: Visible focus rings on all interactive elements

## Performance Considerations

### Optimization Strategies

#### List Page Optimizations
```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

// Memoized table rows
const CommitmentRow = memo(({ commitment }: { commitment: Commitment }) => {
  // Row rendering logic
});

// Debounced search
const debouncedSearch = useDebouncedCallback(
  (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  },
  300
);
```

#### Detail Page Optimizations
```typescript
// Lazy tab loading
const LazyChangeOrdersTab = lazy(() =>
  import('./tabs/ChangeOrdersTab').then(module => ({
    default: module.ChangeOrdersTab
  }))
);

// Suspense boundaries for each tab
<Suspense fallback={<TabSkeleton />}>
  <LazyChangeOrdersTab commitmentId={commitment.id} />
</Suspense>
```

#### Form Optimizations
```typescript
// Incremental validation
const validateField = useDebouncedCallback(
  async (field: string, value: any) => {
    try {
      await fieldSchema.parseAsync({ [field]: value });
      setFieldError(field, null);
    } catch (error) {
      setFieldError(field, error.message);
    }
  },
  500
);

// Optimistic updates
const handleSovItemUpdate = async (item: SOVLineItem) => {
  // Update UI immediately
  setSovItems(prev =>
    prev.map(existing =>
      existing.id === item.id ? { ...existing, ...item } : existing
    )
  );

  try {
    // Sync with server
    await updateSovItem(item);
  } catch (error) {
    // Revert on error
    setSovItems(prev => originalItems);
    showError('Failed to update line item');
  }
};
```

### Bundle Size Optimization
```typescript
// Code splitting by route
const CommitmentDetailPage = lazy(() => import('./detail/page'));
const CommitmentEditPage = lazy(() => import('./edit/page'));

// Tree shaking for large dependencies
import { formatCurrency } from '@/lib/utils/currency';
// Instead of: import * as utils from '@/lib/utils';
```

## Testing Strategy

### Component Testing
```typescript
// Example test for SOV editor
describe('SOVLineItemsEditor', () => {
  it('should add new line item', async () => {
    const onItemsChange = jest.fn();
    render(
      <SOVLineItemsEditor
        commitmentId="test-id"
        commitmentType="subcontract"
        items={[]}
        onItemsChange={onItemsChange}
      />
    );

    await userEvent.click(screen.getByText('Add Line Item'));
    await userEvent.selectOptions(
      screen.getByLabelText('Budget Code'),
      'budget-code-1'
    );
    await userEvent.type(
      screen.getByLabelText('Description'),
      'Test line item'
    );
    await userEvent.type(
      screen.getByLabelText('Amount'),
      '50000'
    );
    await userEvent.click(screen.getByText('Save'));

    expect(onItemsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        budgetCodeId: 'budget-code-1',
        description: 'Test line item',
        amount: 50000,
      })
    ]);
  });
});
```

### Visual Regression Testing
```typescript
// Playwright visual tests
test('commitment list page visual', async ({ page }) => {
  await page.goto('/projects/test-project/commitments');
  await page.waitForSelector('[data-testid="commitments-table"]');
  await expect(page).toHaveScreenshot('commitments-list.png');
});
```

### Accessibility Testing
```typescript
// Jest + axe-core integration
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('commitment form is accessible', async () => {
  const { container } = render(<SubcontractForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

This comprehensive UI specification provides complete implementation guidance for all Commitments components, ensuring consistent design, accessibility, and performance across the entire module.