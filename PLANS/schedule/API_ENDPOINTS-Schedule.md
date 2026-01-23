# Schedule API Endpoints Specification

## Endpoint Overview

The Schedule API provides comprehensive CRUD operations for project scheduling, including task management, lookahead planning, calendar integration, and export functionality.

### Base URL
All endpoints are prefixed with `/api/projects/[projectId]/schedule/`

### Authentication
All endpoints require valid authentication and project membership.

### Rate Limiting
- Standard endpoints: 100 requests per minute per user
- Export endpoints: 5 requests per minute per user
- Bulk operations: 10 requests per minute per user

## Endpoint Categories

| Category | Endpoint Pattern | Description |
|----------|------------------|-------------|
| Tasks | `/tasks/*` | Task CRUD operations and management |
| Lookaheads | `/lookaheads/*` | Lookahead planning functionality |
| Calendar | `/calendar/*` | Calendar events and aggregation |
| Export | `/export/*` | Schedule data export in various formats |
| Import | `/import/*` | Bulk task import from external sources |

## Detailed Specifications

### 1. Task Management Endpoints

#### 1.1 List Tasks

**Method**: GET
**URL**: `/api/projects/[projectId]/schedule/tasks`
**Purpose**: Retrieve paginated list of project tasks with filtering and sorting

##### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | ❌ | 1 | Page number for pagination |
| limit | number | ❌ | 50 | Items per page (max: 100) |
| status | string[] | ❌ | all | Filter by task status |
| assignee_id | number[] | ❌ | all | Filter by assignee user ID |
| company_id | number[] | ❌ | all | Filter by company ID |
| start_date | date | ❌ | none | Filter tasks starting after this date |
| end_date | date | ❌ | none | Filter tasks ending before this date |
| search | string | ❌ | none | Search in task names and descriptions |
| sort_by | string | ❌ | sequence_number | Sort field (name, start_date, end_date, priority) |
| sort_order | string | ❌ | asc | Sort order (asc, desc) |
| include_completed | boolean | ❌ | true | Include completed tasks |
| view_type | string | ❌ | list | View type (list, gantt, hierarchy) |

##### Response

```json
{
  "tasks": [
    {
      "id": 123,
      "project_id": 456,
      "name": "Demo/Make-safe MEP",
      "description": "Demolition and make-safe of MEP systems",
      "start_date": "2024-01-15",
      "end_date": "2024-01-17",
      "duration_days": 3,
      "resource_name": "MEP Contractor",
      "company_id": 789,
      "company_name": "ABC Contracting",
      "parent_task_id": null,
      "sequence_number": 1,
      "status": "in_progress",
      "completion_percentage": 25,
      "priority": "high",
      "is_milestone": false,
      "is_critical_path": false,
      "notes": "Coordinate with electrical contractor",
      "assignees": [
        {
          "id": 101,
          "user_id": 202,
          "name": "John Doe",
          "email": "john@company.com",
          "role": "assignee"
        }
      ],
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-15T14:30:00Z",
      "created_by": {
        "id": 203,
        "name": "Jane Smith",
        "email": "jane@company.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": {
    "status": ["not_started", "in_progress"],
    "assignee_id": [202],
    "start_date": "2024-01-01"
  }
}
```

##### Error Responses

```json
// 400 - Invalid parameters
{
  "error": "Invalid request parameters",
  "details": {
    "limit": ["Must be between 1 and 100"],
    "sort_by": ["Must be one of: name, start_date, end_date, priority, sequence_number"]
  }
}

// 403 - Access denied
{
  "error": "Access denied",
  "message": "You are not a member of this project"
}

// 404 - Project not found
{
  "error": "Project not found",
  "message": "Project with ID 456 does not exist"
}
```

#### 1.2 Get Task Details

**Method**: GET
**URL**: `/api/projects/[projectId]/schedule/tasks/[taskId]`
**Purpose**: Retrieve detailed information about a specific task

##### Response

