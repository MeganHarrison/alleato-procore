# Change Events UI Components Specification

## Reality Notes
- Every page that uses `[projectId]/change-events/[id]` currently calls `parseInt(params.id)` or `parseInt(changeEventId)` even though the backend stores UUIDs; the detail/edit views therefore request `/api/projects/.../change-events/NaN` and nothing renders until the parameter stays a string.
- The line item grid, attachments panel, and history drawer all depend on the same numeric `changeEventId`, so their API calls return empty lists and uploads cannot be verified until the ID parsing is fixed.
- Revenue values (`match_latest_cost`, `manual_entry`, etc.) and attachment payloads (`files` key) do not match the validation schema of the API, so the UI currently rejects submissions before the backend sees the data.
- The approval workflow component is wired to `/approvals` endpoints that do not exist and hard-codes numeric approver IDs, so it cannot submit or display real approvals.

## Component Specifications

### 1. ChangeEventsListPage
**File**: `/frontend/src/app/[projectId]/change-events/page.tsx`
**Purpose**: Main list view with filtering, sorting, and data table
**Screenshot**: Available in test documentation

#### Props Interface
```typescript
interface ChangeEventsListPageProps {
  params: {
    projectId: string;
  };
  searchParams?: {
    status?: string;
    page?: string;
    sort?: string;
    search?: string;
  };
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
├─────────────────────────────────────────────────────────────┤
│ Change Events               [Search] [Create New] [Filter] │
├─────────────────────────────────────────────────────────────┤
│ STATUS TABS                                                 │
│ [All] [Open] [Pending] [Approved] [Rejected] [Recycle]    │
├─────────────────────────────────────────────────────────────┤
│ DATA TABLE                                                  │
│ # │ Title           │ Type    │ Status │ ROM     │ Actions │
├───┼─────────────────┼─────────┼────────┼─────────┼─────────┤
│007│Foundation Work  │Owner    │Open    │$45,000  │⋯       │
│006│Electrical Rough │Design   │Pending │$12,000  │⋯       │
│005│Plumbing Changes │Owner    │Approved│$8,500   │⋯       │
├─────────────────────────────────────────────────────────────┤
│ PAGINATION                          [1] [2] [3] ... [10]   │
└─────────────────────────────────────────────────────────────┘
```

#### State Management
```typescript
interface ListPageState {
  changeEvents: ChangeEventSummary[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: FilterState;
  selectedTab: StatusTab;
}
```

> ⚠️ Reality: The table uses `ChangeEventsTableColumns` with `handleView`/`handleEdit`, but those callbacks simply `router.push` the `changeEvent.id` and the detail/edit pages immediately `parseInt` the route parameter, so navigation renders nothing unless the IDs are numeric.

### 2. ChangeEventForm
**File**: `/frontend/src/components/domain/change-events/ChangeEventForm.tsx`
**Purpose**: Main form component for create/edit operations
**Screenshot**: Form layout captured in test files

#### Props Interface
```typescript
interface ChangeEventFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ChangeEvent>;
  projectId: string;
  onSubmit: (data: ChangeEventFormData) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────┐
│ FORM HEADER                                 │
├─────────────────────────────────────────────┤
│ [General] [Revenue] [Line Items] [Files]    │
├─────────────────────────────────────────────┤
│ ACTIVE TAB CONTENT                          │
│                                             │
│ [Conditional sections based on tab]        │
│                                             │
├─────────────────────────────────────────────┤
│ FORM ACTIONS                                │
│                   [Cancel] [Save] [Submit] │
└─────────────────────────────────────────────┘
```

#### Component Architecture
```typescript
const ChangeEventForm = ({ mode, initialData, projectId, onSubmit, onCancel }: ChangeEventFormProps) => {
  // Form state and validation
  const form = useForm<ChangeEventFormData>({
    resolver: zodResolver(changeEventSchema),
    defaultValues: initialData
  });

  // Conditional rendering based on form state
  const showRevenueSection = form.watch('expectingRevenue');
  const selectedType = form.watch('type');

  return (
    <Form {...form}>
      <div className="space-y-6">
        <ChangeEventGeneralSection />
        {showRevenueSection && <ChangeEventRevenueSection />}
        <ChangeEventLineItemsGrid />
        <ChangeEventAttachmentsSection />
      </div>
    </Form>
  );
};
```

