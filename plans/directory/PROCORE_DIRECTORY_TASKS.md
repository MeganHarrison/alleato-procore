# Procore Directory Implementation - Complete Task List

## Phase 1: Database Foundation (Priority: Critical)

### 1.1 Schema Creation
- [ ] Create `people` table with user/contact support
- [ ] Create `users_auth` table for auth linkage  
- [ ] Create `project_directory_memberships` table
- [ ] Create `permission_templates` table
- [ ] Create `distribution_groups` and `distribution_group_members` tables
- [ ] Create `user_project_preferences` table
- [ ] Add database indexes for performance
- [ ] Create RLS policies for all new tables

### 1.2 Data Migration
- [ ] Write migration script for existing users → people
- [ ] Create users_auth links for existing users
- [ ] Migrate project_directory → project_directory_memberships
- [ ] Create default permission templates
- [ ] Test migration on staging database
- [ ] Create rollback procedures
- [ ] Execute production migration

### 1.3 Database Types
- [ ] Generate new TypeScript types from Supabase
- [ ] Update frontend type imports
- [ ] Create DTOs for API operations

## Phase 2: Backend Implementation (Priority: High)

### 2.1 Core Services
- [ ] Create `DirectoryService` class
  - [ ] Implement `getPeople()` with filters
  - [ ] Implement `createPerson()`
  - [ ] Implement `updatePerson()`
  - [ ] Implement `deactivatePerson()`
  - [ ] Implement `reactivatePerson()`
  - [ ] Implement company grouping logic
  - [ ] Add pagination support
  - [ ] Add sorting support

### 2.2 Invite Service  
- [ ] Create `InviteService` class
  - [ ] Implement token generation
  - [ ] Implement `sendInvite()`
  - [ ] Implement `resendInvite()`
  - [ ] Implement `acceptInvite()`
  - [ ] Implement `checkInviteStatus()`
  - [ ] Add invite expiration logic
  - [ ] Create email templates

### 2.3 Permission Service
- [ ] Create `PermissionService` class
  - [ ] Implement template CRUD operations
  - [ ] Implement permission checking middleware
  - [ ] Create default system templates
  - [ ] Implement permission inheritance
  - [ ] Add caching for performance

### 2.4 Distribution Group Service
- [ ] Create `DistributionGroupService` class
  - [ ] Implement group CRUD operations
  - [ ] Implement member management
  - [ ] Add bulk member operations
  - [ ] Create group-based notifications

### 2.5 Import/Export Service
- [ ] Create `ImportExportService` class
  - [ ] Implement CSV parsing
  - [ ] Add data validation
  - [ ] Create import mappings
  - [ ] Implement duplicate detection
  - [ ] Add export with filters
  - [ ] Create downloadable templates

## Phase 3: API Routes (Priority: High)

### 3.1 Directory Routes
- [ ] `GET /api/projects/:projectId/directory/people`
- [ ] `POST /api/projects/:projectId/directory/people`
- [ ] `PATCH /api/projects/:projectId/directory/people/:personId`
- [ ] `DELETE /api/projects/:projectId/directory/people/:personId`
- [ ] `POST /api/projects/:projectId/directory/people/:personId/deactivate`
- [ ] `POST /api/projects/:projectId/directory/people/:personId/reactivate`

### 3.2 Invite Routes
- [ ] `POST /api/projects/:projectId/directory/people/:personId/invite`
- [ ] `POST /api/projects/:projectId/directory/people/:personId/reinvite`
- [ ] `GET /api/invites/:token`
- [ ] `POST /api/invites/:token/accept`

### 3.3 Company Routes
- [ ] `GET /api/projects/:projectId/directory/companies`
- [ ] `GET /api/companies`
- [ ] `POST /api/companies`
- [ ] `PATCH /api/companies/:companyId`
- [ ] `POST /api/companies/:companyId/deactivate`

### 3.4 Distribution Group Routes
- [ ] `GET /api/projects/:projectId/directory/groups`
- [ ] `POST /api/projects/:projectId/directory/groups`
- [ ] `PATCH /api/projects/:projectId/directory/groups/:groupId`
- [ ] `DELETE /api/projects/:projectId/directory/groups/:groupId`
- [ ] `POST /api/projects/:projectId/directory/groups/:groupId/members`
- [ ] `DELETE /api/projects/:projectId/directory/groups/:groupId/members/:personId`

