# Change Events Forms Specification

## Form List
1. ChangeEventForm (General + Revenue + Line Items + Attachments sections)
2. ChangeEventLineItemsGrid - Inline grid used inside the main form
3. ChangeEventRfqForm - RFQ creation panel beside change event details
4. ChangeEventRfqResponseForm - Vendor responses to RFQs
5. ChangeEventApprovalWorkflow - UI stub for approvals (backend endpoints missing)

## Form Specifications

### 1. ChangeEventForm
**File**: `/frontend/src/components/domain/change-events/ChangeEventForm.tsx`
**Purpose**: Main form for creating and editing change events
**Usage**: Create page, Edit page, Detail view sections

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Number | Text (Display) | No | Auto-generated | Format: 001, 002, 003... |
| Title | Text | Yes | Max 255 chars, min 1 char | Primary identifier |
| Type | Select | Yes | Enum values | Owner Change, Design Change, etc. |
| Reason | Select | Yes* | Dynamic based on type | Configurable dropdown |
| Scope | Select | Yes | In/Out/TBD/Allowance | Budget impact indicator |
| Status | Select | No | Admin only | Open, Pending, Approved, etc. |
| Origin | Select | No | Internal/RFI/Field | Source tracking |
| Description | TextArea | No | Max 2000 chars | Rich text description |
| Expecting Revenue | Toggle | No | Boolean | Controls revenue section |
| Revenue Source | Select | Conditional | Required if expecting revenue | Match Latest Cost, Manual, etc. (currently emits slug values like `match_latest_cost`) |
| Prime Contract | Select | No | Project contracts | Markup calculation reference |

> ⚠️ Implementation detail: `ChangeEventForm` keeps its own state (`initialData + onChange`) instead of React Hook Form, and the new-change-page submits via the `createChangeEvent` hook directly against Supabase, so fields such as `lineItemRevenueSource`, `expectingRevenue`, and `primeContractId` never reach the API as currently written.

#### Form Layout
```
┌─────────────────────────────────────────────┐
│ GENERAL SECTION                             │
├─────────────────┬───────────────────────────┤
│ Number: 007     │ Title: [_______________] │
├─────────────────┼───────────────────────────┤
│ Type: [Select▼] │ Reason: [Select▼]        │
├─────────────────┼───────────────────────────┤
│ Scope: [Select▼]│ Origin: [Select▼]        │
└─────────────────┴───────────────────────────┘

┌─────────────────────────────────────────────┐
│ REVENUE SECTION                             │
├─────────────────────────────────────────────┤
│ ☐ Expecting Revenue                         │
│ [Shows when checked]                        │
│ Revenue Source: [Select▼]                   │
│ Prime Contract: [Select▼]                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ DESCRIPTION                                 │
├─────────────────────────────────────────────┤
│ [Rich text editor - 2000 char limit]       │
└─────────────────────────────────────────────┘
```

#### Conditional Logic
- **Reason field**: Options change based on Type selection
- **Revenue section**: Only visible when "Expecting Revenue" is checked
- **Prime Contract**: Required when Revenue Source is "Percentage Markup"
- **Status field**: Read-only for non-admin users

#### Validation Rules
```typescript
const validationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  type: z.enum(changeEventTypes),
  reason: z.string().min(1, "Reason is required"),
  scope: z.enum(scopeValues),
  origin: z.enum(originValues).optional(),
  description: z.string().max(2000).optional(),
  expecting_revenue: z.boolean(),
  line_item_revenue_source: z.string().optional(),
  prime_contract_id: z.string().uuid().optional()
});
```

### 2. ChangeEventLineItemForm
**File**: `/frontend/src/components/domain/change-events/ChangeEventLineItemsGrid.tsx`
**Purpose**: Inline editing grid for line items
**Usage**: Within main form as editable data grid