> ⚠️ Reality: The running implementation does not use React Hook Form; instead, `ChangeEventForm` manages its own `data`/`onChange` props and the new change event page submits via the `createChangeEvent` hook directly to Supabase, bypassing the API and never sending the revenue/attachment payload.

### 3. ChangeEventGeneralSection
**File**: `/frontend/src/components/domain/change-events/ChangeEventGeneralSection.tsx`
**Purpose**: Basic change event information fields
**Screenshot**: General section layout in form captures

#### Props Interface
```typescript
interface ChangeEventGeneralSectionProps {
  data: Partial<ChangeEventFormData>;
  onChange: (updates: Partial<ChangeEventFormData>) => void;
  errors?: Partial<Record<keyof ChangeEventFormData, string>>;
  projectId: number;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────┐
│ GENERAL INFORMATION                         │
├─────────────────┬───────────────────────────┤
│ Number          │ Title *                   │
│ [007]           │ [_____________________]   │
├─────────────────┼───────────────────────────┤
│ Type *          │ Reason *                  │
│ [Owner Change▼] │ [Design Development▼]     │
├─────────────────┼───────────────────────────┤
│ Scope *         │ Origin                    │
│ [Out of Scope▼] │ [Field▼]                  │
├─────────────────┴───────────────────────────┤
│ Description                                 │
│ [Text area - 2000 char limit]              │
│ 0/2000                                      │
└─────────────────────────────────────────────┘
```

#### Field Dependencies
```typescript
// Reason options depend on Type selection
const reasonOptions = useMemo(() => {
  const typeReasons = {
    'Owner Change': ['Scope Addition', 'Design Development', 'Owner Request'],
    'Design Change': ['Constructability', 'Code Compliance', 'Coordination'],
    'Allowance': ['Allowance Buyout', 'Unit Price Adjustment']
  };
  return typeReasons[selectedType] || [];
}, [selectedType]);
```

### 4. ChangeEventRevenueSection
**File**: `/frontend/src/components/domain/change-events/ChangeEventRevenueSection.tsx`
**Purpose**: Revenue configuration and prime contract selection
**Screenshot**: Revenue section toggle behavior

#### Props Interface
```typescript
interface ChangeEventRevenueSectionProps {
  data: Partial<ChangeEventFormData>;
  onChange: (updates: Partial<ChangeEventFormData>) => void;
  projectId: number;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────┐
│ REVENUE SETTINGS                            │
├─────────────────────────────────────────────┤
│ ☑ Expecting Revenue                         │
├─────────────────────────────────────────────┤
│ Revenue Source *                            │
│ [Match Revenue to Latest Cost ▼]            │
├─────────────────────────────────────────────┤
│ Prime Contract for Markup                   │
│ [Main Construction Contract ▼]              │
└─────────────────────────────────────────────┘
```

#### Conditional Display Logic
```typescript
const RevenueSection = ({ form, visible }: Props) => {
  if (!visible) return null;

  const revenueSource = form.watch('lineItemRevenueSource');
  const showPrimeContract = revenueSource === 'Percentage Markup';

  return (
    <div className="space-y-4">
      <FormField name="lineItemRevenueSource" />
      {showPrimeContract && <FormField name="primeContractId" />}
    </div>
  );
};
```

> ⚠️ Reality: The live component receives `data` and `onChange` props, not a `form`, and the options it renders are slug values (`match_latest_cost`, etc.) that must be translated into the backend's `LineItemRevenueSource` enum before submission.

### 5. ChangeEventLineItemsGrid
**File**: `/frontend/src/components/domain/change-events/ChangeEventLineItemsGrid.tsx`
**Purpose**: Editable data grid for line items with inline editing
**Screenshot**: Grid layout with add/edit/delete actions

