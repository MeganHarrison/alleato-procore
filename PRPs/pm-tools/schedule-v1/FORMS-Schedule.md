# Schedule Forms Specification

## Form List

1. **CreateTaskForm** - Create new schedule tasks with all required fields
2. **EditTaskForm** - Edit existing task details and scheduling information
3. **CreateLookaheadForm** - Create new 2-week lookahead planning windows
4. **EditLookaheadForm** - Modify existing lookahead details and date ranges
5. **AssignTaskForm** - Assign users to tasks with role specifications
6. **BulkTaskForm** - Bulk operations for multiple task management
7. **ExportScheduleForm** - Configure schedule export options and formats
8. **ImportTasksForm** - Import tasks from external sources (CSV, Excel)
9. **ScheduleFilterForm** - Advanced filtering controls for schedule views
10. **TaskDependencyForm** - Define task dependencies and relationships

## Form Specifications

### 1. CreateTaskForm

**Purpose**: Create new schedule tasks with comprehensive scheduling and resource information.

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | text | ✅ | min: 1, max: 255 | Task name/title |
| description | textarea | ❌ | max: 2000 | Detailed task description |
| start_date | date | ❌ | future or today | Planned start date |
| end_date | date | ❌ | >= start_date | Planned end date |
| duration_days | number | ❌ | min: 0, max: 9999 | Task duration in days |
| resource_name | text | ❌ | max: 255 | Resource/crew name |
| company_id | select | ❌ | valid company | Associated company |
| parent_task_id | select | ❌ | valid task in project | Parent task for hierarchy |
| priority | select | ❌ | enum: low/medium/high/urgent | Task priority level |
| status | select | ❌ | enum: not_started/in_progress/completed/on_hold/cancelled | Initial task status |
| is_milestone | checkbox | ❌ | boolean | Mark as milestone |
| notes | textarea | ❌ | max: 1000 | Additional notes |
| assignees | multi-select | ❌ | valid users in project | Task assignees |

#### Validation Rules

```typescript
const createTaskSchema = z.object({
  name: z.string().min(1, "Task name is required").max(255, "Task name too long"),
  description: z.string().max(2000, "Description too long").optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  duration_days: z.number().int().min(0).max(9999).optional(),
  resource_name: z.string().max(255).optional(),
  company_id: z.number().int().positive().optional(),
  parent_task_id: z.number().int().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('not_started'),
  is_milestone: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  assignees: z.array(z.number().int().positive()).optional()
}).refine(
  data => !data.start_date || !data.end_date || data.start_date <= data.end_date,
  { message: "End date must be after start date", path: ["end_date"] }
).refine(
  data => !data.duration_days || !data.start_date || !data.end_date ||
    Math.abs((data.end_date.getTime() - data.start_date.getTime()) / (1000 * 60 * 60 * 24)) === data.duration_days,
  { message: "Duration must match date range", path: ["duration_days"] }
);
```

#### Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Create New Task                                    [×]  │
├─────────────────────────────────────────────────────────┤
│ Task Information                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Task Name *                                         │ │
│ │ [________________________________]                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Description                                         │ │
│ │ [________________________________]                 │ │
│ │ [________________________________]                 │ │
│ │ [________________________________]                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Scheduling                                              │
│ ┌───────────────────┐ ┌───────────────────┐             │
│ │ Start Date        │ │ End Date          │             │
│ │ [MM/DD/YYYY]     │ │ [MM/DD/YYYY]     │             │
│ └───────────────────┘ └───────────────────┘             │
│                                                         │
│ ┌───────────────────┐ ┌───────────────────┐             │
│ │ Duration (days)   │ │ Priority          │             │
│ │ [_____]          │ │ [Medium ▼]        │             │
│ └───────────────────┘ └───────────────────┘             │
│                                                         │
│ Resources & Assignment                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Resource Name                                       │ │
│ │ [________________________________]                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────┐ ┌───────────────────┐             │
│ │ Company           │ │ Parent Task       │             │
│ │ [Select Company ▼]│ │ [No Parent ▼]     │             │
│ └───────────────────┘ └───────────────────┘             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Assignees                                           │ │
│ │ [Select Users...] [John Doe] [×] [Jane Smith] [×]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Options                                                 │
│ ☐ Mark as Milestone                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Notes                                               │ │
│ │ [________________________________]                 │ │
│ │ [________________________________]                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                              [Cancel] [Create Task]    │
└─────────────────────────────────────────────────────────┘
```

#### Conditional Logic

1. **Duration Auto-calculation**: When start and end dates are selected, automatically calculate duration
2. **Date Validation**: End date must be >= start date
3. **Parent Task Validation**: Cannot select self or descendant tasks as parent
4. **Company Integration**: Only show companies associated with the current project
5. **Assignee Validation**: Only show users who are members of the current project

### 2. EditTaskForm

**Purpose**: Edit existing task details with change tracking and validation.

#### Form Fields

Same fields as CreateTaskForm plus:

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| completion_percentage | slider | ❌ | 0-100 | Task completion percentage |
| status_reason | textarea | ❌ | max: 500 | Reason for status change |

#### Additional Validation

```typescript
const editTaskSchema = createTaskSchema.extend({
  completion_percentage: z.number().int().min(0).max(100).default(0),
  status_reason: z.string().max(500).optional()
}).refine(
  data => data.status !== 'completed' || data.completion_percentage === 100,
  { message: "Completed tasks must be 100% complete", path: ["completion_percentage"] }
);
```

### 3. CreateLookaheadForm

**Purpose**: Create 2-week lookahead planning windows for schedule management.

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | text | ✅ | min: 1, max: 255 | Lookahead name |
| description | textarea | ❌ | max: 1000 | Lookahead description |
| start_date | date | ✅ | future or today | Lookahead start date |
| end_date | date | ✅ | 14 days from start | Lookahead end date (auto-calculated) |

#### Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Create Lookahead                                   [×]  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Lookahead Name *                                    │ │
│ │ [Two-Week Lookahead - _______________]              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────┐ ┌───────────────────┐             │
│ │ Start Date *      │ │ End Date          │             │
│ │ [MM/DD/YYYY]     │ │ [Auto: +14 days]  │             │
│ └───────────────────┘ └───────────────────┘             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Description                                         │ │
│ │ [________________________________]                 │ │
│ │ [________________________________]                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Tasks in this Lookahead:                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☐ Demo/Make-safe MEP       Jan 15-17               │ │
│ │ ☐ Demo walls               Jan 18-22               │ │
│ │ ☐ Receive permit           Feb 01                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                              [Cancel] [Create]         │
└─────────────────────────────────────────────────────────┘
```

### 4. AssignTaskForm

**Purpose**: Assign users to tasks with specific roles and notification preferences.

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| task_id | hidden | ✅ | valid task | Target task ID |
| user_ids | multi-select | ✅ | valid project users | Users to assign |
| role | select | ✅ | enum: assignee/reviewer/approver/observer | Assignment role |
| email_notifications | checkbox | ❌ | boolean | Enable email notifications |

### 5. BulkTaskForm

**Purpose**: Perform bulk operations on multiple selected tasks.

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| task_ids | hidden | ✅ | array of valid task IDs | Selected tasks |
| operation | select | ✅ | enum: update_status/change_assignee/move_dates/delete | Bulk operation type |
| new_status | select | ❌ | valid status | New status for all tasks |
| new_assignee | select | ❌ | valid user | New assignee for all tasks |
| date_offset | number | ❌ | integer | Days to shift schedule |
| confirmation | checkbox | ✅ | must be true | Confirm bulk operation |

### 6. ExportScheduleForm

**Purpose**: Configure schedule export with format and filtering options.

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| format | radio | ✅ | enum: pdf/excel/csv | Export format |
| date_range | radio | ✅ | enum: all/range/lookahead | Date filter |
| start_date | date | ❌ | valid date | Range start (if range selected) |
| end_date | date | ❌ | >= start_date | Range end (if range selected) |
| include_completed | checkbox | ❌ | boolean | Include completed tasks |
| include_assignees | checkbox | ❌ | boolean | Include assignee information |
| view_type | radio | ✅ | enum: gantt/list/calendar | Export view type |

