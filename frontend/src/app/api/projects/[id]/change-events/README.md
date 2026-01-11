# Change Events API Documentation

This directory contains the API endpoints for managing Change Events in the Procore-like system.

## Overview

The Change Events API provides endpoints for:
- Creating and managing change events
- Managing line items within change events
- Uploading and managing attachments
- Tracking audit history
- Converting to RFQs (future implementation)

## Endpoints

### Change Events

#### List Change Events
```
GET /api/projects/{projectId}/change-events
```

Query Parameters:
- `page` (default: 1)
- `limit` (default: 25, max: 100)
- `status` - Filter by status (OPEN, CLOSED, VOID)
- `type` - Filter by type (OWNER_CHANGE, GC_CHANGE, SC_CHANGE)
- `scope` - Filter by scope (IN_SCOPE, OUT_OF_SCOPE)
- `search` - Search in number, title, and description
- `sort` - Sort by field (createdAt, updatedAt, number, title)
- `order` - Sort order (asc, desc)
- `includeDeleted` - Include soft-deleted items (default: false)

#### Create Change Event
```
POST /api/projects/{projectId}/change-events
```

Request Body:
```json
{
  "title": "Phase 1 & 2 Carpet Installation",
  "type": "OWNER_CHANGE",
  "reason": "Design Development",
  "scope": "OUT_OF_SCOPE",
  "origin": "FIELD",
  "description": "Detailed description",
  "expectingRevenue": true,
  "lineItemRevenueSource": "MATCH_LATEST_COST",
  "primeContractId": "uuid-here"
}
```

#### Get Change Event
```
GET /api/projects/{projectId}/change-events/{changeEventId}
```

#### Update Change Event
```
PUT /api/projects/{projectId}/change-events/{changeEventId}
```

#### Delete Change Event
```
DELETE /api/projects/{projectId}/change-events/{changeEventId}
```

### Line Items

#### List Line Items
```
GET /api/projects/{projectId}/change-events/{changeEventId}/line-items
```

#### Create Line Item
```
POST /api/projects/{projectId}/change-events/{changeEventId}/line-items
```

Request Body:
```json
{
  "description": "Carpet Installation - Main Floor",
  "budgetCodeId": "uuid-here",
  "vendorId": "uuid-here",
  "contractId": "uuid-here",
  "unitOfMeasure": "SF",
  "quantity": 500,
  "unitCost": 15.50,
  "revenueRom": 7750.00,
  "costRom": 7500.00,
  "sortOrder": 1
}
```

#### Update Line Item
```
PUT /api/projects/{projectId}/change-events/{changeEventId}/line-items/{lineItemId}
```

#### Delete Line Item
```
DELETE /api/projects/{projectId}/change-events/{changeEventId}/line-items/{lineItemId}
```

#### Bulk Update Line Items (for reordering)
```
PUT /api/projects/{projectId}/change-events/{changeEventId}/line-items
```

Request Body:
```json
[
  { "id": 1, "sortOrder": 0 },
  { "id": 2, "sortOrder": 1 },
  { "id": 3, "sortOrder": 2 }
]
```

### Attachments

#### List Attachments
```
GET /api/projects/{projectId}/change-events/{changeEventId}/attachments
```

#### Upload Attachment
```
POST /api/projects/{projectId}/change-events/{changeEventId}/attachments
```

Request: Multipart form data with `file` field

#### Get Attachment Metadata
```
GET /api/projects/{projectId}/change-events/{changeEventId}/attachments/{attachmentId}
```

#### Download Attachment
```
GET /api/projects/{projectId}/change-events/{changeEventId}/attachments/{attachmentId}/download
```

#### Delete Attachment
```
DELETE /api/projects/{projectId}/change-events/{changeEventId}/attachments/{attachmentId}
```

#### Bulk Delete Attachments
```
DELETE /api/projects/{projectId}/change-events/{changeEventId}/attachments
```

Request Body:
```json
{
  "attachmentIds": [1, 2, 3]
}
```

### History

#### Get Change Event History
```
GET /api/projects/{projectId}/change-events/{changeEventId}/history
```

Query Parameters:
- `page` (default: 1)
- `limit` (default: 50, max: 100)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "details": "Detailed error message"
}
```

For validation errors:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation message"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (business rule violation)
- `500` - Internal Server Error

## Business Rules

1. **Change Event Number**: Auto-generated in format "001", "002", etc.
2. **Status Transitions**: 
   - Only OPEN or VOID change events can be deleted
   - Closed change events cannot have line items added/edited
3. **Audit Trail**: All changes are logged in the history table
4. **Soft Delete**: Change events are soft-deleted (marked with deleted_at timestamp)
5. **Revenue Tracking**: When `expectingRevenue` is true, `lineItemRevenueSource` must be provided

## Authentication

All endpoints require authentication via Supabase Auth. The current user is automatically tracked for:
- Created by
- Updated by
- Change history

## Future Enhancements

1. **RFQ Management**: Create and send RFQs from change events
2. **Change Order Conversion**: Convert approved change events to change orders
3. **Bulk Operations**: Bulk status updates, bulk exports
4. **Advanced Filtering**: Filter by date ranges, created by, etc.
5. **Permissions**: Project-level permission checks
6. **Notifications**: Email notifications for status changes
7. **Webhooks**: Integration with external systems