#### Props Interface
```typescript
interface ChangeEventLineItemsGridProps {
  changeEventId?: string;
  lineItems: ChangeEventLineItem[];
  onUpdate: (items: ChangeEventLineItem[]) => void;
  readonly?: boolean;
  projectId: string;
}
```

> ⚠️ Reality: The grid hits `/api/projects/{projectId}/change-events/{changeEventId}/line-items`, but that endpoint currently casts `changeEventId` to an integer so no data is returned or saved until the API uses UUIDs.

#### Layout Structure
```
┌──────────────────────────────────────────────────────────────────────┐
│ LINE ITEMS                                           [+ Add Line Item] │
├────────┬─────────────┬──────────┬─────┬──────────┬─────────┬──────────┤
│ Budget │ Description │ Vendor   │ UOM │ Quantity │ Unit $  │ Extended │
│ Code   │             │          │     │          │         │ Amount   │
├────────┼─────────────┼──────────┼─────┼──────────┼─────────┼──────────┤
│01.01.01│Foundation   │ABC Corp  │ CY  │  150.00  │ 250.00  │ 37,500   │
│[Edit]  │Work         │[Select▼] │[EA▼]│[_______] │[______] │[Calc]    │
├────────┼─────────────┼──────────┼─────┼──────────┼─────────┼──────────┤
│        │             │          │     │          │         │          │
│[+ New] │             │          │     │          │         │          │
├────────┴─────────────┴──────────┴─────┴──────────┴─────────┼──────────┤
│                                                    TOTAL: │ 37,500   │
└────────────────────────────────────────────────────────────┴──────────┘

┌──────────┬─────────────┬──────────┬──────────┬─────────┐
│ Revenue  │ Cost ROM    │ Non-Comm │ Contract │ Actions │
│ ROM      │             │ Cost     │          │         │
├──────────┼─────────────┼──────────┼──────────┼─────────┤
│ 45,000   │   37,500    │  5,000   │ SC-001   │ ⋯ 🗑️   │
│[_______] │   [______]  │ [______] │[Select▼] │         │
├──────────┼─────────────┼──────────┼──────────┼─────────┤
│          │             │          │          │ + Add   │
├──────────┼─────────────┼──────────┼──────────┼─────────┤
│ 45,000   │   37,500    │  5,000   │          │         │
└──────────┴─────────────┴──────────┴──────────┴─────────┘
```

#### Grid Features
- **Inline Editing**: Click cells to edit directly
- **Add/Remove Rows**: Dynamic row management
- **Auto-calculations**: Extended amounts calculated on quantity/price changes
- **Drag-and-drop**: Reorder rows by dragging
- **Bulk Actions**: Select multiple rows for batch operations

#### State Management
```typescript
interface GridState {
  items: ChangeEventLineItem[];
  editingRow: number | null;
  selectedRows: Set<number>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  totals: LineItemTotals;
}

const useLineItemsGrid = () => {
  const [state, setState] = useState<GridState>(initialState);

  const addRow = useCallback(() => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, createEmptyLineItem()],
      editingRow: prev.items.length
    }));
  }, []);

  const updateRow = useCallback((index: number, data: Partial<ChangeEventLineItem>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...data } : item
      ),
      totals: calculateTotals(updatedItems)
    }));
  }, []);

  return { state, addRow, updateRow, deleteRow, reorderRows };
};
```

### 6. ChangeEventAttachmentsSection
**File**: `/frontend/src/components/domain/change-events/ChangeEventAttachmentsSection.tsx`
**Purpose**: File upload and attachment management
**Screenshot**: File upload interface and attachment list

