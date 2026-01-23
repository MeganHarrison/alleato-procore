# Alleato PM - Code Patterns & Solutions

This document captures established patterns, conventions, and solutions to prevent reinventing the wheel.

## 🏗️ Architecture Overview

```
Frontend (Next.js 14+)
├── App Router with RSC/Client Components
├── Supabase for Auth & Database
├── shadcn/ui Component Library
└── Tailwind CSS for Styling

Key Libraries:
- @supabase/supabase-js (^2.x)
- @tanstack/react-query (data fetching)
- react-hook-form + zod (forms)
- date-fns (date handling)
```

## 📁 Project Structure Patterns

### Page Structure
```typescript
// app/(main)/[projectId]/feature/page.tsx
export default async function FeaturePage({ params }: { params: { projectId: string } }) {
  // Server-side data fetching
  const data = await fetchServerData(params.projectId);
  return <FeatureClient initialData={data} projectId={params.projectId} />;
}
```

### Client Component Pattern
```typescript
// components/feature/feature-client.tsx
"use client";
export function FeatureClient({ initialData, projectId }) {
  // Client-side state and interactions
}
```

## 🎨 UI Component Patterns

### Modal Pattern (Already Implemented)
```typescript
// Standard modal using shadcn/ui Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Examples:
// - CreateBudgetCodeModal
// - ImportBudgetModal
// - PersonEditDialog
// - UserFormDialog
```

### Data Table Pattern (Standardized)
```typescript
// components/tables/generic-table-factory.tsx provides base
// Pattern used in:
// - DirectCostTable
// - meetings-data-table
// - employees-data-table
// - projects-table
```

### Form Pattern with React Hook Form
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
});

// Examples:
// - DirectCostForm
// - ContractForm
// - budget-line-item-form
```

## 🔌 API Route Patterns

### Standard CRUD Pattern
```typescript
// app/api/projects/[projectId]/resource/route.ts
export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const supabase = createServerClient();
  // Auth check
  // Fetch data
  // Return NextResponse.json(data)
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  // Similar pattern with validation
}
```

### Nested Resource Pattern
```typescript
// Pattern: /api/projects/[projectId]/parent/[parentId]/child/route.ts
// Examples:
// - /contracts/[contractId]/line-items
// - /change-events/[changeEventId]/attachments
// - /directory/groups/[groupId]/members
```

## 💾 Supabase Patterns

### Auth Check Pattern
```typescript
const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### Row Level Security Pattern
```sql
-- All tables use RLS with user_id or org_id checks
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
```

### Type Generation
```bash
# Always regenerate after schema changes
pnpm supabase gen types typescript --project-id [id] > database.types.ts
```

## 🧪 Testing Patterns

### Playwright E2E Pattern
```typescript
// tests/e2e/feature.spec.ts
test.describe("Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    // Standard login flow
  });

  test("should perform action", async ({ page }) => {
    // Test implementation
  });
});
```

### Common Test Helpers
```typescript
// tests/helpers/db.ts - Database cleanup
// tests/helpers/poll.ts - Wait for async operations
// tests/helpers/cleanup.ts - Reset test data
```

## 📋 Common Implementation Recipes

### Recipe: Add New CRUD Feature
1. Create database table with RLS policies
2. Generate TypeScript types
3. Create API routes following standard pattern
4. Create data table component extending generic-table-factory
5. Add form component using react-hook-form
6. Create page with server/client split
7. Add Playwright tests

### Recipe: Add Modal to Page
1. Use Dialog component from shadcn/ui
2. Follow existing modal patterns (see modals/ directory)
3. Handle loading/error states
4. Add to parent component with open/close state

### Recipe: Add New Budget Feature
1. Check existing budget API routes for patterns
2. Use BudgetViewsManager for view management
3. Follow column modal pattern (see budget/modals/*)
4. Update budget context if needed

### Recipe: Add File Upload
1. Use existing attachment patterns (see ChangeEventAttachmentsSection)
2. API routes handle multipart/form-data
3. Store in Supabase Storage
4. Return public URL

## 🎯 Component Reuse Guide

### Existing Reusable Components
```typescript
// Forms
- DirectCostForm - For cost entries
- PersonEditDialog - For user/contact editing
- UserFormDialog - For user management

// Tables
- generic-table-factory - Base for all data tables
- simple-table-page - Quick table setup

// Budget
- BudgetViewsManager - View switching
- ImportBudgetModal - CSV import pattern
- All modals in components/budget/modals/*

// Common
- site-header - Standard header
- app-sidebar - Navigation sidebar
- chatkit-panel - AI chat interface
```

## ⚠️ Known Gotchas & Solutions

### Issue: Hydration Errors
**Solution**: Ensure date formatting and conditional rendering is consistent between server/client

### Issue: Supabase Auth in Server Components
**Solution**: Use createServerClient() not createBrowserClient()

### Issue: Form Validation
**Solution**: Always use zod schemas with zodResolver

### Issue: Table Performance
**Solution**: Use virtualization for large datasets (already implemented in some tables)

## 🔧 Environment Setup

### Required Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Development Commands
```bash
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm test:e2e   # Run Playwright tests
pnpm lint       # Run ESLint
pnpm typecheck  # TypeScript checks
```

## 📚 Key Dependencies & Versions

Check package.json for exact versions, but key ones:
- next: ^14.x or ^15.x (App Router)
- react: ^18.x or ^19.x
- @supabase/supabase-js: ^2.x
- @tanstack/react-query: ^5.x
- react-hook-form: ^7.x
- zod: ^3.x

## 🚀 Quick Start for New Features

1. **Check if pattern exists** - Search this file and existing code
2. **Copy similar implementation** - Find the closest existing feature
3. **Follow naming conventions** - [projectId], camelCase, etc.
4. **Test the pattern** - Run existing tests to verify approach
5. **Document new patterns** - Update this file with novel solutions

---

Last Updated: [Auto-update when modified]
Key Contributors: Review git history for pattern authors