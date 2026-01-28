# Commitments Forms Specification

## Form List

1. **CreateSubcontractForm** - New subcontractor agreement creation
2. **CreatePurchaseOrderForm** - New purchase order creation
3. **EditSubcontractForm** - Modify existing subcontract
4. **EditPurchaseOrderForm** - Modify existing purchase order
5. **SOVLineItemEditor** - Schedule of Values line item management
6. **AttachmentUploadForm** - File attachment management
7. **CommitmentSettingsForm** - Project-level configuration (81 fields)

## Form Specifications

### 1. CreateSubcontractForm

**Purpose**: Create new subcontractor agreements with complete Procore field parity
**File**: `/frontend/src/components/commitments/SubcontractForm.tsx`
**Schema**: `/frontend/src/lib/schemas/subcontract-schema.ts`

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| title | Text | Yes | min(1), max(255) | Scope summary / contract name |
| status | Select | Yes | enum values | Lifecycle state (Draft default) |
| contract_company_id | Company Select | Yes | FK validation | Vendor / subcontractor |
| contract_number | Text | Yes | auto-generated | Unique subcontract identifier |
| description | Rich Text | No | HTML content | Detailed contract description |
| executed | Checkbox | No | boolean | Indicates contract execution |
| default_retainage_percent | Number | No | 0-100, 2 decimals | Retainage percentage |
| accounting_method | Toggle | No | enum values | Amount-based vs Unit/Qty |
| start_date | Date | No | valid date | Contract start |
| estimated_completion_date | Date | No | valid date | Planned finish |
| actual_completion_date | Date | No | valid date | Actual finish |
| contract_date | Date | No | valid date | Date of contract |
| signed_contract_received_date | Date | No | valid date | Signed doc received |
| issued_on_date | Date | No | valid date | Date issued to vendor |
| inclusions | Rich Text | No | HTML content | Scope included |
| exclusions | Rich Text | No | HTML content | Scope excluded |
| is_private | Checkbox | No | boolean | Restricts visibility (default true) |
| non_admin_user_ids | Multi-Select | No | UUID array | Explicit access users |
| allow_non_admin_view_sov_items | Checkbox | No | boolean | SOV visibility permission |
| invoice_contact_ids | Multi-Select | No | UUID array | Who can invoice |

#### Form Layout

```
┌─ Create Subcontract ───────────────────────────────────────┐
│                                                            │
│ ┌─ Basic Information ─────────────────────────────────────┐ │
│ │ Title*            [________________________]            │ │
│ │ Status*           [Draft ▼]                             │ │
│ │ Contract Company* [Select Company... ▼]                 │ │
│ │ Contract #*       [Auto: SC-001]                        │ │
│ │ Description       [Rich Text Editor Area]               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Flags & Settings ──────────────────────────────────────┐ │
│ │ ☑ Executed                                              │ │
│ │ ☑ Private (default)                                     │ │
│ │ Default Retainage [____]%                              │ │
│ │ Accounting Method: ○ Amount-based ● Unit/Quantity      │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Dates ────────────────────────────────────────────────┐ │
│ │ Start Date              [MM/DD/YYYY]                    │ │
│ │ Estimated Completion    [MM/DD/YYYY]                    │ │
│ │ Actual Completion       [MM/DD/YYYY]                    │ │
│ │ Contract Date           [MM/DD/YYYY]                    │ │
│ │ Signed Contract Received[MM/DD/YYYY]                    │ │
│ │ Issued On Date          [MM/DD/YYYY]                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Scope ────────────────────────────────────────────────┐ │
│ │ Inclusions       [Rich Text Editor Area]                │ │
│ │ Exclusions       [Rich Text Editor Area]                │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Access Control (conditional on Private) ──────────────┐ │
│ │ Non-Admin Users  [Multi-select users]                   │ │
│ │ ☐ Allow Non-Admins to View SOV                         │ │
│ │ Invoice Contacts [Multi-select after company chosen]    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Attachments ───────────────────────────────────────────┐ │
│ │ [Drop files here or click to browse]                    │ │
│ │ • contract.pdf (2.1MB) [x]                             │ │
│ │ • specs.docx (856KB) [x]                               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Schedule of Values ────────────────────────────────────┐ │
│ │ [+ Add Line Item]                                       │ │
│ │ ┌─────┬─────────────┬─────────────┬─────────┬────────┐  │ │
│ │ │  #  │ Budget Code │ Description │ Amount  │Actions │  │ │
│ │ ├─────┼─────────────┼─────────────┼─────────┼────────┤  │ │
│ │ │  1  │ [Select ▼]  │ [_________] │ [_____] │ [Edit] │  │ │
│ │ │  2  │ [Select ▼]  │ [_________] │ [_____] │ [Edit] │  │ │
│ │ └─────┴─────────────┴─────────────┴─────────┴────────┘  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│           [Cancel]              [Save Draft] [Submit]      │
└────────────────────────────────────────────────────────────┘
```

