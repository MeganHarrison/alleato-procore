# Change Orders UI Components Specification

## Component Specifications

### 1. ChangeOrdersList
**File**: `frontend/src/app/(main)/[projectId]/change-orders/page.tsx`
**Purpose**: Main list view with filtering, sorting, and summary metrics
**Status**: 50% complete (basic table implemented, needs enhancement)

#### Props Interface
```typescript
interface ChangeOrdersListProps {
  projectId: string;
  initialFilters?: {
    status?: string;
    contractType?: string;
    packageId?: number;
  };
}
```

#### Current Implementation Features
- ✅ Basic data table with columns: Number, Title, Contract, Status, Amount, Due Date
- ✅ Tab navigation (All, Pending, Approved, Draft)
- ✅ Status badges with color coding
- ✅ Summary cards showing counts and totals
- ✅ Empty state with CTA
- ✅ Loading state

#### Required Enhancements
- ❌ Add missing columns: Date Initiated, Revision, Reviewer, Review Date
- ❌ Implement Prime vs Commitments tabs
- ❌ Add proper filtering system
- ❌ Implement CSV export functionality
- ❌ Create Reports dropdown menu
- ❌ Add package grouping view
- ❌ Implement bulk selection and actions
- ❌ Add search functionality

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                      Change Orders                         │
├─────────────────────────────────────────────────────────────┤
│ Summary Cards Row                                           │
│ [5 Pending/$45K] [8 Approved/$65K] [2 Rejected/$15K]      │
├─────────────────────────────────────────────────────────────┤
│ Tabs & Actions Row                                          │
│ [Prime] [Commitments] [All]    [Export▼] [Reports▼] [New+] │
├─────────────────────────────────────────────────────────────┤
│ Filters & Search Row                                        │
│ Status:[All▼] Package:[All▼] Reviewer:[All▼] [Search...] 🔍 │
├─────────────────────────────────────────────────────────────┤
│ Data Table                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ #  │Title    │Contract│Status │Amount │Due Date│Actions │ │
│ │────┼─────────┼────────┼───────┼───────┼────────┼────────│ │
│ │CO-1│Phase 1..│ABC Corp│Pending│$5,062 │05/27/25│[...]   │ │
│ │CO-2│Elect... │XYZ Elec│Draft  │$2,350 │06/01/25│[...]   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Pagination                                                  │
│ [← Prev] Page 1 of 3 [Next →]          25 per page [▼]     │
└─────────────────────────────────────────────────────────────┘
```

### 2. ChangeOrderCreateForm
**File**: `frontend/src/app/(main)/[projectId]/change-orders/new/page.tsx`
**Purpose**: Multi-step form for creating new change orders
**Status**: 5% complete (stub only)

#### Props Interface
```typescript
interface ChangeOrderCreateFormProps {
  projectId: string;
  initialData?: Partial<ChangeOrder>;
  onSuccess: (changeOrder: ChangeOrder) => void;
  onCancel: () => void;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Create Change Order                           Step 1 of 4  │
├─────────────────────────────────────────────────────────────┤
│ Progress Bar: ████████░░░░░░░░░░░░░░░░░░░░░░░░              │
├─────────────────────────────────────────────────────────────┤
│ Step Content Area                                           │
│                                                             │
│ [Dynamic content based on current step]                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Form Navigation                                             │
│                           [Cancel] [← Back] [Next Step →]  │
└─────────────────────────────────────────────────────────────┘
```

### 3. ChangeOrderDetail
**File**: `frontend/src/app/(main)/[projectId]/change-orders/[id]/page.tsx`
**Purpose**: Detailed view with editing, approval, and action capabilities
**Status**: Not implemented

#### Props Interface
```typescript
interface ChangeOrderDetailProps {
  changeOrderId: string;
  projectId: string;
  mode?: 'view' | 'edit';
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  CO-001: Phase 1 & 2 Changes                     [Edit] [▼] │
├─────────────────────────────────────────────────────────────┤
│ Status & Key Info Row                                       │
│ [APPROVED] PCO-001 │ $5,062.35 │ Due: 05/27 │ Reviewer: J.D│
├─────────────────────────────────────────────────────────────┤
│ Tab Navigation                                              │
│ [General] [Line Items] [Attachments] [Reviews] [History]   │
├─────────────────────────────────────────────────────────────┤
│ Tab Content Area                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │             [Dynamic tab content]                       │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Action Buttons                                              │
│ [Approve] [Reject] [Execute] [Generate PDF] [Email]        │
└─────────────────────────────────────────────────────────────┘
```

### 4. LineItemsTable
**File**: `frontend/src/components/domain/change-orders/LineItemsTable.tsx`
**Purpose**: Editable table for managing change order line items
**Status**: Not implemented

#### Props Interface
```typescript
interface LineItemsTableProps {
  lineItems: ChangeOrderLineItem[];
  onChange: (lineItems: ChangeOrderLineItem[]) => void;
  readOnly?: boolean;
  showTotals?: boolean;
}

interface ChangeOrderLineItem {
  id?: number;
  description: string;
  costCodeId?: number;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  extendedAmount: number;
  notes?: string;
}
```

#### Layout Structure
```
┌─ Line Items ────────────────────────────────────────────────┐
│                                              [Add Item +]  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │Desc        │Code    │Qty │UoM│Unit Price│Amount │Actions│ │
│ │────────────┼────────┼────┼───┼──────────┼───────┼───────│ │
│ │Site Work   │01-100  │100 │SF │ $15.00   │$1,500 │[🗑️]   │ │
│ │Materials   │02-200  │  1 │LS │$5,047    │$5,047 │[🗑️]   │ │
│ │[+ Add Row] │        │    │   │          │       │       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Subtotal: $6,547.00                                         │
│ Tax: $0.00                                                  │
│ Total: $6,547.00                                            │
└─────────────────────────────────────────────────────────────┘
```

### 5. ApprovalWorkflow
**File**: `frontend/src/components/domain/change-orders/ApprovalWorkflow.tsx`
**Purpose**: Multi-tier approval interface with review history
**Status**: Not implemented

#### Props Interface
```typescript
interface ApprovalWorkflowProps {
  changeOrder: ChangeOrder;
  reviews: ChangeOrderReview[];
  currentUserCanApprove: boolean;
  onApprove: (data: ApprovalData) => void;
  onReject: (data: RejectionData) => void;
}
```

#### Layout Structure
```
┌─ Approval Workflow ─────────────────────────────────────────┐
│                                                             │
│ Current Status: PENDING APPROVAL (Tier 1 of 2)             │
│                                                             │
│ ┌─ Tier 1: Project Manager ─────────────────────[PENDING]┐ │
│ │ Assigned: Dawson, Jesse                                │ │
│ │ Due: 05/27/2025                                        │ │
│ │ [Approve] [Reject] [Request Changes] [Delegate]        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Tier 2: Executive Approval ──────────────────[WAITING]┐ │
│ │ Assigned: TBD (after Tier 1)                          │ │
│ │ Due: TBD                                               │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ Review History:                                             │
│ • 05/13 - Created by Nick Jepson                          │
│ • 05/13 - Submitted for review                            │
│ • 05/25 - Pending approval from Dawson, Jesse             │
└─────────────────────────────────────────────────────────────┘
```

### 6. ChangeOrderPackages
**File**: `frontend/src/components/domain/change-orders/ChangeOrderPackages.tsx`
**Purpose**: Package-based organization and management
**Status**: Not implemented

#### Props Interface
```typescript
interface ChangeOrderPackagesProps {
  projectId: string;
  packages: ChangeOrderPackage[];
  selectedPackageId?: number;
  onPackageSelect: (packageId: number) => void;
}
```

#### Layout Structure
```
┌─ Change Order Packages ─────────────────────────────────────┐
│                                                             │
│ ┌─ PCO-001: Phase 1 Changes ─────────────────────[APPROVED]┐│
│ │ Total: $15,062.35 │ 3 Change Orders │ Due: 05/30/2025  ││
│ │                                                          ││
│ │ Change Orders:                                           ││
│ │ • CO-001: Carpet Installation ($7,500)      [APPROVED]  ││
│ │ • CO-002: Plumbing Work ($5,047)            [APPROVED]  ││
│ │ • CO-003: Electrical ($2,515)               [PENDING]   ││
│ │                                                          ││
│ │ [View Package] [Generate PDF] [Edit] [...]              ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─ PCO-002: Phase 2 Additions ───────────────────[PENDING]┐│
│ │ Total: $8,250.00 │ 2 Change Orders │ Due: 06/15/2025   ││
│ │ [View Package] [Edit] [...]                             ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ [+ New Package]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7. StatusBadge
**File**: `frontend/src/components/ui/status-badge.tsx`
**Purpose**: Consistent status indicators across all change order views
**Status**: ✅ Implemented (basic version exists)

#### Props Interface
```typescript
interface StatusBadgeProps {
  status: ChangeOrderStatus;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
}

type ChangeOrderStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'withdrawn';
```

#### Visual Design
```
Status Badge Variants:
┌─────────────────┐ ┌─────────┐ ┌──────────────────────────┐
│ 🟡 PENDING      │ │ PENDING │ │ 🟡 PENDING              │
│                 │ │         │ │ Awaiting Tier 1 Review  │
│ Default         │ │ Compact │ │ Detailed                │
└─────────────────┘ └─────────┘ └──────────────────────────┘
```

### 8. ExportDropdown
**File**: `frontend/src/components/domain/change-orders/ExportDropdown.tsx`
**Purpose**: Export options menu with CSV and PDF generation
**Status**: Not implemented

#### Props Interface
```typescript
interface ExportDropdownProps {
  selectedChangeOrders?: number[];
  projectId: string;
  filters?: ChangeOrderFilters;
}
```

#### Layout Structure
```
┌─ Export ▼ ──────────────────────────────────────────────────┐
│                                                             │
│ ┌─ Export Options ──────────────────────────────────────┐   │
│ │ 📄 Export to CSV                                      │   │
│ │ 📋 Export Selected to CSV                            │   │
│ │ ───────────────────────────                          │   │
│ │ 📃 Generate PDF (Single)                             │   │
│ │ 📑 Generate Package PDF                               │   │
│ │ ───────────────────────────                          │   │
│ │ 📊 Export Summary Report                              │   │
│ │ 📈 Export Budget Impact                               │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9. ReportsDropdown
**File**: `frontend/src/components/domain/change-orders/ReportsDropdown.tsx`
**Purpose**: Predefined reports and analytics access
**Status**: Not implemented

#### Props Interface
```typescript
interface ReportsDropdownProps {
  projectId: string;
  userRole: string;
}
```

#### Layout Structure
```
┌─ Reports ▼ ─────────────────────────────────────────────────┐
│                                                             │
│ ┌─ Standard Reports ────────────────────────────────────┐   │
│ │ 📊 Unexecuted Change Orders                          │   │
│ │ ⏰ Overdue Change Orders                              │   │
│ │ 📈 Budget Impact Summary                              │   │
│ │ ───────────────────────────                          │   │
│ │ 🏷️  Change Orders by Reason                          │   │
│ │ 👤 Change Orders by Reviewer                          │   │
│ │ 📅 Change Orders by Date Range                        │   │
│ │ ───────────────────────────                          │   │
│ │ ⚡ Quick Analytics Dashboard                          │   │
│ │ 🔧 Custom Report Builder                              │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 10. FileUploadZone
**File**: `frontend/src/components/domain/change-orders/FileUploadZone.tsx`
**Purpose**: Drag-and-drop file upload with progress tracking
**Status**: Not implemented

#### Props Interface
```typescript
interface FileUploadZoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  changeOrderId?: number;
}
```

#### Layout Structure
```
┌─ File Upload ───────────────────────────────────────────────┐
│                                                             │
│ ┌─ Drop Zone ───────────────────────────────────────────┐  │
│ │  📎 Drop files here or [Browse Files]                │  │
│ │                                                       │  │
│ │  Max 10 files, 50MB each                            │  │
│ │  Supported: PDF, DOC, JPG, PNG, DWG                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Upload Progress:                                            │
│ ┌─ spec_document.pdf (2.3 MB) ─────────────────[Complete]┐ │
│ │ ████████████████████████████████████████████ 100%    │ │
│ │ ✓ Uploaded and processed                              │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ site_photo.jpg (1.8 MB) ────────────────────[78%]─────┐ │
│ │ █████████████████████████████░░░░░░░░░░░ 78%          │ │
│ │ ⏳ Uploading...                                       │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Design Details

### Desktop Layout (≥1024px)
- Full table with all columns visible
- Side-by-side form layout for create/edit
- Expandable detail panels
- Multi-column package view

### Tablet Layout (768px - 1023px)
- Condensed table with priority columns
- Stacked form layout
- Collapsible sidebar panels
- Single-column package cards

### Mobile Layout (≤767px)
- Card-based list view instead of table
- Single-step form progression
- Full-screen modals
- Touch-optimized controls

### Mobile Card Layout Example
```
┌─────────────────────────────────────────┐
│ CO-001                          PENDING │
│ Phase 1 & 2 Changes - Full Scope       │
│                                         │
│ ABC Construction          $5,062.35     │
│ Due: 05/27/25            Reviewer: J.D  │
│                                         │
│ [View] [Approve] [...]                  │
├─────────────────────────────────────────┤
│ CO-002                            DRAFT │
│ Electrical Upgrades Phase 2            │
│                                         │
│ XYZ Electrical           $2,350.00      │
│ Due: 06/01/25           Reviewer: None  │
│                                         │
│ [Edit] [Submit] [...]                   │
└─────────────────────────────────────────┘
```

## State Management Patterns

### Global State (Zustand)
```typescript
interface ChangeOrderStore {
  // List state
  changeOrders: ChangeOrder[];
  packages: ChangeOrderPackage[];
  filters: ChangeOrderFilters;
  pagination: PaginationState;