### 3.5 Import/Export Routes
- [ ] `POST /api/projects/:projectId/directory/import`
- [ ] `GET /api/projects/:projectId/directory/export`
- [ ] `GET /api/projects/:projectId/directory/import-template`

### 3.6 Permission Routes
- [ ] `GET /api/permission-templates`
- [ ] `POST /api/permission-templates`
- [ ] `PATCH /api/permission-templates/:templateId`
- [ ] `DELETE /api/permission-templates/:templateId`

## Phase 4: Frontend Components (Priority: High)

### 4.1 Core Components
- [ ] Create `DirectoryTable` component
  - [ ] Implement data fetching with SWR
  - [ ] Add loading states
  - [ ] Add error handling
  - [ ] Implement row selection
  - [ ] Add row actions menu
  - [ ] Implement grouping by company
  - [ ] Add expand/collapse for groups

### 4.2 Search & Filter Components
- [ ] Create `DirectorySearch` component
- [ ] Create `DirectoryFilters` component
  - [ ] Add role filter
  - [ ] Add company filter
  - [ ] Add permission template filter
  - [ ] Add status filter
  - [ ] Add date range filters
- [ ] Create `SavedFilters` component
- [ ] Add filter persistence

### 4.3 Column Management
- [ ] Create `ColumnManager` component
  - [ ] Add drag-and-drop reordering
  - [ ] Add show/hide toggles
  - [ ] Add column width adjustment
  - [ ] Add reset to default
  - [ ] Persist preferences per user

### 4.4 Action Components
- [ ] Create `InviteUserButton` component
- [ ] Create `BulkActionsBar` component
- [ ] Create `PersonEditDialog` component
- [ ] Create `CompanyEditDialog` component
- [ ] Create `DistributionGroupDialog` component

### 4.5 Import/Export Components
- [ ] Create `ImportDialog` component
  - [ ] Add file upload
  - [ ] Add mapping interface
  - [ ] Add validation preview
  - [ ] Add error reporting
- [ ] Create `ExportDialog` component
  - [ ] Add format selection
  - [ ] Add filter options
  - [ ] Add field selection

## Phase 5: Pages Implementation (Priority: High)

### 5.1 Main Directory Page
- [ ] Create `/projects/[projectId]/directory/page.tsx`
- [ ] Implement tab navigation
- [ ] Add breadcrumb navigation
- [ ] Add page-level actions
- [ ] Implement responsive layout

### 5.2 Sub-Pages
- [ ] Create users tab content
- [ ] Create contacts tab content
- [ ] Create companies tab content
- [ ] Create distribution groups tab content
- [ ] Create inactive users tab
- [ ] Create inactive contacts tab
- [ ] Create inactive companies tab

### 5.3 Detail/Edit Pages
- [ ] Create `/projects/[projectId]/directory/users/[userId]/edit`
- [ ] Create `/projects/[projectId]/directory/contacts/[contactId]/edit`
- [ ] Create `/projects/[projectId]/directory/companies/[companyId]/edit`
- [ ] Create `/projects/[projectId]/directory/groups/[groupId]/edit`

## Phase 6: Integration & Polish (Priority: Medium)

### 6.1 Email Integration
- [ ] Set up email service (SendGrid/Resend)
- [ ] Create invite email template
- [ ] Create welcome email template
- [ ] Add email preview functionality
- [ ] Implement email tracking

### 6.2 Permission Integration
- [ ] Integrate with existing auth system
- [ ] Update all routes with permission checks
- [ ] Add permission-based UI hiding
- [ ] Create permission denied pages
- [ ] Add audit logging

### 6.3 Performance Optimization
- [ ] Add database query optimization
- [ ] Implement result caching
- [ ] Add lazy loading for large datasets
- [ ] Optimize bundle size
- [ ] Add performance monitoring

### 6.4 Mobile Responsiveness
- [ ] Optimize table for mobile
- [ ] Create mobile-specific layouts
- [ ] Test touch interactions
- [ ] Add mobile gestures
- [ ] Optimize load times

## Phase 7: Testing (Priority: Critical)

### 7.1 Unit Tests
- [ ] Test DirectoryService methods
- [ ] Test InviteService methods
- [ ] Test PermissionService methods
- [ ] Test ImportExportService methods
- [ ] Test API route handlers
- [ ] Test React components
- [ ] Test custom hooks

### 7.2 Integration Tests
- [ ] Test complete invite flow
- [ ] Test permission enforcement
- [ ] Test import/export cycle
- [ ] Test company grouping
- [ ] Test search functionality
- [ ] Test filter combinations