```json
{
  "task": {
    "id": 123,
    "project_id": 456,
    "name": "Demo/Make-safe MEP",
    "description": "Demolition and make-safe of MEP systems",
    "start_date": "2024-01-15",
    "end_date": "2024-01-17",
    "duration_days": 3,
    "resource_name": "MEP Contractor",
    "company_id": 789,
    "company": {
      "id": 789,
      "name": "ABC Contracting",
      "type": "subcontractor"
    },
    "parent_task_id": null,
    "parent_task": null,
    "child_tasks": [
      {
        "id": 124,
        "name": "Disconnect electrical systems",
        "status": "completed"
      }
    ],
    "sequence_number": 1,
    "status": "in_progress",
    "completion_percentage": 25,
    "priority": "high",
    "is_milestone": false,
    "is_critical_path": false,
    "notes": "Coordinate with electrical contractor",
    "assignees": [
      {
        "id": 101,
        "user_id": 202,
        "user": {
          "id": 202,
          "name": "John Doe",
          "email": "john@company.com",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "role": "assignee",
        "assigned_at": "2024-01-10T10:00:00Z",
        "email_notifications": true
      }
    ],
    "dependencies": [
      {
        "id": 125,
        "predecessor_task_id": 122,
        "predecessor_task_name": "Site preparation",
        "dependency_type": "finish_to_start",
        "lag_days": 0
      }
    ],
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z",
    "created_by": {
      "id": 203,
      "name": "Jane Smith",
      "email": "jane@company.com"
    },
    "history": [
      {
        "id": 301,
        "changed_at": "2024-01-15T14:30:00Z",
        "changed_by": "John Doe",
        "field": "completion_percentage",
        "old_value": "0",
        "new_value": "25",
        "reason": "Work started on electrical disconnect"
      }
    ]
  }
}
```

#### 1.3 Create Task

**Method**: POST
**URL**: `/api/projects/[projectId]/schedule/tasks`
**Purpose**: Create a new schedule task

##### Request Body

```json
{
  "name": "HVAC Rough-In",
  "description": "Install HVAC ductwork and equipment rough-in",
  "start_date": "2024-02-10",
  "end_date": "2024-02-20",
  "duration_days": 11,
  "resource_name": "HVAC Contractor",
  "company_id": 790,
  "parent_task_id": null,
  "priority": "medium",
  "status": "not_started",
  "is_milestone": false,
  "notes": "Coordinate with electrical and plumbing",
  "assignees": [202, 204]
}
```

##### Validation Schema

```typescript
const createTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  duration_days: z.number().int().min(0).max(9999).optional(),
  resource_name: z.string().max(255).optional(),
  company_id: z.number().int().positive().optional(),
  parent_task_id: z.number().int().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('not_started'),
  is_milestone: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  assignees: z.array(z.number().int().positive()).optional()
});
```

##### Response

```json
{
  "task": {
    "id": 126,
    "project_id": 456,
    "name": "HVAC Rough-In",
    "description": "Install HVAC ductwork and equipment rough-in",
    "start_date": "2024-02-10",
    "end_date": "2024-02-20",
    "duration_days": 11,
    "resource_name": "HVAC Contractor",
    "company_id": 790,
    "parent_task_id": null,
    "sequence_number": 8,
    "status": "not_started",
    "completion_percentage": 0,
    "priority": "medium",
    "is_milestone": false,
    "is_critical_path": false,
    "notes": "Coordinate with electrical and plumbing",
    "assignees": [
      {
        "id": 102,
        "user_id": 202,
        "user": {
          "id": 202,
          "name": "John Doe",
          "email": "john@company.com"
        },
        "role": "assignee"
      }
    ],
    "created_at": "2024-01-18T10:00:00Z",
    "updated_at": "2024-01-18T10:00:00Z",
    "created_by": {
      "id": 201,
      "name": "Current User",
      "email": "user@company.com"
    }
  }
}
```

#### 1.4 Update Task

**Method**: PUT
**URL**: `/api/projects/[projectId]/schedule/tasks/[taskId]`
**Purpose**: Update an existing task

##### Request Body

```json
{
  "name": "HVAC Rough-In (Updated)",
  "completion_percentage": 50,
  "status": "in_progress",
  "notes": "50% complete - main trunk lines installed",
  "status_reason": "Work progressing on schedule"
}
```

##### Response

Same format as Create Task response with updated fields.

#### 1.5 Delete Task

**Method**: DELETE
**URL**: `/api/projects/[projectId]/schedule/tasks/[taskId]`
**Purpose**: Soft delete a task (sets deleted_at timestamp)