  // UI state
  selectedIds: number[];
  isLoading: boolean;

  // Actions
  fetchChangeOrders: (projectId: string, filters?: ChangeOrderFilters) => void;
  createChangeOrder: (data: CreateChangeOrderData) => void;
  updateChangeOrder: (id: number, data: UpdateChangeOrderData) => void;
  approveChangeOrder: (id: number, data: ApprovalData) => void;
  setFilters: (filters: Partial<ChangeOrderFilters>) => void;
  toggleSelection: (id: number) => void;
}
```

### Form State (React Hook Form)
```typescript
// Multi-step form state management
const useChangeOrderForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const form = useForm<ChangeOrderFormData>();

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const goToStep = (step: number) => setCurrentStep(step);

  return { form, currentStep, nextStep, prevStep, goToStep };
};
```

## Performance Considerations

### Virtual Scrolling
- Implement virtual scrolling for large change order lists
- Lazy load line items and attachments
- Progressive loading for package contents

### Optimistic Updates
- Immediate UI feedback for status changes
- Rollback on API failure
- Conflict resolution for concurrent edits

### Caching Strategy
- React Query for server state management
- Cache invalidation on mutations
- Background refetch for stale data

### Bundle Optimization
- Code splitting for report components
- Lazy loading for PDF generation
- Dynamic imports for file upload

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow
- Arrow keys for table navigation
- Escape key to close modals
- Enter/Space for actions

### Screen Reader Support
- Proper heading hierarchy
- ARIA labels for all controls
- Table headers and descriptions
- Status announcements

### Visual Accessibility
- High contrast mode support
- Scalable fonts and controls
- Clear focus indicators
- Color + text for status

This comprehensive UI specification ensures a consistent, accessible, and performant user experience across all change order functionality while maintaining proper separation of concerns and reusable component patterns.