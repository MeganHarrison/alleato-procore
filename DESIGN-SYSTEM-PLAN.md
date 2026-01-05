# DESIGN SYSTEM IMPLEMENTATION PLAN

**Status**: Foundation Missing - STOP FEATURE WORK
**Started**: 2026-01-05
**Estimated**: 3-5 sessions

---

## PHASE 1: FOUNDATION (CRITICAL - DO FIRST)

### 1.1 Complete Token System

**File**: `frontend/src/app/globals.css`

**Tasks**:
- [x] Audit existing tokens
- [ ] Add missing spacing scale
- [ ] Add complete typography scale
- [ ] Add elevation/shadow tokens
- [ ] Document all tokens

**Deliverable**: Complete CSS variable system in `globals.css`

---

### 1.2 Create Layout Primitives

**Directory**: `frontend/src/components/ui/`

#### Stack Component
```tsx
// stack.tsx
interface StackProps {
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  children: React.ReactNode;
  className?: string;
}
```

**Priority**: P0
**Estimated**: 30 min

---

#### Inline Component
```tsx
// inline.tsx
interface InlineProps {
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Priority**: P0
**Estimated**: 30 min

---

#### Container Component
```tsx
// container.tsx
interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Priority**: P0
**Estimated**: 20 min

---

#### Spacer Component
```tsx
// spacer.tsx
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  direction?: 'vertical' | 'horizontal';
}
```

**Priority**: P1
**Estimated**: 15 min

---

### 1.3 Typography Components

#### Heading Component
```tsx
// heading.tsx
interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  children: React.ReactNode;
}
```

**Priority**: P0
**Estimated**: 30 min

---

#### Text Component
```tsx
// text.tsx
interface TextProps {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  tone?: 'default' | 'muted' | 'accent' | 'destructive';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: 'p' | 'span' | 'div';
  className?: string;
  children: React.ReactNode;
}
```

**Priority**: P0
**Estimated**: 30 min

---

### 1.4 Feedback Components

#### EmptyState Component
```tsx
// empty-state.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}
```

**Priority**: P1
**Estimated**: 30 min

---

**PHASE 1 TOTAL**: ~3 hours
**Blocking**: All future work
**Output**: 7 core primitive components

---

## PHASE 2: COMPONENT AUDIT & REFACTOR

### 2.1 Audit Existing UI Components

**Tasks**:
- [ ] List all components in `components/ui/`
- [ ] Check each for token usage
- [ ] Identify hardcoded values
- [ ] Document component APIs

**Deliverable**: Component audit spreadsheet

**Estimated**: 1 hour

---

### 2.2 Refactor Components to Use Tokens

**Priority Order**:
1. Button (check existing)
2. Input (check existing)
3. Card (check existing)
4. Badge (check existing)
5. Alert (check existing)

**Per Component**:
- Replace hardcoded colors with token variables
- Replace hardcoded spacing with spacing scale
- Add proper TypeScript types
- Add JSDoc comments

**Estimated**: 2-3 hours total

---

## PHASE 3: EXEMPLAR PAGE REFACTOR

### 3.1 Refactor Directory Page

**File**: `frontend/src/app/[projectId]/directory/page.tsx`

**Refactor Steps**:
1. Replace all `space-y-*` with `<Stack>`
2. Replace all `gap-*` with `<Inline>` or Stack
3. Replace empty state divs with `<EmptyState>`
4. Replace raw text with `<Heading>` and `<Text>`
5. Ensure all spacing uses tokens

**Success Criteria**:
- ✅ Zero raw Tailwind spacing classes
- ✅ All text uses Typography components
- ✅ All empty states use EmptyState component
- ✅ Passes ESLint design rules

**Estimated**: 2 hours

---

### 3.2 Refactor DirectoryTable Component

**File**: `frontend/src/components/directory/DirectoryTable.tsx`

**Refactor Steps**:
1. Extract sub-components (TableFilters, TableEmpty, etc.)
2. Use Stack for vertical spacing
3. Use Inline for button groups
4. Standardize all spacing to tokens