#### Conditional Logic

1. **Invoice Contacts**: Only enabled after `contract_company_id` is selected
2. **Non-Admin Access Section**: Only shown when `is_private = true`
3. **Allow Non-Admin View SOV**: Only shown when `is_private = true`
4. **Rich Text Editors**: For Description, Inclusions, Exclusions fields

#### Validation Rules

```typescript
const subcontractSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  status: z.enum(['draft', 'sent', 'pending', 'approved', 'executed', 'closed', 'void']),
  contract_company_id: z.string().uuid('Must select a company'),
  contract_number: z.string().min(1, 'Contract number required'),
  description: z.string().optional(),
  executed: z.boolean().default(false),
  default_retainage_percent: z.number().min(0).max(100).optional(),
  accounting_method: z.enum(['amount_based', 'unit_quantity']).default('amount_based'),
  start_date: z.date().optional(),
  estimated_completion_date: z.date().optional(),
  actual_completion_date: z.date().optional(),
  contract_date: z.date().optional(),
  signed_contract_received_date: z.date().optional(),
  issued_on_date: z.date().optional(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  is_private: z.boolean().default(true),
  non_admin_user_ids: z.array(z.string().uuid()).default([]),
  allow_non_admin_view_sov_items: z.boolean().default(false),
  invoice_contact_ids: z.array(z.string().uuid()).default([]),
  // SOV line items as nested array
  sov_items: z.array(z.object({
    line_number: z.number().int().positive(),
    budget_code_id: z.string().uuid('Must select budget code'),
    description: z.string().min(1, 'Description required'),
    amount: z.number().min(0, 'Amount must be positive'),
    change_event_line_item_id: z.string().uuid().optional(),
  })).default([]),
});
```

### 2. CreatePurchaseOrderForm

**Purpose**: Create new purchase orders with procurement-specific fields
**File**: `/frontend/src/components/commitments/PurchaseOrderForm.tsx`

#### Additional PO Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| ship_to | Text | No | max(500) | Shipping address |
| ship_via | Text | No | max(255) | Shipping method |
| bill_to | Text | No | max(500) | Billing address |
| delivery_date | Date | No | valid date | Expected delivery |
| payment_terms | Text | No | max(500) | Payment terms |
| assigned_to | User Select | No | UUID | Assigned user |

#### Form Layout Differences

```
┌─ Create Purchase Order ────────────────────────────────────┐
│ [Same Basic Information, Flags, Dates sections as above]   │
│                                                            │
│ ┌─ Shipping & Terms ─────────────────────────────────────┐ │
│ │ Ship To       [Text area for address]                   │ │
│ │ Ship Via      [________________________]                │ │
│ │ Bill To       [Text area for address]                   │ │
│ │ Delivery Date [MM/DD/YYYY]                              │ │
│ │ Payment Terms [Text area]                               │ │
│ │ Assigned To   [Select User ▼]                           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [SOV section shows Quantity, Unit Cost, UOM columns]      │
└────────────────────────────────────────────────────────────┘
```

### 3. SOVLineItemEditor

**Purpose**: Inline editing of Schedule of Values line items
**File**: `/frontend/src/components/commitments/SOVLineItemsEditor.tsx`

#### Subcontract SOV Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| line_number | Integer | Auto | auto-increment | Line sequence |
| budget_code_id | Select | Yes | FK validation | Cost code reference |
| description | Text | Yes | min(1), max(500) | Line item description |
| amount | Currency | Yes | min(0), 2 decimals | Line item value |
| change_event_line_item_id | Select | No | FK validation | Linked change event |

#### Purchase Order SOV Fields (Additional)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| quantity | Number | No | min(0), 3 decimals | Item quantity |
| unit_cost | Currency | No | min(0), 2 decimals | Price per unit |
| unit_of_measure | Text | No | max(50) | UOM (ea, ft, lb, etc.) |

