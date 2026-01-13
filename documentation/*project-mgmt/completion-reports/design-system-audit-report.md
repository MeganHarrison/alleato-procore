# Design System Audit Report
**Date:** 2026-01-06
**Auditor:** Design System Auditor Agent
**Scope:** Full codebase scan for hardcoded color violations

---

## Executive Summary

**CRITICAL FINDING:** The codebase contains **1,363 hardcoded color class violations** across 100+ files.

These violations are classified as **🚨 BLOCKER** per the design system auditor rules:
- Hardcoded text colors (e.g., `text-blue-500`, `text-gray-600`)
- Should use design tokens (`text-primary`, `tone="muted"`)
- Should use Text component with consistent sizing
- Should use Badge component variants instead of custom color classes

---

## Violation Breakdown

### Top 20 Files by Violation Count

| File | Violations | Priority |
|------|------------|----------|
| `app/executive/EXAMPLE_DASHBOARD.tsx` | 41 | HIGH - User-facing dashboard |
| `app/privacy/page.tsx` | 32 | MEDIUM - Legal page |
| `components/budget/modals/BudgetModificationsModal.tsx` | 30 | HIGH - Budget feature |
| `components/domain/contracts/CreateSubcontractForm.tsx` | 29 | HIGH - Contracts feature |
| `components/project-home/project-info-card.tsx` | 28 | HIGH - Project home |
| `components/budget/modals/PendingCostChangesModal.tsx` | 28 | HIGH - Budget feature |
| `components/budget/modals/DirectCostsModal.tsx` | 27 | HIGH - Budget feature |
| `components/budget/modals/CommittedCostsModal.tsx` | 26 | HIGH - Budget feature |
| `app/(tables)/users/page.tsx` | 26 | MEDIUM - Admin page |
| `components/portfolio/projects-table.tsx` | 25 | HIGH - Portfolio view |
| `app/[projectId]/budget-v2/page.tsx` | 25 | HIGH - Budget V2 |
| `app/components/page.tsx` | 24 | LOW - Component showcase |
| `app/(tables)/drawings/page.tsx` | 24 | MEDIUM - Drawings page |
| `components/domain/contracts/CreatePurchaseOrderForm.tsx` | 23 | HIGH - Contracts feature |
| `components/budget/original-budget-edit-modal.tsx` | 22 | HIGH - Budget feature |
| `components/budget/budget-line-item-modal.tsx` | 22 | HIGH - Budget feature |
| `components/budget/budget-line-item-form.tsx` | 22 | HIGH - Budget feature |
| `app/crawled-pages/page.tsx` | 22 | LOW - Admin tool |
| `app/[projectId]/home/financial-toggles.tsx` | 22 | HIGH - Project home |
| `app/modal-demo/page.tsx` | 21 | LOW - Demo page |

---

## Remediation Strategy

### Phase 1: Critical User-Facing Pages (Priority: HIGH)
**Target:** 500 violations across 25 files
**Impact:** End-user experience, brand consistency

Files to fix:
- Executive dashboard
- Budget pages and modals (all budget components)
- Project home and info cards
- Contracts pages and forms
- Portfolio views
- Punch list
- Photos, drawings, users pages

### Phase 2: Table Components (Priority: HIGH)
**Target:** 200 violations across 15 files
**Impact:** Data presentation consistency

Files to fix:
- All remaining data table components
- Table configuration files
- Generic table factories

### Phase 3: Administrative & Support Pages (Priority: MEDIUM)
**Target:** 400 violations across 40 files
**Impact:** Internal tools, admin functions

Files to fix:
- Crawled pages
- Privacy/legal pages
- Settings pages
- Admin tools

### Phase 4: Demo & Example Pages (Priority: LOW)
**Target:** 263 violations across 20 files
**Impact:** Documentation, examples

Files to fix:
- Component showcase
- Example dashboards
- Demo pages
- Modal demos

---

## Common Violation Patterns

### Pattern 1: Status Badges with Hardcoded Colors
```typescript
// ❌ BEFORE (VIOLATION)
<Badge className="bg-green-100 text-green-800">Active</Badge>
<Badge className="bg-red-100 text-red-800">Cancelled</Badge>

// ✅ AFTER (COMPLIANT)
<Badge variant="success">Active</Badge>
<Badge variant="destructive">Cancelled</Badge>
```

### Pattern 2: Muted Text with Hardcoded Gray
```typescript
// ❌ BEFORE (VIOLATION)
<p className="text-gray-500">No data available</p>
<span className="text-gray-600">Secondary info</span>

// ✅ AFTER (COMPLIANT)
<Text tone="muted" size="sm">No data available</Text>
<Text tone="muted" size="sm">Secondary info</Text>
```

### Pattern 3: Links with Hardcoded Blue
```typescript
// ❌ BEFORE (VIOLATION)
<a href={url} className="text-blue-600 hover:text-blue-800">Link</a>

// ✅ AFTER (COMPLIANT)
<a href={url} className="text-primary hover:underline">
  <Text as="span" size="sm">Link</Text>
</a>
```

### Pattern 4: Error Messages with Hardcoded Red
```typescript
// ❌ BEFORE (VIOLATION)
<p className="text-red-600">Error: {message}</p>

// ✅ AFTER (COMPLIANT)
<Text tone="destructive" size="sm">Error: {message}</Text>
```

### Pattern 5: Success Messages with Hardcoded Green
```typescript
// ❌ BEFORE (VIOLATION)
<CheckCircle className="h-4 w-4 text-green-600" />

// ✅ AFTER (COMPLIANT)
<CheckCircle className="h-4 w-4 text-success" />
```

---

## Design Token Reference

### Text Colors
- `text-primary` - Links, primary actions, emphasis
- `text-destructive` - Errors, delete actions, warnings
- `text-success` - Success states, completed items
- `text-warning` - Warning states, caution
- `text-muted-foreground` - Secondary text (via `tone="muted"`)

### Badge Variants
- `variant="default"` - Standard badge
- `variant="secondary"` - Secondary badge
- `variant="success"` - Success/completed states
- `variant="destructive"` - Error/critical states
- `variant="warning"` - Warning states
- `variant="outline"` - Outlined badge

### Text Component Props
- `size="sm"` - Small text (default for tables/cards)
- `size="base"` - Base text
- `size="lg"` - Large text
- `tone="muted"` - Muted/secondary text
- `tone="destructive"` - Error text
- `weight="medium"` - Medium weight
- `weight="semibold"` - Semibold weight

---

## Enforcement

### Pre-Commit Hook
The pre-commit hook will **BLOCK** commits with these violations once this audit is remediated.

### CI/CD
GitHub Actions will **FAIL** PRs with design system violations.

### Design System Auditor Agent
The agent will flag these as **🚨 BLOCKER** in all code reviews.

---

## Next Steps

1. **Immediate:** Begin Phase 1 remediation (critical user-facing pages)
2. **Week 1:** Complete Phase 1 + Phase 2
3. **Week 2:** Complete Phase 3
4. **Week 3:** Complete Phase 4 + verification
5. **Ongoing:** Enforce via hooks and CI/CD

---

## Compliance Target

**Goal:** 100% design system compliance for text colors and typography
**Current:** 0% (1,363 violations)
**Target Date:** End of Week 3

---

*This audit was generated automatically by the Design System Auditor Agent.*