> ⚠️ Note: The grid calls `/api/projects/{projectId}/change-events/{changeEventId}/line-items`, but the backend casts `changeEventId` to an integer even though the table uses UUIDs, so the list always returns empty until the API is updated to accept UUID strings.

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Budget Code | Select | Yes | Project budget codes | WBS hierarchy reference |
| Description | Text | Yes | Max 500 chars | Line item details |
| Vendor | Select | No | Project companies | Subcontractor reference |
| Contract | Select | No | Project commitments | PO/SC reference |
| Unit of Measure | Select | Yes | Standard UOM list | EA, SF, LF, LS, etc. |
| Quantity | Number | Yes | >0, 4 decimal places | Production quantity |
| Unit Cost | Currency | Yes | >=0, 2 decimal places | Cost per unit |
| Revenue ROM | Currency | No | >=0, 2 decimal places | Revenue estimate |
| Cost ROM | Currency | No | >=0, 2 decimal places | Cost estimate |
| Non-Committed Cost | Currency | No | >=0, 2 decimal places | Uncommitted costs |

#### Form Layout (Inline Grid)
```
┌──────────┬─────────────┬──────────┬──────────┬──────────┬──────────┐
│ Budget   │ Description │ Vendor   │ UOM      │ Quantity │ Unit $   │
│ Code ▼   │             │          │          │          │          │
├──────────┼─────────────┼──────────┼──────────┼──────────┼──────────┤
│ 01.01.01 │ Foundation  │ ABC Corp │ CY       │ 150.00   │ 250.00   │
├──────────┼─────────────┼──────────┼──────────┼──────────┼──────────┤
│ + Add Row │             │          │          │          │          │
└──────────┴─────────────┴──────────┴──────────┴──────────┴──────────┘

┌──────────┬─────────────┬──────────┬──────────┐
│ Revenue  │ Cost ROM    │ Non-Comm │ Actions  │
│ ROM      │             │ Cost     │          │
├──────────┼─────────────┼──────────┼──────────┤
│ 45000.00 │ 37500.00    │ 5000.00  │ 🗑️ ✏️    │
├──────────┼─────────────┼──────────┼──────────┤
│          │             │          │          │
└──────────┴─────────────┴──────────┴──────────┘
```

#### Calculation Logic
```typescript
// Auto-calculations performed on field changes
extended_amount = quantity * unit_cost
revenue_rom = extended_amount * revenue_factor
cost_rom = extended_amount * cost_factor
total_line_items = sum(all_revenue_rom)
```

### 3. ChangeEventRfqForm
**File**: `/frontend/src/components/domain/change-events/ChangeEventRfqForm.tsx`
**Purpose**: Create RFQs from change event line items
**Usage**: RFQs tab within change event detail view

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Title | Text | Yes | Max 255 chars | RFQ identifier |
| Description | TextArea | No | Max 1000 chars | RFQ details |
| Line Items | Multi-Select | Yes | At least 1 item | Change event line items |
| Vendors | Multi-Select | Yes | At least 1 vendor | Companies to quote |
| Due Date | Date | Yes | Future date | Response deadline |
| Instructions | TextArea | No | Max 2000 chars | Special instructions |
| Attachments | File Upload | No | Multiple files | Supporting documents |
| Send Email | Checkbox | No | Boolean | Email notification to vendors |

#### Form Layout
```
┌─────────────────────────────────────────────┐
│ RFQ DETAILS                                 │
├─────────────────┬───────────────────────────┤
│ Title: [_______]│ Due Date: [Date Picker]   │
├─────────────────┴───────────────────────────┤
│ Description: [TextArea - 1000 chars]       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ LINE ITEMS TO QUOTE                         │
├─────────────────────────────────────────────┤
│ ☑ Foundation Work - $45,000                 │
│ ☐ Electrical Rough-in - $12,000           │
│ ☑ Plumbing Fixtures - $8,500              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ VENDORS                                     │
├─────────────────────────────────────────────┤
│ ☑ ABC Construction Corp                     │
│ ☑ XYZ Contractors Ltd                      │
│ ☐ Best Build LLC                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SETTINGS                                    │
├─────────────────────────────────────────────┤
│ Instructions: [TextArea - 2000 chars]      │
│ Attachments: [File Drop Zone]              │
│ ☑ Send email notification to vendors       │
└─────────────────────────────────────────────┘
```