### 7.3 E2E Tests
- [ ] Test user creation flow
- [ ] Test bulk operations
- [ ] Test invite acceptance
- [ ] Test permission changes
- [ ] Test data export
- [ ] Test mobile experience

### 7.4 Performance Tests
- [ ] Load test with 10,000+ records
- [ ] Test search performance
- [ ] Test pagination performance
- [ ] Test concurrent user load
- [ ] Measure API response times

## Phase 8: Documentation (Priority: Medium)

### 8.1 Technical Documentation
- [ ] Document API endpoints
- [ ] Document database schema
- [ ] Document service architecture
- [ ] Create development guide
- [ ] Add inline code documentation

### 8.2 User Documentation
- [ ] Create user guide
- [ ] Add tooltips and help text
- [ ] Create video tutorials
- [ ] Document common workflows
- [ ] Create FAQ section

### 8.3 Admin Documentation
- [ ] Document permission system
- [ ] Create admin guide
- [ ] Document import formats
- [ ] Add troubleshooting guide
- [ ] Create best practices guide

## Phase 9: Deployment (Priority: Critical)

### 9.1 Pre-deployment
- [ ] Run full test suite
- [ ] Perform security audit
- [ ] Check accessibility compliance
- [ ] Review performance metrics
- [ ] Create deployment checklist

### 9.2 Deployment Process
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Perform user acceptance testing
- [ ] Create rollback plan
- [ ] Deploy to production

### 9.3 Post-deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Address critical issues
- [ ] Plan next iterations

## Deliverables Checklist

### Backend Files
- [ ] `/backend/services/DirectoryService.ts`
- [ ] `/backend/services/InviteService.ts`
- [ ] `/backend/services/PermissionService.ts`
- [ ] `/backend/services/DistributionGroupService.ts`
- [ ] `/backend/services/ImportExportService.ts`
- [ ] `/backend/routes/directory.ts`
- [ ] `/backend/middleware/permissions.ts`
- [ ] `/backend/utils/email.ts`

### Frontend Files
- [ ] `/frontend/src/components/directory/DirectoryTable.tsx`
- [ ] `/frontend/src/components/directory/DirectorySearch.tsx`
- [ ] `/frontend/src/components/directory/DirectoryFilters.tsx`
- [ ] `/frontend/src/components/directory/ColumnManager.tsx`
- [ ] `/frontend/src/components/directory/InviteDialog.tsx`
- [ ] `/frontend/src/components/directory/ImportDialog.tsx`
- [ ] `/frontend/src/components/directory/ExportDialog.tsx`
- [ ] `/frontend/src/hooks/useDirectory.ts`
- [ ] `/frontend/src/hooks/usePermissions.ts`

### Database Files
- [ ] `/db/migrations/001_create_people_tables.sql`
- [ ] `/db/migrations/002_create_permission_tables.sql`
- [ ] `/db/migrations/003_create_distribution_groups.sql`
- [ ] `/db/migrations/004_migrate_existing_users.sql`
- [ ] `/db/seeds/permission_templates.sql`

### Test Files
- [ ] `/tests/unit/services/DirectoryService.test.ts`
- [ ] `/tests/unit/services/InviteService.test.ts`
- [ ] `/tests/integration/directory-api.test.ts`
- [ ] `/tests/e2e/directory.spec.ts`
- [ ] `/tests/e2e/invite-flow.spec.ts`
- [ ] `/tests/performance/directory-load.test.ts`

### Documentation Files
- [ ] `/docs/api/directory-endpoints.md`
- [ ] `/docs/architecture/directory-system.md`
- [ ] `/docs/user-guide/directory.md`
- [ ] `/docs/admin-guide/permissions.md`
- [ ] `/README.md` (updated)

## Success Metrics

1. **Functional Completeness**
   - 100% of required features implemented
   - All user stories completed
   - No critical bugs in production

2. **Performance Targets**
   - Page load < 2 seconds
   - Search results < 500ms
   - Support 10,000+ directory entries
   - 99.9% uptime

3. **Quality Metrics**
   - 80%+ test coverage
   - 100% E2E tests passing
   - Zero security vulnerabilities
   - WCAG 2.1 AA compliance

4. **User Satisfaction**
   - 90%+ user satisfaction rating
   - < 5% support tickets
   - Positive user feedback
   - High feature adoption rate