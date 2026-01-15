# Layout Architecture Refactor Plan

## Overview

This plan eliminates the `ConditionalLayout` anti-pattern by using Next.js route groups properly, removes dead code, and fixes Tailwind/CSS issues blocking ShadCN sidebar installation.

---

## Phase 1: Create Sidebar Layout Component

Extract the sidebar wrapper from ConditionalLayout into a reusable component.

### Create: `components/layout/sidebar-layout.tsx`

```tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import Footer from "@/components/layout/Footer";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <SiteHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Phase 2: Create Route Groups

### New Structure

```
app/
├── layout.tsx                 # Root: providers only (NO sidebar)
├── globals.css
├── (main)/                    # NEW: Main app routes WITH sidebar
│   ├── layout.tsx             # Uses SidebarLayout
│   ├── page.tsx               # Home (moved from root)
│   ├── [projectId]/           # Project routes (moved)
│   ├── billing-periods/       # Moved
│   ├── create-project/        # Moved
│   ├── crawled/               # Moved
│   ├── dashboard3/            # Moved
│   ├── directory/             # Moved
│   ├── docs/                  # Moved
│   └── pipeline/              # Moved
├── (other)/                   # Keep - add sidebar layout
│   └── layout.tsx             # UPDATE: wrap with SidebarLayout
├── (chat)/                    # Keep - add sidebar layout
│   ├── layout.tsx             # NEW: wrap with SidebarLayout
│   └── ai-chat/
│       └── layout.tsx         # NEW: NO sidebar (exception)
├── (tables)/                  # Keep - add sidebar layout
│   └── layout.tsx             # UPDATE: wrap with SidebarLayout
├── (tables-correct)/          # Keep
│   └── layout.tsx             # NEW: wrap with SidebarLayout
├── (tables-incorrect)/        # Keep
│   └── layout.tsx             # NEW: wrap with SidebarLayout
├── auth/                      # Keep as-is (has own layout, no sidebar)
└── api/                       # Keep as-is
```

### Files to Create

| File | Purpose |
|------|---------|
| `(main)/layout.tsx` | Sidebar layout for main routes |
| `(chat)/layout.tsx` | Sidebar layout for chat routes |
| `(chat)/ai-chat/layout.tsx` | No sidebar for AI chat |
| `(tables-correct)/layout.tsx` | Sidebar layout |
| `(tables-incorrect)/layout.tsx` | Sidebar layout |

### Files to Move

| From | To |
|------|-----|
| `app/page.tsx` | `app/(main)/page.tsx` |
| `app/[projectId]/` | `app/(main)/[projectId]/` |
| `app/billing-periods/` | `app/(main)/billing-periods/` |
| `app/create-project/` | `app/(main)/create-project/` |
| `app/crawled/` | `app/(main)/crawled/` |
| `app/dashboard3/` | `app/(main)/dashboard3/` |
| `app/directory/` | `app/(main)/directory/` |
| `app/docs/` | `app/(main)/docs/` |
| `app/pipeline/` | `app/(main)/pipeline/` |

### Files to Update

| File | Change |
|------|--------|
| `app/layout.tsx` | Remove ConditionalLayout, just render children |
| `app/(other)/layout.tsx` | Wrap with SidebarLayout |
| `app/(tables)/layout.tsx` | Wrap with SidebarLayout |

---

## Phase 3: Update Root Layout

### Before (`app/layout.tsx`):
```tsx
<HeaderProvider>
  <ConditionalLayout>{children}</ConditionalLayout>
</HeaderProvider>
```

### After:
```tsx
<HeaderProvider>
  {children}
</HeaderProvider>
```

---

## Phase 4: Delete Dead Code

### Files to Delete

| File | Reason |
|------|--------|
| `components/layout/global-header.tsx` | 0 usages |
| `components/layout/company-header.tsx` | 0 usages |
| `components/layout/AppHeader.tsx` | 0 usages |
| `components/layout/footer2.tsx` | 0 usages |
| `components/layout/conditional-layout.tsx` | Replaced by route groups |

### Update Index Export

Remove deleted components from `components/layout/index.ts`

---

## Phase 5: Fix Tailwind Config (ShadCN Sidebar Support)

### Add to `tailwind.config.ts` colors:

```typescript
sidebar: {
  DEFAULT: "hsl(var(--sidebar))",
  foreground: "hsl(var(--sidebar-foreground))",
  primary: "hsl(var(--sidebar-primary))",
  "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  border: "hsl(var(--sidebar-border))",
  ring: "hsl(var(--sidebar-ring))",
},
```

---

## Phase 6: Clean Up globals.css

### Issues to Fix

1. **Remove `@theme inline` block** (lines 205-232) - Tailwind v4 syntax, not compatible with v3
2. **Remove duplicate class definitions:**
   - `.btn-primary` defined at lines 480 AND 1088
   - `.section-card` defined at lines 162 AND 432
   - `.page-container` defined at lines 154 AND 370
   - `.page-header` defined at lines 158 AND 374
3. **Consolidate `@layer base` blocks** (5 separate blocks → 1)
4. **Move sidebar CSS variables inside `@layer base`** (currently outside at lines 183-203)

### Recommended Structure

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* All CSS variables here */
    /* Including sidebar variables */
  }
  .dark {
    /* Dark mode variables */
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}

@layer components {
  /* All component classes - NO DUPLICATES */
}

@layer utilities {
  /* Custom utilities */
}
```

---

## Implementation Order

1. **Create `sidebar-layout.tsx`** (new component)
2. **Create `(main)/layout.tsx`** (new layout)
3. **Move routes to `(main)/`** (file moves)
4. **Update other route group layouts** (add sidebar)
5. **Create `(chat)/ai-chat/layout.tsx`** (no sidebar exception)
6. **Update `app/layout.tsx`** (remove ConditionalLayout)
7. **Delete dead code** (5 files)
8. **Fix tailwind.config.ts** (add sidebar colors)
9. **Clean globals.css** (remove duplicates, fix structure)
10. **Run quality check** (`npm run quality --prefix frontend`)
11. **Test the app** (verify all routes work)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Route breaking | Move one directory at a time, test after each |
| Import paths | No changes to import paths since we're using route groups |
| CSS regression | Visual comparison before/after |
| Missing sidebar | Test each route group after adding layout |

---

## Verification

After completion:
- [ ] Home page loads with sidebar
- [ ] Project pages load with sidebar
- [ ] `/auth/login` loads WITHOUT sidebar
- [ ] `/ai-chat` loads WITHOUT sidebar
- [ ] All other routes load with sidebar
- [ ] Dark mode works correctly
- [ ] `npm run quality --prefix frontend` passes
- [ ] `npx shadcn@latest add sidebar-02` works

---

## Files Changed Summary

| Action | Count |
|--------|-------|
| Created | 7 files |
| Updated | 5 files |
| Moved | 9 directories |
| Deleted | 5 files |