> ⚠️ Note: While the RFQ form renders fields and attachments, it is not yet wired to call the `/api/projects/{projectId}/change-events/{changeEventId}/rfqs` endpoints, so no payload leaves the client.

### 4. ChangeEventRfqResponseForm
**File**: `/frontend/src/components/domain/change-events/ChangeEventRfqResponseForm.tsx`
**Purpose**: Vendor response to RFQs
**Usage**: Public form accessible via email link

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Line Items | Display Table | - | Read-only | Items being quoted |
| Unit Price | Currency | Yes | >0, 2 decimals | Price per unit |
| Total Price | Currency | Auto | Calculated | Extended amount |
| Notes | TextArea | No | Max 1000 chars | Response notes |
| Attachments | File Upload | No | Multiple files | Supporting docs |
| Alternate Options | TextArea | No | Max 2000 chars | Alternative proposals |
| Delivery Schedule | Text | No | Max 255 chars | Timeline estimate |

#### Form Layout
```
┌─────────────────────────────────────────────┐
│ RFQ: Foundation and Site Work               │
│ Due: Jan 25, 2026                          │
└─────────────────────────────────────────────┘

┌────────────┬─────────────┬──────────┬────────────────┐
│ Line Item  │ Quantity    │ UOM      │ Your Unit Price │
├────────────┼─────────────┼──────────┼────────────────┤
│ Foundation │ 150.00      │ CY       │ [$_______]     │
│ Work       │             │          │                │
├────────────┼─────────────┼──────────┼────────────────┤
│ Site Prep  │ 1.00        │ LS       │ [$_______]     │
├────────────┼─────────────┼──────────┼────────────────┤
│            │             │ TOTAL:   │ $________      │
└────────────┴─────────────┴──────────┴────────────────┘

┌─────────────────────────────────────────────┐
│ RESPONSE DETAILS                            │
├─────────────────────────────────────────────┤
│ Notes: [TextArea - 1000 chars]             │
│ Attachments: [File Drop Zone]              │
│ Delivery: [Text - 255 chars]               │
│ Alternates: [TextArea - 2000 chars]        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [Cancel]                   [Submit Response]│
└─────────────────────────────────────────────┘
```

> ⚠️ Note: The response form UI exists, but it is not currently wired to submit data to `/api/projects/{projectId}/change-events/{changeEventId}/rfqs/{rfqId}/responses`, so no records are created.

### 5. ChangeEventApprovalForm
**File**: `/frontend/src/components/domain/change-events/ChangeEventApprovalWorkflow.tsx`
**Purpose**: Approve or reject change events
**Usage**: Approval workflow within detail view

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Decision | Radio | Yes | Approve/Reject/Request Changes | Approval decision |
| Comments | TextArea | Conditional | Required if reject | Explanation |
| Conditions | TextArea | No | Max 1000 chars | Approval conditions |
| Budget Impact | Display | - | Read-only | Financial summary |
| Approver Signature | Display | - | Auto-filled | User identification |

#### Form Layout
```
┌─────────────────────────────────────────────┐
│ APPROVAL REQUIRED                           │
├─────────────────────────────────────────────┤
│ Change Event: 007 - Phase 1 & 2 Carpet     │
│ Total Impact: $45,000 revenue / $37,500 cost│
│ Requested by: John Manager                  │
│ Date Submitted: Jan 15, 2026               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ DECISION                                    │
├─────────────────────────────────────────────┤
│ ○ Approve                                   │
│ ○ Reject                                    │
│ ○ Request Changes                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ COMMENTS                                    │
├─────────────────────────────────────────────┤
│ [TextArea - 2000 chars]                    │
│ [Required if Reject or Request Changes]     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ CONDITIONS (Optional)                       │
├─────────────────────────────────────────────┤
│ [TextArea - 1000 chars]                    │
│ Approval conditions or requirements         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [Cancel]                    [Submit Decision]│
└─────────────────────────────────────────────┘
```

> ⚠️ Note: The approval workflow component posts to `/api/projects/{projectId}/change-events/{changeEventId}/approvals`, but those endpoints do not exist yet. The UI also hard-codes numeric approver IDs, so this form cannot actually record approvals until the API is implemented and uses UUIDs.

