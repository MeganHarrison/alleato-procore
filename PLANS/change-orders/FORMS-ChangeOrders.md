# Change Orders Forms Specification

## Form List

1. **ChangeOrderCreateForm** - Multi-step creation form for new change orders
2. **ChangeOrderEditForm** - Edit existing change orders (draft/approved states)
3. **PackageCreateForm** - Create new change order packages
4. **LineItemsEditor** - Manage line items within change orders
5. **ApprovalWorkflowForm** - Approve, reject, or delegate change orders
6. **BulkActionForm** - Batch operations on multiple change orders
7. **AttachmentUploadForm** - File upload and attachment management
8. **RelatedItemsForm** - Link change orders to other project items

## Form Specifications

### 1. ChangeOrderCreateForm
**Location**: `/[projectId]/change-orders/new`
**Component**: `frontend/src/components/domain/change-orders/ChangeOrderCreateForm.tsx`
**Purpose**: Multi-step form for creating new change orders with full validation

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| packageId | Select/Create | No | Existing package or new | Package grouping |
| newPackageTitle | Text | Conditional | Max 500 chars | If creating new package |
| contractType | Radio | Yes | prime/commitment | Contract classification |
| contractId | Select | Yes | Active contracts only | Related contract |
| number | Text | Yes | Unique per project | Auto-generated with override |
| title | Text | Yes | 1-500 chars | Change order title |
| description | TextArea | No | Max 2000 chars | Detailed description |
| changeReasonId | Select | No | Predefined reasons | Categorization |
| scope | Select | Yes | IN_SCOPE/OUT_OF_SCOPE | Budget impact flag |
| dateInitiated | Date | No | Past/present/future | Default: today |
| dueDate | Date | No | >= dateInitiated | Review deadline |
| designatedReviewerId | UserSelect | No | Project members only | Primary reviewer |
| private | Toggle | No | Boolean | Visibility restriction |
| lineItems | Array | Yes | Min 1 item | Financial breakdown |
| attachments | FileUpload | No | Multiple files | Supporting documents |

#### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Create Change Order                      │
├─────────────────────────────────────────────────────────────┤
│ Step 1: Basic Information                         [1 of 4] │
│                                                             │
│ Package: [Existing Package ▼] [+ New Package]              │
│ Contract Type: ○ Prime Contract  ○ Commitment               │
│ Contract: [Select Contract ▼]                              │
│ Number: [CO-001] (auto-generated)                          │
│ Title: [________________________________]                   │
│                                                             │
│                              [Cancel] [Next Step →]        │
├─────────────────────────────────────────────────────────────┤
│ Step 2: Details & Scope                          [2 of 4] │
│                                                             │
│ Description:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                                                         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Change Reason: [Select Reason ▼]                           │
│ Scope: ○ In Scope  ○ Out of Scope                          │
│ Date Initiated: [MM/DD/YYYY]                               │
│ Due Date: [MM/DD/YYYY]                                     │
│ Designated Reviewer: [Select User ▼]                       │
│ Private: ☐ Restrict visibility                             │
│                                                             │
│                              [← Back] [Next Step →]        │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Line Items                               [3 of 4] │
│                                                             │
│ ┌─ Line Items ──────────────────────────────────────────── │
│ │ Description     │Code   │Qty │UoM │Price    │Amount     │ │
│ │ Site Work       │01-100 │100 │SF  │$15.00   │$1,500.00  │ │
│ │ [Add Line Item +]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Total Amount: $1,500.00                                     │
│                                                             │
│                              [← Back] [Next Step →]        │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Attachments & Review                     [4 of 4] │
│                                                             │
│ Attachments:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📎 Drop files here or [Browse Files]                   │ │
│ │                                                         │ │
│ │ • spec_document.pdf (2.3 MB) [✓ Uploaded]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Review Summary:                                             │
│ • Contract: ABC Construction                                │
│ • Total Amount: $1,500.00                                   │
│ • Line Items: 1                                            │
│ • Attachments: 1                                           │
│                                                             │
│              [← Back] [Save Draft] [Submit for Review]     │
└─────────────────────────────────────────────────────────────┘
```

#### Conditional Logic
- **Package Selection**: If "New Package" selected, show packageTitle field
- **Contract Type**: Filters available contracts in contractId dropdown
- **Designated Reviewer**: Only shows users with project access
- **Line Items**: Minimum 1 required, auto-calculate extended amounts
- **Save vs Submit**: "Save Draft" keeps status='draft', "Submit" changes to 'submitted'

### 2. ChangeOrderEditForm
**Location**: `/[projectId]/change-orders/[id]/edit`
**Component**: `frontend/src/components/domain/change-orders/ChangeOrderEditForm.tsx`
**Purpose**: Edit existing change orders with status-dependent field restrictions

#### Editable Fields by Status
**Draft Status (Full Edit):**
- All fields except: number, contractId, contractType, createdAt
- Can add/remove line items
- Can add/remove attachments

**Submitted Status (Limited Edit):**
- title, description, dueDate only
- Cannot modify line items
- Can add attachments, cannot remove existing ones

**Approved Status (Minimal Edit):**
- description, designatedReviewerId only
- No line item changes
- View-only for financial fields

#### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│                     Edit Change Order                      │
│                         CO-001                             │
├─────────────────────────────────────────────────────────────┤
│ Status: [APPROVED] Package: PCO #001                        │
│                                                             │
│ Title: [Phase 1 & 2 Changes - Full Scope]                 │
│ Description: [Multiple line textarea]                       │
│                                                             │
│ ⚠️ This change order is APPROVED. Only limited fields      │
│    can be modified.                                         │
│                                                             │
│ Contract: ABC Construction (Read-only)                      │
│ Total Amount: $5,062.35 (Read-only)                        │
│ Due Date: [05/27/2025]                                     │
│ Reviewer: [Dawson, Jesse ▼]                                │
│                                                             │
│ Line Items (Read-only):                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Carpet Installation - Premium │ 500SF │ $15.00│$7,500.00│ │
│ │ Plumbing Materials           │  1LS  │$5047.35│$5,047.35│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Cancel] [Save Changes]       │
└─────────────────────────────────────────────────────────────┘
```

### 3. PackageCreateForm
**Location**: Modal dialog from create form or package management
**Component**: `frontend/src/components/domain/change-orders/PackageCreateForm.tsx`
**Purpose**: Create new change order packages for organization

#### Form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| packageNumber | Text | Yes | Unique per project | Auto-generated (PCO-001) |
| title | Text | Yes | 1-500 chars | Package title |
| description | TextArea | No | Max 2000 chars | Package description |
| contractType | Radio | Yes | prime/commitment | Package classification |

#### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│                   Create Change Order Package              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Package Number: [PCO-002] (auto-generated)                 │
│ Title: [_________________________________]                  │
│                                                             │
│ Description:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Type: ○ Prime Contract  ○ Commitment                       │
│                                                             │
│                              [Cancel] [Create Package]     │
└─────────────────────────────────────────────────────────────┘
```

### 4. LineItemsEditor
**Component**: `frontend/src/components/domain/change-orders/LineItemsEditor.tsx`
**Purpose**: Embedded editor for managing line items within change orders

#### Line Item Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| description | Text | Yes | 1-500 chars | Item description |
| costCodeId | Select | No | Active cost codes | Budget code link |
| quantity | Number | No | >= 0, 4 decimals | Item quantity |
| unitOfMeasure | Select | No | Standard units | Unit type |
| unitPrice | Currency | Yes | >= 0, 2 decimals | Price per unit |
| extendedAmount | Currency | Calculated | quantity × unitPrice | Total line amount |
| notes | TextArea | No | Max 1000 chars | Additional notes |

#### Component Layout
```
┌─ Line Items Editor ─────────────────────────────────────────┐
│                                                             │
│ ┌─ Line Item 1 ──────────────────────────────────[Remove]┐ │
│ │ Description: [Site Work Preparation______________]      │ │
│ │ Cost Code: [01-100 - Site Work ▼]                      │ │
│ │ Quantity: [100] UoM: [SF ▼] Price: [$15.00]           │ │
│ │ Amount: $1,500.00 (calculated)                         │ │
│ │ Notes: [_________________________________]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Line Item 2 ──────────────────────────────────[Remove]┐ │
│ │ Description: [Material Upgrade___________________]      │ │
│ │ Cost Code: [02-200 - Materials ▼]                      │ │
│ │ Quantity: [1] UoM: [LS ▼] Price: [$3,562.35]          │ │
│ │ Amount: $3,562.35 (calculated)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add Line Item]                                           │
│                                                             │
│ Total: $5,062.35                                            │
└─────────────────────────────────────────────────────────────┘
```

### 5. ApprovalWorkflowForm
**Location**: Modal dialog from change order detail view
**Component**: `frontend/src/components/domain/change-orders/ApprovalWorkflowForm.tsx`
**Purpose**: Approve, reject, or delegate change orders with comments

#### Approval Action Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| action | Radio | Yes | approve/reject/delegate | Review action |
| approvalNotes | TextArea | No | Max 2000 chars | Reviewer comments |
| scheduleImpact | Radio | No | yes/no/unknown | Schedule assessment |
| delegateToUserId | Select | Conditional | Project members | If delegating |
| delegationReason | TextArea | Conditional | Max 500 chars | Delegation reason |

#### Rejection Sub-form Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| rejectionReason | Select | Yes | Predefined categories | Rejection category |
| rejectionComments | TextArea | Yes | Max 2000 chars | Detailed explanation |
| allowResubmission | Toggle | Yes | Boolean | Creator can resubmit |

#### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Review Change Order                     │
│                         CO-001                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Change Order Summary:                                       │
│ • Title: Phase 1 & 2 Changes - Full Scope                 │
│ • Amount: $5,062.35                                         │
│ • Line Items: 2                                            │
│ • Due Date: 05/27/2025                                     │
│                                                             │
│ Review Action:                                              │
│ ○ Approve    ○ Reject    ○ Request Changes    ○ Delegate   │
│                                                             │
│ [If Approve selected]                                       │
│ Schedule Impact: ○ Yes  ○ No  ○ Unknown                    │
│                                                             │
│ Comments:                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Approved as submitted. Scope and pricing look good.    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ☐ Require signature (DocuSign)                            │
│                                                             │
│                              [Cancel] [Submit Review]      │
└─────────────────────────────────────────────────────────────┘
```

### 6. BulkActionForm
**Location**: Modal dialog from change orders list
**Component**: `frontend/src/components/domain/change-orders/BulkActionForm.tsx`
**Purpose**: Batch operations on multiple selected change orders

#### Bulk Action Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| selectedIds | Array | Yes | Min 1 item | Change order IDs |
| action | Radio | Yes | approve/reject/submit | Bulk action |
| uniformNotes | TextArea | No | Max 2000 chars | Same notes for all |
| maintainDueDates | Toggle | Yes | Boolean | Keep existing dates |
| sendNotifications | Toggle | Yes | Boolean | Email notifications |
| effectiveDate | Date | Yes | Today or future | Action effective date |

#### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│                     Bulk Action                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Selected Change Orders: 3 items                            │
│ • CO-001: Phase 1 & 2 Changes ($5,062.35)                 │
│ • CO-002: Electrical Upgrades ($12,500.00)                │
│ • CO-003: Plumbing Revisions ($2,750.00)                  │
│                                                             │
│ Action: ○ Approve All  ○ Reject All  ○ Submit All         │
│                                                             │
│ Notes (applied to all):                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Batch approval for Phase 1 scope items.                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ☐ Maintain existing due dates                              │
│ ☑ Send email notifications                                 │
│ Effective Date: [05/15/2025]                               │
│                                                             │
│                              [Cancel] [Apply to All]       │
└─────────────────────────────────────────────────────────────┘
```

### 7. AttachmentUploadForm
**Component**: `frontend/src/components/domain/change-orders/AttachmentUploadForm.tsx`
**Purpose**: File upload with drag-and-drop and metadata management

#### Upload Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| files | FileList | Yes | Max 10 files, 50MB each | File selection |
| attachmentType | Select | No | Predefined categories | File classification |
| description | Text | No | Max 255 chars | File description |

#### Supported File Types
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, PNG, TIFF, GIF
- Drawings: DWG, PDF
- Spreadsheets: XLS, XLSX, CSV

#### Component Layout
```
┌─ File Attachments ──────────────────────────────────────────┐
│                                                             │
│ ┌─ Drop Zone ───────────────────────────────────────────┐  │
│ │  📎 Drop files here or [Browse Files]                │  │
│ │                                                       │  │
│ │  Max 10 files, 50MB each                            │  │
│ │  Supported: PDF, DOC, JPG, PNG, DWG                 │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ Uploaded Files:                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📄 spec_document.pdf (2.3 MB)             [Remove]     │ │
│ │    Type: [Specification ▼]                              │ │
│ │    Description: [Updated specifications_______________]  │ │
│ │    Status: ✓ Uploaded                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📷 site_photo.jpg (1.8 MB)               [Remove]      │ │
│ │    Type: [Photo ▼]                                     │ │
│ │    Status: ⏳ Uploading... (78%)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Clear All] [Done]            │
└─────────────────────────────────────────────────────────────┘
```

### 8. RelatedItemsForm
**Location**: Modal dialog from change order detail view
**Component**: `frontend/src/components/domain/change-orders/RelatedItemsForm.tsx`
**Purpose**: Link change orders to other project items (RFIs, submittals, etc.)

#### Related Item Fields
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| relatedItemType | Select | Yes | RFI/Submittal/Inspection/Document | Item type |
| relatedItemId | Autocomplete | Yes | Active items only | Item search |
| relationshipType | Select | Yes | Supports/Contradicts/Clarifies | Relationship nature |
| notes | TextArea | No | Max 1000 chars | Relationship context |

#### Form Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Add Related Item                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Item Type: [RFI ▼]                                         │
│                                                             │
│ Search Item:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Search RFIs...___________________________]           │ │
│ │                                                         │ │
│ │ ▼ RFI-045: Carpet Specifications                       │ │
│ │   RFI-046: Electrical Panel Location                   │ │
│ │   RFI-047: Plumbing Fixture Selection                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Relationship: [Supports ▼]                                 │
│                                                             │
│ Notes:                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ This RFI clarified the carpet specifications that      │ │
│ │ led to the material upgrade in this change order.      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Cancel] [Add Relationship]   │
└─────────────────────────────────────────────────────────────┘
```

## Form Validation Rules

### Global Validation Rules
- **Required Fields**: Clear visual indicators (*) and error messages
- **Character Limits**: Real-time counters for text fields
- **Number Validation**: Positive numbers only for quantities and prices
- **Date Validation**: Future dates for due dates, logical date ranges
- **File Upload**: Size limits, type restrictions, virus scanning

### Field-Specific Validation
```typescript
// Example validation schema
const changeOrderSchema = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\s\-_.,()&]+$/ // Alphanumeric + common symbols
  },
  amount: {
    type: 'currency',
    min: 0,
    max: 999999999.99,
    precision: 2
  },
  dueDate: {
    type: 'date',
    min: () => new Date(), // Today or later
    format: 'MM/DD/YYYY'
  },
  lineItems: {
    type: 'array',
    minLength: 1,
    itemSchema: {
      description: { required: true, maxLength: 500 },
      unitPrice: { required: true, type: 'currency', min: 0 }
    }
  }
}
```

### Error Handling Patterns
- **Inline Validation**: Real-time feedback as user types
- **Form-Level Validation**: On submit attempt with scroll to first error
- **API Error Handling**: Clear messages for server-side validation failures
- **Optimistic Updates**: Immediate UI feedback with rollback on error

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical form flow
- Arrow keys for radio button groups
- Enter/Space for button activation
- Escape key to close modals

### Screen Reader Support
- Proper ARIA labels for all form controls
- Field descriptions and error announcements
- Progress indicators for multi-step forms
- Status updates for dynamic content

### Visual Accessibility
- High contrast mode support
- Scalable fonts and UI elements
- Clear focus indicators
- Error states with color + text indicators

This comprehensive forms specification ensures consistent user experience across all change order interactions while maintaining proper validation and accessibility standards.