#### Inline Editor Layout

```
┌─ Schedule of Values ────────────────────────────────────────┐
│ [+ Add Line Item]                                           │
│                                                            │
│ ┌────┬──────────────┬─────────────────┬──────────┬────────┐ │
│ │ #  │ Budget Code  │ Description     │ Amount   │Actions │ │
│ ├────┼──────────────┼─────────────────┼──────────┼────────┤ │
│ │ 1  │ 01-100 ▼     │ Site prep work  │ $50,000  │ ✎ 🗑   │ │
│ │ 2  │ 01-200 ▼     │ Excavation      │ $25,000  │ ✎ 🗑   │ │
│ │ +  │ [Select] ▼   │ [Description]   │ [$]      │ ✓ ✗    │ │
│ └────┴──────────────┴─────────────────┴──────────┴────────┘ │
│                                                            │
│ Total SOV Amount: $75,000                                  │
│ Billed to Date:   $15,000                                  │
│ Remaining:        $60,000                                  │
└────────────────────────────────────────────────────────────┘
```

### 4. AttachmentUploadForm

**Purpose**: File upload and attachment management
**File**: `/frontend/src/components/commitments/AttachmentsManager.tsx`

#### Upload Interface

```
┌─ Attachments ───────────────────────────────────────────────┐
│                                                            │
│ ┌─ Upload Files ─────────────────────────────────────────┐ │
│ │     📎                                                  │ │
│ │ Drop files here or click to browse                     │ │
│ │ Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG        │ │
│ │ Maximum size: 10MB per file                            │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Attached Files ───────────────────────────────────────┐ │
│ │ 📄 contract.pdf (2.1MB)          [Download] [Delete]   │ │
│ │ 📊 specifications.xlsx (856KB)    [Download] [Delete]   │ │
│ │ 🖼️ site-plan.jpg (1.2MB)          [Download] [Delete]   │ │
│ │ 📝 addendum-01.docx (234KB)       [Download] [Delete]   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ Total: 4 files (4.4MB)                                    │
└────────────────────────────────────────────────────────────┘
```

#### File Validation

```typescript
const attachmentValidation = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  maxFiles: 20,
  maxTotalSize: 50 * 1024 * 1024 // 50MB total
};
```

### 5. CommitmentSettingsForm

**Purpose**: Project-level commitment configuration with 81 Procore settings
**File**: `/frontend/src/components/commitments/CommitmentSettingsForm.tsx`

#### Settings Sections

##### Section 1: General Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| contracts_private_by_default | Checkbox | true | New contracts private |
| enable_purchase_orders | Checkbox | true | Allow PO creation |
| enable_subcontracts | Checkbox | true | Allow subcontract creation |
| cco_tier_count | Select | 1 | Number of CO approval tiers |
| allow_standard_create_cco | Checkbox | false | Standard users create CCOs |
| enable_editable_sov | Checkbox | false | Always editable SOV |
| show_markup_on_co_pdf | Checkbox | false | Show markup on PDFs |

##### Section 2: Distribution Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| include_primary_contact | Checkbox | true | Include primary in distribution |
| commitment_distribution | Multi-Select | [] | Default email recipients |
| cco_distribution | Multi-Select | [] | CCO email recipients |
| invoice_distribution | Multi-Select | [] | Invoice email recipients |

##### Section 3: Defaults

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| default_po_accounting_method | Select | amount_based | Default PO method |
| default_sc_accounting_method | Select | amount_based | Default SC method |
| default_po_retainage_percent | Number | 0 | Default PO retainage |
| default_sc_retainage_percent | Number | 10 | Default SC retainage |
| enable_invoices_default | Checkbox | true | Enable invoices by default |
| enable_payments_default | Checkbox | true | Enable payments by default |

##### Section 4: Billing Period Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| prefilled_periods_enabled | Checkbox | false | Auto-fill billing periods |
| billing_period_start | Select | 1 | Start day of month |
| billing_period_end | Select | 31 | End day of month |
| billing_due_date | Select | 30 | Due date day |
| send_reminders | Checkbox | false | Email reminders |
| reminder_interval | Select | 1 | Days before due date |
| custom_email_text | Textarea | "" | Custom email message |

#### Settings Form Layout