## Form State Management

### Global Form State
```typescript
interface ChangeEventFormState {
  // Main form data
  formData: ChangeEventFormData;

  // Line items
  lineItems: ChangeEventLineItem[];

  // Attachments
  attachments: ChangeEventAttachment[];

  // Form state
  isSubmitting: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;

  // Conditional visibility
  showRevenueSection: boolean;
  showApprovalSection: boolean;

  // Navigation
  activeTab: 'details' | 'line-items' | 'attachments' | 'approvals';
}
```

### Form Actions
```typescript
interface ChangeEventFormActions {
  // Form data
  updateField: (field: string, value: any) => void;
  setFormData: (data: ChangeEventFormData) => void;
  resetForm: () => void;

  // Line items
  addLineItem: () => void;
  updateLineItem: (index: number, data: Partial<ChangeEventLineItem>) => void;
  removeLineItem: (index: number) => void;
  reorderLineItems: (startIndex: number, endIndex: number) => void;

  // Attachments
  addAttachment: (file: File) => Promise<void>;
  removeAttachment: (id: string) => void;

  // Validation
  validateForm: () => boolean;
  validateField: (field: string) => string | null;

  // Submission
  submitForm: () => Promise<void>;
  saveDraft: () => Promise<void>;
}
```

## Error Handling Patterns

### Field-Level Validation
```typescript
const fieldValidators = {
  title: (value: string) => {
    if (!value) return "Title is required";
    if (value.length > 255) return "Title must be 255 characters or less";
    return null;
  },

  revenue_source: (value: string, formData: ChangeEventFormData) => {
    if (formData.expecting_revenue && !value) {
      return "Revenue source is required when expecting revenue";
    }
    return null;
  },

  line_items: (items: ChangeEventLineItem[]) => {
    if (items.length === 0) return "At least one line item is required";
    const invalidItems = items.filter(item => !item.description || !item.budget_code_id);
    if (invalidItems.length > 0) return "All line items must have description and budget code";
    return null;
  }
};
```

### Form-Level Error Display
```typescript
interface FormErrors {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const ErrorDisplay = ({ errors }: { errors: FormErrors[] }) => (
  <div className="space-y-2">
    {errors.map(error => (
      <Alert key={error.field} variant={error.severity === 'error' ? 'destructive' : 'default'}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Validation Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    ))}
  </div>
);
```

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow: general → revenue → line items → attachments
- Arrow keys for grid navigation in line items
- Escape key to cancel editing
- Enter key to submit forms

### Screen Reader Support
- Proper ARIA labels and descriptions
- Field validation announcements
- Table headers for line items grid
- Live regions for dynamic content updates

### Visual Accessibility
- High contrast colors for form elements
- Clear focus indicators
- Error states with color and text
- Consistent spacing and typography

## Performance Considerations

### Form Optimization
- Debounced validation (300ms delay)
- Virtualized line items grid for large datasets
- Lazy loading of dropdown options
- File upload progress indicators

### State Management
- Form state persisted in sessionStorage
- Optimistic updates for better UX
- Batch API calls for bulk operations
- Smart re-rendering with React.memo

## Implementation Gaps

- `changeEventId` is coerced to a number across the list/detail/edit/line item/attachment/history flows, so every API call hits `NaN` and returns empty results until UUID values are preserved.
- The revenue selector emits slug values (`match_latest_cost`, `manual_entry`, `percentage_markup`, `fixed_amount`) that fail the backend's `LineItemRevenueSource` enum, so revenue metadata cannot be submitted.
- Attachments upload under the `files` key but the API handler expects a single `file`, producing validation errors before Supabase storage receives the blob.
- The approval workflow posts to `/approvals` routes that are not implemented and uses numeric approver IDs instead of UUIDs, so approvals cannot be processed.
- RFQ creation and response panels render, but they do not currently post to the `/rfqs` endpoints, so the workflow is a UI stub.

This forms specification provides complete guidance for implementing all Change Events forms with proper validation, accessibility, and user experience patterns.