#### Props Interface
```typescript
interface ChangeEventAttachmentsSectionProps {
  changeEventId?: string;
  attachments: ChangeEventAttachment[];
  onUpload: (files: FileList) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  maxFileSize?: number; // bytes
  allowedTypes?: string[];
  readonly?: boolean;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────┐
│ ATTACHMENTS                                 │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │     📎 Drop files here or click         │ │
│ │        to browse                        │ │
│ │                                         │ │
│ │ Supported: PDF, DOC, XLS, JPG, PNG     │ │
│ │ Max size: 10 MB per file               │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ UPLOADED FILES                              │
├─────────────────────────────────────────────┤
│ 📄 foundation-specs.pdf       2.1 MB  [×]  │
│ 📷 site-photo-01.jpg         856 KB  [×]  │
│ 📊 cost-estimate.xlsx        1.3 MB  [×]  │
└─────────────────────────────────────────────┘
```

#### File Upload Features
- **Drag-and-drop**: Drop zone for easy file uploads
- **File Validation**: Size and type restrictions
- **Progress Indicators**: Upload progress with cancel option
- **Preview**: Thumbnail/preview for images
- **Download**: Direct download links
- **Security**: Virus scanning and secure storage

> ⚠️ Reality: The current attachment code posts the files under the `files` key and the API casts `changeEventId` to an integer before querying, so uploads and downloads never succeed until the payload shape and ID handling match the backend.

### 7. ChangeEventsTableColumns
**File**: `/frontend/src/components/domain/change-events/ChangeEventsTableColumns.tsx`
**Purpose**: Table column definitions for data table
**Screenshot**: Table layout with sorting and actions

#### Column Configuration
```typescript
export const changeEventsTableColumns: ColumnDef<ChangeEventSummary>[] = [
  {
    accessorKey: "number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="#" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs">
        {row.getValue("number")}
      </div>
    ),
    meta: { width: "60px" }
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const changeEvent = row.original;
      return (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">
            {changeEvent.title}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {changeEvent.origin && `Origin: ${changeEvent.origin}`}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("type")}
      </Badge>
    ),
    meta: { width: "120px" }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={getStatusVariant(status)}>
          {status}
        </Badge>
      );
    },
    meta: { width: "100px" }
  },
  // Revenue ROM, Cost ROM, Actions columns...
];
```

### 8. ChangeEventApprovalWorkflow
**File**: `/frontend/src/components/domain/change-events/ChangeEventApprovalWorkflow.tsx`
**Purpose**: Approval process management and status display
**Screenshot**: Approval workflow interface

#### Props Interface
```typescript
interface ChangeEventApprovalWorkflowProps {
  changeEvent: ChangeEvent;
  approvals: ChangeEventApproval[];
  currentUser: User;
  onApprove: (comments?: string) => Promise<void>;
  onReject: (comments: string) => Promise<void>;
  onRequestChanges: (comments: string) => Promise<void>;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────┐
│ APPROVAL WORKFLOW                           │
├─────────────────────────────────────────────┤
│ Status: Pending Approval                    │
│                                             │
│ ┌─ Sarah Director (Project Manager)         │
│ │  Status: ⏳ Pending                      │
│ │  Requested: Jan 15, 2026 2:30 PM        │
│ └─ [Approve] [Reject] [Request Changes]    │
│                                             │
│ ┌─ Mike Owner (Owner Representative)        │
│ │  Status: ⏳ Pending                      │
│ │  Requested: Jan 15, 2026 2:30 PM        │
│ └─ Awaiting previous approval               │
└─────────────────────────────────────────────┘
```

> ⚠️ Reality: The live component posts to `/api/projects/{projectId}/change-events/{changeEventId}/approvals`, but those routes do not exist and the component hardcodes numeric approver IDs, so no approvals are ever recorded.

### 9. ChangeEventConvertDialog
**File**: `/frontend/src/components/domain/change-events/ChangeEventConvertDialog.tsx`
**Purpose**: Convert change event to change order dialog
**Screenshot**: Conversion dialog interface

