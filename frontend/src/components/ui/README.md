# Design System Components

> Core UI components for the Alleato-Procore design system

## Component Catalog

### Layout Components

#### Card
Versatile content container with semantic sections.

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader className="border-b">
    <Heading level={3}>Title</Heading>
  </CardHeader>
  <CardContent>
    <Text>Main content goes here</Text>
  </CardContent>
  <CardFooter className="border-t">
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Props:**
- `className`: Additional CSS classes

#### Grid
Multi-column responsive layout.

```tsx
import { Grid } from '@/components/ui/grid'

<Grid cols={3} gap="md">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</Grid>

// Responsive cols
<Grid cols={{ base: 1, sm: 2, lg: 3 }}>
  {/* ... */}
</Grid>
```

**Props:**
- `cols`: Number of columns or responsive object (1-12)
- `gap`: Spacing between items (xs, sm, md, lg, xl)
- `align`: Vertical alignment (start, center, end, stretch)
- `justify`: Horizontal alignment (start, center, end, between, around)
- `as`: HTML element (default: 'div')

#### Stack
Vertical layout with consistent spacing.

```tsx
import { Stack } from '@/components/ui/stack'

<Stack gap="md" align="center">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
  <Text>Item 3</Text>
</Stack>
```

**Props:**
- `gap`: Spacing between items (xs, sm, md, lg, xl)
- `align`: Alignment (start, center, end, stretch)
- `as`: HTML element (default: 'div')

#### Inline
Horizontal layout with consistent spacing.

```tsx
import { Inline } from '@/components/ui/inline'

<Inline gap="sm" align="center">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Inline>
```

**Props:**
- `gap`: Spacing between items (xs, sm, md, lg, xl)
- `align`: Alignment (start, center, end, baseline)
- `wrap`: Enable wrapping (default: true)
- `as`: HTML element (default: 'div')

#### Panel
Simple grouped content surface (lighter than Card).

```tsx
import { Panel } from '@/components/ui/panel'

<Panel variant="bordered" padding="md">
  <Text>Panel content</Text>
</Panel>
```

**Props:**
- `variant`: Visual style (default, bordered, elevated, ghost)
- `padding`: Internal padding (none, sm, md, lg)

---

### Typography Components

#### Heading
Semantic heading component with consistent styling.

```tsx
import { Heading } from '@/components/ui/heading'

<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection</Heading>
```

**Props:**
- `level`: Heading level (1-6)
- `className`: Additional CSS classes
- `children`: Content

**Sizes:**
- h1: 3xl (30px)
- h2: 2xl (24px)
- h3: xl (20px)
- h4: lg (18px)
- h5: base (16px)
- h6: sm (14px)

#### Text
Flexible text component with semantic variants.

```tsx
import { Text } from '@/components/ui/text'

<Text>Default body text</Text>
<Text size="lg" weight="medium">Large medium text</Text>
<Text tone="muted">Secondary text</Text>
<Text as="span">Inline text</Text>
```

**Props:**
- `size`: xs, sm, base (default), lg, xl
- `weight`: normal (default), medium, semibold, bold
- `tone`: default, muted, success, warning, error
- `as`: HTML element (default: 'p')

#### Code
Display inline or block code.

```tsx
import { Code } from '@/components/ui/code'

<Code variant="inline">npm install</Code>

<Code variant="block" language="typescript">
{`const example = 'hello';`}
</Code>
```

**Props:**
- `variant`: inline, block
- `language`: Syntax highlighting language (for block variant)

---

### Interactive Components

#### Button
Primary interactive element with variants.

```tsx
import { Button } from '@/components/ui/button'

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants:**
- `default`: Primary action
- `destructive`: Dangerous actions
- `outline`: Secondary actions
- `secondary`: Tertiary actions
- `ghost`: Minimal actions
- `link`: Link-styled button

**Sizes:**
- `sm`: Small (32px)
- `default`: Medium (40px)
- `lg`: Large (48px)
- `icon`: Icon-only (40px square)

#### Badge
Status indicators and labels.

```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="success">Approved</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="secondary">Draft</Badge>
```

**Variants:**
- `default`: Gray
- `secondary`: Subtle gray
- `success`: Green (approved, active, complete)
- `warning`: Yellow (pending, in progress)
- `destructive`: Red (rejected, failed, cancelled)
- `outline`: Bordered
- `info`: Blue (informational)
- `error`: Red (error state)
- `active`: Green (active status)
- `inactive`: Gray (inactive status)

#### Input
Form input field.

```tsx
import { Input } from '@/components/ui/input'

