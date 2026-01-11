# Design System Guide

> Quick reference for developers building with the Alleato-Procore design system.

## Table of Contents
- [Core Principles](#core-principles)
- [Color System](#color-system)
- [Spacing System](#spacing-system)
- [Typography](#typography)
- [Components](#components)
- [Common Patterns](#common-patterns)
- [ESLint Rules](#eslint-rules)

---

## Core Principles

### 1. Use Components, Not Primitives
❌ **Don't:**
```tsx
<div className="rounded-md border border-neutral-200 bg-white p-6">
  <h2 className="text-xl font-semibold">Title</h2>
  <p className="text-neutral-600">Content</p>
</div>
```

✅ **Do:**
```tsx
<Card>
  <CardHeader>
    <Heading level={2}>Title</Heading>
  </CardHeader>
  <CardContent>
    <Text>Content</Text>
  </CardContent>
</Card>
```

### 2. Use Semantic Tokens, Not Direct Colors
❌ **Don't:**
```tsx
<p className="text-gray-600 bg-gray-100">Muted text</p>
```

✅ **Do:**
```tsx
<Text className="text-muted-foreground bg-muted">Muted text</Text>
```

### 3. Follow the 8px Grid System
❌ **Don't:**
```tsx
<div className="p-[10px] mb-[15px] gap-[7px]">
```

✅ **Do:**
```tsx
<div className="p-4 mb-6 gap-2">
  {/* p-4 = 16px, mb-6 = 24px, gap-2 = 8px */}
</div>
```

---

## Color System

### Semantic Tokens
Use these instead of direct color names:

| Token | Usage | Example |
|-------|-------|---------|
| `text-foreground` | Primary text | Body text, headings |
| `text-muted-foreground` | Secondary text | Captions, labels, placeholders |
| `bg-background` | Page background | Main content area |
| `bg-muted` | Subtle backgrounds | Table headers, disabled states |
| `bg-accent` | Hover states | Hover on table rows, cards |
| `text-primary` | Links, CTAs | Hyperlinks, primary actions |
| `text-destructive` | Errors | Error messages, delete buttons |
| `border` | Borders | Card borders, dividers |

### Status Colors
For status indicators, use semantic variants:

| Status | Badge Variant | Color Token |
|--------|---------------|-------------|
| Success | `variant="success"` | `text-status-success` |
| Warning | `variant="warning"` | `text-status-warning` |
| Error | `variant="destructive"` | `text-status-error` |
| Info | `variant="default"` | `text-status-info` |

**Example:**
```tsx
// Badge component
<Badge variant="success">Approved</Badge>

// Custom element
<div className="text-status-success">✓ Completed</div>
```

---

## Spacing System

### Tailwind Scale (8px Grid)
| Class | Pixels | Rem | Usage |
|-------|--------|-----|-------|
| `p-0.5` | 2px | 0.125rem | Tiny gaps |
| `p-1` | 4px | 0.25rem | Minimal padding |
| `p-2` | 8px | 0.5rem | Tight spacing |
| `p-4` | 16px | 1rem | **Default spacing** |
| `p-6` | 24px | 1.5rem | Comfortable spacing |
| `p-8` | 32px | 2rem | Generous spacing |
| `p-12` | 48px | 3rem | Section spacing |

### CSS Variables (Semantic Spacing)
```tsx
// For card padding
<Card className="p-[var(--card-padding)]">

// For section gaps
<div className="mb-[var(--section-gap)]">

// For item groups
<div className="gap-[var(--group-gap)]">
```

---

## Typography

### Heading Component
```tsx
import { Heading } from '@/components/ui/heading'

<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection</Heading>
```

### Text Component
```tsx
import { Text } from '@/components/ui/text'

<Text size="lg" weight="medium">Large text</Text>
<Text tone="muted">Secondary text</Text>
<Text as="span">Inline text</Text>
```

### Text Sizes
| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Tiny labels, metadata |
| `text-sm` | 14px | Secondary text, captions |
| `text-base` | 16px | **Default body text** |
| `text-lg` | 18px | Emphasized text |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Section headings |
| `text-3xl` | 30px | Page titles |

---

## Components

### Core UI Components
| Component | Import | Usage |
|-----------|--------|-------|
| `Button` | `@/components/ui/button` | All clickable actions |
| `Card` | `@/components/ui/card` | Content containers |
| `Badge` | `@/components/ui/badge` | Status indicators |
| `Heading` | `@/components/ui/heading` | All headings (h1-h6) |
| `Text` | `@/components/ui/text` | All body text |
| `Input` | `@/components/ui/input` | Form inputs |
| `Table` | `@/components/ui/table` | Data tables |

### Layout Components
| Component | Import | Usage |
|-----------|--------|-------|
| `Stack` | `@/components/ui/stack` | Vertical layouts |
| `Inline` | `@/components/ui/inline` | Horizontal layouts |
| `Grid` | `@/components/ui/grid` | Grid layouts |
| `Container` | `@/components/ui/container` | Max-width containers |
| `PageHeader` | `@/components/layout` | Page headers |

---

## Common Patterns

### Table with Hover
```tsx
<TableRow className="hover:bg-accent">
  <TableCell>Content</TableCell>
</TableRow>
```

### Status Badge Mapping
```tsx
const getStatusVariant = (status: string) => {
  const variants = {
    'approved': 'success',
    'pending': 'warning',
    'rejected': 'destructive',
    'draft': 'secondary',
  };
  return variants[status] || 'outline';
};

<Badge variant={getStatusVariant(item.status)}>
  {item.status}
</Badge>
```

### Empty State
```tsx
<div className="text-center py-12">
  <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
  <Heading level={3} className="mb-2">No items found</Heading>
  <Text className="text-muted-foreground mb-4">
    Get started by creating your first item.
  </Text>
  <Button>Create Item</Button>
</div>
```

### Card with Header
```tsx
<Card>
  <CardHeader className="border-b">
    <Heading level={3}>Section Title</Heading>
  </CardHeader>
  <CardContent>
    <Text>Content goes here</Text>
  </CardContent>
</Card>
```

---

## ESLint Rules

The design system is enforced with custom ESLint rules:

### 1. `design-system/no-hardcoded-colors` (ERROR)
**Prevents:** Hardcoded hex, rgb, or hsl colors
```tsx
// ❌ ERROR
<div className="text-#ff0000">Red text</div>
<div style={{ color: '#ff0000' }}>Red text</div>

// ✅ CORRECT
<div className="text-destructive">Red text</div>
```

### 2. `design-system/no-arbitrary-spacing` (ERROR)
**Prevents:** Arbitrary spacing values
```tsx
// ❌ ERROR
<div className="p-[10px] m-[1.5rem]">

// ✅ CORRECT
<div className="p-4 m-6">
<div className="p-[var(--card-padding)]">
```

### 3. `design-system/require-semantic-colors` (WARN)
**Encourages:** Semantic tokens over direct color names
```tsx
// ⚠️ WARNING
<div className="text-gray-600 bg-gray-100">

// ✅ PREFERRED
<div className="text-muted-foreground bg-muted">
```

---

## Quick Migration Checklist

When migrating a component:

- [ ] Replace manual card divs with `<Card>` component
- [ ] Replace `<h1>`-`<h6>` with `<Heading level={n}>`
- [ ] Replace `<p>` with `<Text>`
- [ ] Replace `text-gray-*` with semantic tokens
- [ ] Replace `bg-gray-*` with `bg-muted` or `bg-accent`
- [ ] Replace hardcoded status colors with Badge variants
- [ ] Replace arbitrary spacing with Tailwind scale or CSS variables
- [ ] Replace `hover:bg-gray-50` with `hover:bg-accent`
- [ ] Replace link colors with `text-primary hover:text-primary/80`

---

## Resources

- **Component Catalog**: `src/components/ui/README.md`
- **Design Tokens**: `src/app/globals.css` (lines 30-113)
- **ESLint Plugin**: `eslint-plugin-design-system/`
- **Migration Guide**: `.claude/design-audit/MIGRATION-GUIDE.md`

---

## Getting Help

Run the design check command:
```bash
npm run lint
```

Common errors and their fixes will be shown inline with the code.