#### Props Interface
```typescript
interface ChangeEventConvertDialogProps {
  changeEvent: ChangeEvent;
  open: boolean;
  onClose: () => void;
  onConvert: (data: ConversionData) => Promise<void>;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────┐
│ Convert to Change Order                  [×]│
├─────────────────────────────────────────────┤
│ Change Event: 007 - Foundation Work        │
│                                             │
│ ┌─ Conversion Settings                     │ │
│ │  Change Order Type: [Owner Change ▼]    │ │
│ │  Contract: [Main Construction ▼]        │ │
│ │  Schedule Impact: [____] days            │ │
│ │                                         │ │
│ │  ☑ Copy line items                     │ │
│ │  ☑ Copy attachments                    │ │
│ │  ☐ Auto-approve change order           │ │
│ └─                                       │ │
│                                             │
│ Impact Summary:                             │
│ • Revenue: $45,000                         │
│ • Cost: $37,500                           │
│ • Potential Profit: $7,500               │
│                                             │
├─────────────────────────────────────────────┤
│                   [Cancel] [Convert]        │
└─────────────────────────────────────────────┘
```

## Responsive Design Details

### Breakpoint Strategy
```typescript
const breakpoints = {
  mobile: '640px',    // Stack form sections vertically
  tablet: '768px',    // Adjust table columns
  desktop: '1024px',  // Full layout
  wide: '1280px'      // Extra wide for detailed views
};
```

### Mobile Adaptations
- **Forms**: Single column layout with collapsible sections
- **Tables**: Horizontal scroll with sticky first column
- **Grids**: Card layout instead of table layout
- **Navigation**: Hamburger menu for tabs

### Tablet Adaptations
- **Forms**: Two-column layout where space permits
- **Tables**: Hide less critical columns
- **Modals**: Adjusted padding and sizing

## State Management Patterns

### Component State Architecture
```typescript
// Global app state
const ChangeEventsContext = createContext<{
  changeEvents: ChangeEventSummary[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  pagination: PaginationState;
}>();

// Form state
const useChangeEventForm = () => {
  const form = useForm<ChangeEventFormData>();
  const [lineItems, setLineItems] = useState<ChangeEventLineItem[]>([]);
  const [attachments, setAttachments] = useState<ChangeEventAttachment[]>([]);

  // Form actions
  const submitForm = useCallback(async () => {
    // Validation and submission logic
  }, [form.formState]);

  return { form, lineItems, attachments, submitForm };
};

// List state
const useChangeEventsList = (projectId: string) => {
  const [data, setData] = useState<ChangeEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    search: '',
    page: 1
  });

  // Data fetching
  useEffect(() => {
    fetchChangeEvents(projectId, filters).then(setData);
  }, [projectId, filters]);

  return { data, loading, filters, setFilters };
};
```

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through form fields
- **Arrow Keys**: Navigate table cells and grid items
- **Enter/Space**: Activate buttons and selections
- **Escape**: Close modals and cancel editing

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all form controls
- **Live Regions**: Announce dynamic content changes
- **Table Headers**: Proper header associations for data tables
- **Error Announcements**: Validation errors announced immediately

### Visual Accessibility
- **High Contrast**: WCAG AA contrast ratios
- **Focus Indicators**: Clear focus outlines
- **Error States**: Color plus text for error indication
- **Font Sizes**: Minimum 16px for readability

## Performance Considerations

### Component Optimization
```typescript
// Memoized table columns to prevent re-renders
export const changeEventsTableColumns = useMemo(() => [
  // column definitions
], []);

// Virtualized rendering for large datasets
const VirtualizedLineItemsGrid = memo(({ items }: { items: ChangeEventLineItem[] }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {LineItemRow}
    </FixedSizeList>
  );
});

// Debounced search input
const useDebounceSearch = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

### Loading States
- **Skeleton Components**: Loading placeholders matching layout
- **Progressive Loading**: Load critical content first
- **Optimistic Updates**: Immediate UI feedback for user actions
- **Error Boundaries**: Graceful error handling without full page crashes

This UI specification provides comprehensive guidance for implementing all Change Events components with proper responsive design, accessibility, and performance optimizations.