<Input type="text" placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input type="number" placeholder="Amount" />
```

**Props:**
- Standard HTML input props
- `className`: Additional CSS classes

---

### Data Display Components

#### Table
Structured data display.

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-accent">
      <TableCell>Item 1</TableCell>
      <TableCell><Badge variant="success">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Common Patterns:**
```tsx
// Sortable header
<TableHead className="cursor-pointer hover:bg-accent">
  Name
</TableHead>

// Hover rows
<TableRow className="hover:bg-accent">

// Footer totals
<TableFooter>
  <TableRow className="bg-muted">
    <TableCell>Total</TableCell>
    <TableCell>$1,000</TableCell>
  </TableRow>
</TableFooter>
```

---

## Design Principles

### 1. Composition Over Configuration
Compose simple components to build complex UIs:

```tsx
// ✅ Good: Composable
<Card>
  <CardHeader>
    <Heading level={2}>Title</Heading>
  </CardHeader>
  <CardContent>
    <Stack gap="md">
      <Text>Line 1</Text>
      <Text>Line 2</Text>
    </Stack>
  </CardContent>
</Card>

// ❌ Bad: Prop-heavy
<Card title="Title" lines={['Line 1', 'Line 2']} />
```

### 2. Use Semantic Tokens
Always use design tokens for colors:

```tsx
// ✅ Good
<div className="text-muted-foreground bg-muted">

// ❌ Bad
<div className="text-gray-600 bg-gray-100">
```

### 3. Consistent Spacing
Follow the 8px grid:

```tsx
// ✅ Good
<Stack gap="md">  {/* 16px */}
<Card className="p-6">  {/* 24px */}

// ❌ Bad
<div className="space-y-[15px] p-[18px]">
```

---

## Migration Guide

### Converting Manual Cards
```tsx
// BEFORE
<div className="rounded-md border border-neutral-200 bg-white p-6">
  <h3 className="text-xl font-semibold mb-4">Title</h3>
  <p className="text-neutral-600">Content</p>
</div>

// AFTER
<Card>
  <CardHeader className="border-b">
    <Heading level={3}>Title</Heading>
  </CardHeader>
  <CardContent>
    <Text>Content</Text>
  </CardContent>
</Card>
```

### Converting Status Badges
```tsx
// BEFORE
const statusColors = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700'
}
<span className={statusColors[status]}>{status}</span>

// AFTER
const variantMap = {
  approved: 'success',
  pending: 'warning',
  rejected: 'destructive'
}
<Badge variant={variantMap[status]}>{status}</Badge>
```

### Converting Layouts
```tsx
// BEFORE
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// AFTER
<Stack gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

---

## ESLint Integration

These components are enforced by ESLint rules:

- `design-system/no-hardcoded-colors` - Prevents hex/rgb colors
- `design-system/no-arbitrary-spacing` - Enforces 8px grid
- `design-system/require-semantic-colors` - Encourages semantic tokens

Run `npm run lint` to check for violations.

---

## Quick Reference

| Need | Component | Import |
|------|-----------|--------|
| Content container | `Card` | `@/components/ui/card` |
| Status label | `Badge` | `@/components/ui/badge` |
| Clickable action | `Button` | `@/components/ui/button` |
| Page/section title | `Heading` | `@/components/ui/heading` |
| Body text | `Text` | `@/components/ui/text` |
| Vertical stack | `Stack` | `@/components/ui/stack` |
| Horizontal row | `Inline` | `@/components/ui/inline` |
| Multi-column | `Grid` | `@/components/ui/grid` |
| Data table | `Table` | `@/components/ui/table` |
| Form input | `Input` | `@/components/ui/input` |
| Code snippet | `Code` | `@/components/ui/code` |
| Light container | `Panel` | `@/components/ui/panel` |

---

## Resources

- **Design Guide**: `DESIGN-SYSTEM-GUIDE.md`
- **Design Tokens**: `src/app/globals.css` (lines 30-113)
- **ESLint Rules**: `eslint-plugin-design-system/`
- **Verification**: `npm run verify:design`