**Estimated**: 2 hours

---

**PHASE 3 TOTAL**: ~4 hours
**Output**: Directory as design system exemplar

---

## PHASE 4: ENFORCEMENT & TOOLING

### 4.1 ESLint Rules

**File**: `frontend/.eslintrc.json`

**Rules to Add**:
```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "JSXAttribute[name.name='className'][value.value=/\\s(mt-|mb-|ml-|mr-|mx-|my-|m-|p-|pt-|pb-|pl-|pr-|px-|py-|space-|gap-)/]",
        "message": "Use Stack/Inline components instead of spacing classes"
      },
      {
        "selector": "JSXElement[name.name='h1']",
        "message": "Use <Heading level={1}> instead of <h1>"
      },
      {
        "selector": "JSXElement[name.name='p']",
        "message": "Use <Text> instead of <p>"
      }
    ]
  }
}
```

**Estimated**: 1 hour

---

### 4.2 Storybook Setup

**Purpose**: Component documentation & design system showcase

**Tasks**:
- [ ] Install Storybook
- [ ] Create stories for all primitives
- [ ] Document component APIs
- [ ] Add design token showcase

**Priority**: P2
**Estimated**: 3 hours

---

## PHASE 5: ROLLOUT TO OTHER PAGES

### 5.1 Page Refactor Order

**Priority Order** (based on user-facing importance):
1. `/dashboard/page.tsx`
2. `/[projectId]/home/page.tsx`
3. `/[projectId]/commitments/page.tsx`
4. `/[projectId]/budget/page.tsx`
5. Other pages as needed

**Per Page**:
- Use directory page as template
- Replace spacing with Stack/Inline
- Replace typography with components
- Audit for token usage

**Estimated**: 2 hours per page

---

## TIMELINE

### Week 1: Foundation
- ✅ Document design system rules
- ✅ Log violations
- [ ] Complete token system (3h)
- [ ] Create all primitive components (3h)

### Week 2: Audit & Exemplar
- [ ] Audit existing components (1h)
- [ ] Refactor directory page (4h)
- [ ] Add ESLint rules (1h)

### Week 3+: Rollout
- [ ] Refactor 2-3 pages per week
- [ ] Monitor for violations
- [ ] Update documentation

---

## SUCCESS METRICS

**Phase 1 Complete When**:
- [ ] All 7 primitive components exist
- [ ] Token system is 100% complete
- [ ] Zero TypeScript errors
- [ ] All primitives have unit tests

**Phase 3 Complete When**:
- [ ] Directory page has zero spacing classes
- [ ] All text uses Typography components
- [ ] Passes design system ESLint rules
- [ ] Visual regression tests pass

**Project Complete When**:
- [ ] All pages refactored
- [ ] ESLint rules enforced
- [ ] Storybook deployed
- [ ] Design system docs complete
- [ ] Zero violations in codebase

---

## DEPENDENCIES

### Required Before Starting
- [x] DESIGN-SYSTEM.md rules documented
- [x] Violations logged
- [ ] Team alignment on approach

### Blockers
- None - can start immediately

### Nice to Have
- Design review from team
- Brand guidelines document
- Figma designs

---

## RISK MITIGATION

**Risk**: Breaking existing pages during refactor
**Mitigation**:
- Refactor one page at a time
- Visual regression tests
- Feature flags if needed

**Risk**: Team pushes features before foundation ready
**Mitigation**:
- Document "STOP FEATURE WORK" prominently
- Code review enforcement
- CI/CD blocks

**Risk**: Incomplete token coverage
**Mitigation**:
- Comprehensive audit upfront
- Document all token types needed
- Review with design lead

---

## NEXT IMMEDIATE ACTIONS

1. **TODAY**: Create all Phase 1 primitive components
2. **THIS WEEK**: Complete token system
3. **NEXT WEEK**: Refactor directory page as exemplar
4. **ONGOING**: Roll out to other pages

---

**Last Updated**: 2026-01-05
**Owner**: Development Team
**Status**: Foundation phase - in progress