##### Response

```json
{
  "success": true,
  "message": "Task deleted successfully",
  "task_id": 126
}
```

### 2. Lookahead Management Endpoints

#### 2.1 List Lookaheads

**Method**: GET
**URL**: `/api/projects/[projectId]/schedule/lookaheads`
**Purpose**: Retrieve project lookahead planning windows

##### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | ❌ | all | Filter by status (draft, published, completed) |
| current_only | boolean | ❌ | false | Only show current/future lookaheads |

##### Response

```json
{
  "lookaheads": [
    {
      "id": 1,
      "project_id": 456,
      "name": "Two-Week Lookahead - January 15-28, 2024",
      "description": "Focusing on demolition activities and permit acquisition",
      "start_date": "2024-01-15",
      "end_date": "2024-01-28",
      "status": "published",
      "task_count": 5,
      "tasks": [
        {
          "id": 123,
          "name": "Demo/Make-safe MEP",
          "start_date": "2024-01-15",
          "end_date": "2024-01-17",
          "status": "in_progress"
        }
      ],
      "created_at": "2024-01-10T10:00:00Z",
      "created_by": {
        "id": 201,
        "name": "Project Manager",
        "email": "pm@company.com"
      }
    }
  ]
}
```

#### 2.2 Create Lookahead

**Method**: POST
**URL**: `/api/projects/[projectId]/schedule/lookaheads`
**Purpose**: Create a new 2-week lookahead planning window

##### Request Body

```json
{
  "name": "Two-Week Lookahead - February 1-14, 2024",
  "description": "Focus on framing and MEP rough-in coordination",
  "start_date": "2024-02-01",
  "end_date": "2024-02-14",
  "status": "draft"
}
```

### 3. Calendar Integration Endpoints

#### 3.1 Get Calendar Events

**Method**: GET
**URL**: `/api/projects/[projectId]/schedule/calendar`
**Purpose**: Retrieve calendar events for specified date range

##### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | date | ✅ | none | Start of date range |
| end_date | date | ✅ | none | End of date range |
| view | string | ❌ | month | Calendar view (month, week, day) |
| include_tasks | boolean | ❌ | true | Include task start/end as events |
| include_milestones | boolean | ❌ | true | Include milestone events |

##### Response

```json
{
  "events": [
    {
      "id": 301,
      "title": "MEP Demo Start",
      "start": "2024-01-15",
      "end": "2024-01-15",
      "allDay": true,
      "type": "task_start",
      "color": "#3B82F6",
      "task_id": 123,
      "task_name": "Demo/Make-safe MEP",
      "resource": "MEP Contractor"
    },
    {
      "id": 302,
      "title": "Permit Approval Due",
      "start": "2024-02-01",
      "end": "2024-02-01",
      "allDay": true,
      "type": "milestone",
      "color": "#EF4444",
      "task_id": 127,
      "priority": "urgent"
    },
    {
      "id": 303,
      "title": "Plumbing Inspection",
      "start": "2024-02-09T10:00:00",
      "end": "2024-02-09T12:00:00",
      "allDay": false,
      "type": "inspection",
      "color": "#10B981",
      "description": "City inspector arrives for plumbing check"
    }
  ],
  "view_info": {
    "start_date": "2024-01-15",
    "end_date": "2024-02-15",
    "total_events": 15,
    "tasks_included": 8,
    "milestones_included": 3,
    "custom_events": 4
  }
}
```

#### 3.2 Create Calendar Event

**Method**: POST
**URL**: `/api/projects/[projectId]/schedule/calendar/events`
**Purpose**: Create a custom calendar event

##### Request Body

```json
{
  "title": "Safety Meeting",
  "description": "Weekly safety meeting with all trades",
  "event_date": "2024-01-22",
  "start_time": "07:00",
  "end_time": "08:00",
  "all_day": false,
  "event_type": "meeting",
  "priority": "medium",
  "color": "#8B5CF6"
}
```

### 4. Export Endpoints

#### 4.1 Export Schedule

**Method**: POST
**URL**: `/api/projects/[projectId]/schedule/export`
**Purpose**: Export schedule data in various formats

##### Request Body