```
┌─ Commitment Settings ───────────────────────────────────────┐
│                                                            │
│ ┌─ General ─────┐ ┌─ Distribution ─┐ ┌─ Defaults ──┐      │
│ │              │ │                │ │             │      │
│ │ ☑ Private by │ │ Include Primary│ │ PO Method   │      │
│ │   default    │ │ ☑ Yes          │ │ ● Amount     │      │
│ │              │ │                │ │ ○ Unit/Qty   │      │
│ │ ☑ Enable POs │ │ Commitment Dist│ │             │      │
│ │ ☑ Enable SCs │ │ [Select Users] │ │ SC Method   │      │
│ │              │ │                │ │ ● Amount     │      │
│ │ CO Tiers     │ │ CCO Dist       │ │ ○ Unit/Qty   │      │
│ │ [1 ▼]        │ │ [Select Users] │ │             │      │
│ └──────────────┘ └────────────────┘ │ Default      │      │
│                                     │ Retainage    │      │
│ ┌─ Billing Periods ─────────────────┐ │ PO: [0]%     │      │
│ │ ☐ Enable Auto-fill               │ │ SC: [10]%    │      │
│ │ Period: [1] to [31] of month     │ └─────────────┘      │
│ │ Due: [30] days                   │                      │
│ │ ☐ Send reminders [1] days before │                      │
│ │                                  │                      │
│ │ Custom Email Text:               │                      │
│ │ [Text area for custom message]   │                      │
│ └──────────────────────────────────┘                      │
│                                                            │
│              [Cancel]              [Save Settings]         │
└────────────────────────────────────────────────────────────┘
```

## Error Handling Patterns

### Form-Level Validation

```typescript
interface FormErrorState {
  field: string;
  message: string;
  type: 'required' | 'format' | 'business' | 'server';
}

const commonErrorPatterns = {
  required: (field: string) => `${field} is required`,
  invalidFormat: (field: string) => `Invalid ${field} format`,
  businessRule: (rule: string) => `Business rule violation: ${rule}`,
  serverError: (message: string) => `Server error: ${message}`,
  networkError: () => 'Network error. Please try again.',
};
```

### Field-Specific Validation

```typescript
const fieldValidation = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s\-_.,()]+$/
  },
  contractNumber: {
    required: true,
    pattern: /^[A-Z]+-[A-Z]+-\d{4}$/,
    unique: true // Check against database
  },
  retainagePercent: {
    min: 0,
    max: 100,
    decimals: 2
  },
  amount: {
    min: 0,
    decimals: 2,
    max: 999999999.99
  }
};
```

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**
   - All form fields accessible via Tab/Shift+Tab
   - Logical tab order through form sections
   - Enter key submits forms, Escape cancels

2. **Screen Reader Support**
   - Proper ARIA labels for all form controls
   - Error messages associated with fields
   - Form section headings properly structured

3. **Visual Accessibility**
   - Sufficient color contrast (4.5:1 minimum)
   - Focus indicators visible and high contrast
   - Text size scalable to 200% without horizontal scroll

4. **Error Handling**
   - Error messages clearly associated with fields
   - Summary of all errors at top of form
   - Success messages announced to screen readers

### ARIA Implementation

```html
<!-- Example form field with proper ARIA -->
<div class="form-field">
  <label for="title" id="title-label">
    Title *
  </label>
  <input
    id="title"
    name="title"
    type="text"
    required
    aria-labelledby="title-label"
    aria-describedby="title-help title-error"
    aria-invalid={hasError}
  />
  <div id="title-help" class="help-text">
    Scope summary or contract name
  </div>
  {hasError && (
    <div id="title-error" class="error-text" role="alert">
      Title is required
    </div>
  )}
</div>
```

## Performance Considerations

### Form Optimization

1. **Lazy Loading**
   - Load rich text editors only when needed
   - Defer budget code options until field focused
   - Progressive enhancement for complex widgets

2. **Debounced Validation**
   - Delay validation while user is typing
   - Batch validation requests to reduce server calls
   - Cache validation results for repeated values

3. **Efficient Rendering**
   - Use React.memo for stable form components
   - Optimize re-renders with useCallback/useMemo
   - Virtual scrolling for large select lists

4. **Data Management**
   - Incremental form saves (draft mode)
   - Optimistic updates for immediate feedback
   - Conflict resolution for concurrent edits