# DESIGN SYSTEM GATE (NON-NEGOTIABLE)

## The Rule

**Design consistency is NON-NEGOTIABLE. Every UI element MUST match the established design system.**

Before writing ANY UI code, you MUST verify it matches existing patterns in the codebase.

---

## Violations That Will Be Rejected

### 1. Color Mismatches
**NEVER use hardcoded colors when design tokens exist.**

| Wrong | Correct |
|-------|---------|
| `bg-orange-500` | `bg-brand` |
| `text-orange-600` | `text-brand` |
| `border-orange-500` | `border-brand` |
| `hover:bg-orange-600` | `hover:bg-brand/90` |

### 2. Typography Inconsistencies
**Page titles MUST use the same styling across all pages.**

Standard page title: `text-2xl sm:text-3xl lg:text-3xl font-semibold`

**NEVER:**
- Use `font-bold` when other pages use `font-semibold`
- Use fixed sizes like `text-2xl` without responsive variants
- Use different font weights across similar components

### 3. Spacing/Padding Inconsistencies
**All page layouts MUST use consistent padding.**

Standard page padding: `px-4 sm:px-6 lg:px-8`

**NEVER:**
- Use `lg:px-12` when other pages use `lg:px-8`
- Mix different padding scales on the same page level

### 4. Component Style Variations
**Similar components MUST look identical.**

Examples:
- All page tabs should use the same underline style
- All primary buttons should use `bg-brand`
- All headers should use the same typography

---

## Before Writing UI Code - Checklist

- [ ] Found an existing similar component/page to reference
- [ ] Verified colors use design tokens (brand, primary, etc.), not hardcoded values
- [ ] Verified typography matches existing pages (size, weight, responsive variants)
- [ ] Verified spacing/padding matches the page header (`px-4 sm:px-6 lg:px-8`)
- [ ] Verified button styles use `bg-brand hover:bg-brand/90` for primary actions

---

## Reference Files

### Design Tokens
- `frontend/src/app/globals.css` - CSS variables including `--brand`

### Page Header Standard
- `frontend/src/components/layout/page-header-unified.tsx` - Standard header layout
- Padding: `px-4 sm:px-6 lg:px-8`
- Title: `text-2xl sm:text-3xl lg:text-3xl font-semibold`

### Tab Style Standard
- Reference: `frontend/src/app/(main)/[projectId]/commitments/page.tsx`
- Underline tabs with `border-b-2`, `border-brand text-brand` for active

### Button Standards
- Primary action: `bg-brand hover:bg-brand/90 text-white`
- Secondary: `variant="outline"`

---

## Incident History

### 2026-01-28: Budget Page Inconsistencies
- Title used `text-2xl font-bold` instead of `text-2xl sm:text-3xl lg:text-3xl font-semibold`
- Buttons used `bg-orange-500` instead of `bg-brand`
- Tabs used animated background instead of underline style
- Padding used `lg:px-12` instead of `lg:px-8`

**User feedback:** "Design consistency matters and you need to pay attention to it."

---

## Enforcement

This gate is checked by reviewing:
1. Any new page or component
2. Any modification to existing UI
3. All pull requests touching frontend code

**Non-compliance = Changes rejected until fixed.**