```json
{
  "format": "pdf",
  "view_type": "gantt",
  "date_range": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
  },
  "filters": {
    "include_completed": false,
    "status": ["not_started", "in_progress"],
    "assignee_ids": [202, 204]
  },
  "options": {
    "include_assignees": true,
    "include_notes": false,
    "page_size": "letter",
    "orientation": "landscape"
  }
}
```

##### Response

```json
{
  "export_id": "exp_123456789",
  "status": "processing",
  "estimated_completion": "2024-01-18T10:05:00Z",
  "download_url": null,
  "expires_at": "2024-01-25T10:00:00Z"
}
```

#### 4.2 Get Export Status

**Method**: GET
**URL**: `/api/projects/[projectId]/schedule/export/[exportId]`
**Purpose**: Check export processing status and get download link

##### Response

```json
{
  "export_id": "exp_123456789",
  "status": "completed",
  "format": "pdf",
  "file_size": 2048576,
  "download_url": "https://storage.example.com/exports/schedule_456_20240118.pdf",
  "created_at": "2024-01-18T10:00:00Z",
  "completed_at": "2024-01-18T10:03:45Z",
  "expires_at": "2024-01-25T10:00:00Z"
}
```

### 5. Import Endpoints

#### 5.1 Import Tasks

**Method**: POST
**URL**: `/api/projects/[projectId]/schedule/import`
**Purpose**: Bulk import tasks from CSV/Excel file

##### Request Body (multipart/form-data)

```
file: [CSV/Excel file]
options: {
  "mapping": {
    "name": "Task Name",
    "start_date": "Start Date",
    "end_date": "Finish Date",
    "resource": "Resource Names"
  },
  "skip_header_row": true,
  "default_status": "not_started"
}
```

##### Response

```json
{
  "import_id": "imp_123456789",
  "status": "processing",
  "total_rows": 150,
  "processed_rows": 0,
  "successful_imports": 0,
  "failed_imports": 0,
  "errors": [],
  "estimated_completion": "2024-01-18T10:05:00Z"
}
```

#### 5.2 Get Import Status

**Method**: GET
**URL**: `/api/projects/[projectId]/schedule/import/[importId]`
**Purpose**: Check import processing status and results

##### Response

```json
{
  "import_id": "imp_123456789",
  "status": "completed",
  "total_rows": 150,
  "processed_rows": 150,
  "successful_imports": 147,
  "failed_imports": 3,
  "errors": [
    {
      "row": 5,
      "error": "Invalid date format in Start Date column",
      "data": {"Task Name": "Invalid Task", "Start Date": "not-a-date"}
    }
  ],
  "created_tasks": [
    {
      "id": 128,
      "name": "New Imported Task",
      "row": 1
    }
  ],
  "completed_at": "2024-01-18T10:03:45Z"
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error type identifier",
  "message": "Human-readable error message",
  "details": {
    "field1": ["Specific validation error"],
    "field2": ["Another validation error"]
  },
  "request_id": "req_123456789",
  "timestamp": "2024-01-18T10:00:00Z"
}
```

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User lacks permission for this action |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate name) |
| 422 | Unprocessable Entity | Validation errors in request data |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Rate Limiting

### Limits by Endpoint Category

| Category | Limit | Window | Headers |
|----------|-------|--------|---------|
| Read operations (GET) | 100/min | 60 seconds | X-RateLimit-* |
| Write operations (POST/PUT) | 50/min | 60 seconds | X-RateLimit-* |
| Delete operations | 20/min | 60 seconds | X-RateLimit-* |
| Export operations | 5/min | 60 seconds | X-RateLimit-* |
| Bulk operations | 10/min | 60 seconds | X-RateLimit-* |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642598400
X-RateLimit-Window: 60
```

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Token must include project membership claim
- Refresh tokens automatically handled by client

### Authorization
- Project-level access control enforced
- Role-based permissions for sensitive operations
- Audit logging for all write operations

### Data Validation
- Comprehensive input validation using Zod schemas
- SQL injection prevention through parameterized queries
- XSS prevention through proper encoding

### HTTPS Requirements
- All API calls must use HTTPS in production
- Enforce TLS 1.2 minimum
- HSTS headers included in responses

This API specification provides a complete foundation for the Schedule feature backend implementation while maintaining security, performance, and usability standards.