### 7. ScheduleFilterForm

**Purpose**: Advanced filtering controls for schedule views with real-time updates.

#### Form Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| status_filter | multi-select | ❌ | valid statuses | Filter by task status |
| assignee_filter | multi-select | ❌ | valid users | Filter by assignee |
| company_filter | multi-select | ❌ | valid companies | Filter by company |
| date_range | date-range | ❌ | valid range | Filter by date range |
| priority_filter | multi-select | ❌ | valid priorities | Filter by priority |
| milestone_only | checkbox | ❌ | boolean | Show milestones only |
| search_text | text | ❌ | max: 255 | Search in task names |

#### Form Layout

```
┌─────────────────────────────────────────────────────────┐
│ Filter Schedule                                         │
├─────────────────────────────────────────────────────────┤
│ Quick Filters:                                          │
│ [All Tasks] [My Tasks] [Overdue] [This Week] [Milestones] │
│                                                         │
│ Advanced Filters:                                       │
│ ┌───────────────────┐ ┌───────────────────┐             │
│ │ Status            │ │ Priority          │             │
│ │ ☑ Not Started     │ │ ☐ Low            │             │
│ │ ☑ In Progress     │ │ ☑ Medium         │             │
│ │ ☐ Completed       │ │ ☑ High           │             │
│ │ ☐ On Hold         │ │ ☐ Urgent         │             │
│ └───────────────────┘ └───────────────────┘             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Date Range                                          │ │
│ │ [MM/DD/YYYY] to [MM/DD/YYYY]                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────┐ ┌───────────────────┐             │
│ │ Assignee          │ │ Company           │             │
│ │ [Select Users...] │ │ [Select Companies...] │         │
│ └───────────────────┘ └───────────────────┘             │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Search                                              │ │
│ │ [🔍 Search tasks...]                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                              [Clear All] [Apply]       │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Patterns

### Validation Error Display

1. **Field-level Errors**: Show inline validation errors below each field
2. **Form-level Errors**: Display summary of all errors at the top of the form
3. **Real-time Validation**: Validate fields on blur, not on every keystroke
4. **Success Feedback**: Show clear confirmation when forms are successfully submitted

### Error Message Format

```typescript
interface FormError {
  field: string;
  message: string;
  type: 'validation' | 'server' | 'network';
}

// Example error messages
const errorMessages = {
  required: "This field is required",
  date_range: "End date must be after start date",
  duplicate_name: "A task with this name already exists",
  permission_denied: "You don't have permission to perform this action",
  network_error: "Network error. Please try again."
};
```

### Loading States

All forms should implement:
- Disable form fields during submission
- Show loading spinner on submit button
- Prevent double-submission
- Show progress indicators for multi-step forms

## Accessibility Requirements

### Keyboard Navigation
- All form controls accessible via Tab/Shift+Tab
- Enter key submits forms
- Escape key cancels/closes modals
- Arrow keys navigate within select controls

### Screen Reader Support
- Proper ARIA labels on all form controls
- Field descriptions linked with `aria-describedby`
- Required fields marked with `aria-required="true"`
- Error messages linked with `aria-invalid` and `aria-describedby`

### Visual Design
- High contrast mode support
- Minimum 4.5:1 contrast ratio for text
- Clear focus indicators (2px blue outline)
- Text resizable up to 200% without scrolling

## Form State Management

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CreateTaskForm = () => {
  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'medium',
      status: 'not_started',
      is_milestone: false
    }
  });

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      await createTask(data);
      toast.success('Task created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

### Optimistic Updates

For better UX, implement optimistic updates where appropriate:
- Task status changes
- Assignee updates
- Simple field edits

Revert changes if the server request fails and show appropriate error messages.

This form specification provides a comprehensive foundation for all Schedule feature forms while maintaining consistency with the existing design system and accessibility standards.