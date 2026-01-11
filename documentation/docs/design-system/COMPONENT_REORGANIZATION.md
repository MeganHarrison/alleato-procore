# Component Reorganization Plan

## Overview
This document outlines the plan to reorganize and clean up the component structure in the frontend codebase.

## Current Issues
1. **8+ duplicate PageHeader implementations** across different folders
2. **4 duplicate EmptyState components**
3. **Mixed naming conventions** (PascalCase vs kebab-case)
4. **Components in wrong folders** (e.g., data-table in misc folder)
5. **Overlapping folder purposes** (shared vs ui vs design-system)
6. **Screenshot files in component directories**

## Progress Update

### ✅ Phase 1: Consolidate Duplicates (COMPLETE)

**PageHeader Consolidation:**
- Created unified PageHeader component at `/components/layout/page-header-unified.tsx`
- Supports all variants: default, executive, compact, budget
- Reduced from 8+ implementations to 1 unified component
- All existing functionality preserved through variants

**EmptyState Consolidation:**
- Enhanced `/components/ui/empty-state.tsx` as the single source of truth
- Added support for all use cases through variants: default, executive, table, compact
- Reduced from 4 implementations to 1 unified component
- Added iconWithBackground prop for table variant needs

### Remaining Work

**Phase 1: Continue Consolidation**
1. **Card Components** (TODO)
   - Consolidate summary-card-grid.tsx and summary-cards-grid.tsx
   - Merge stat-card.tsx and content-card.tsx functionality

**Phase 2: Standardize Naming** (TODO)
1. Convert all component files to kebab-case
2. Remove numbered/poorly named files

**Phase 3: Reorganize Structure** (TODO)
1. Move components from `/misc` to appropriate folders
2. Clean up screenshot PNG files and empty directories

## Proposed New Structure

```
src/components/
├── ui/                    # Base design system components
│   ├── button.tsx
│   ├── card.tsx
│   ├── empty-state.tsx
│   ├── modal/
│   ├── form/
│   ├── data-display/    # Tables, lists, etc.
│   └── feedback/        # Toasts, alerts, etc.
│
├── layout/               # Page structure components
│   ├── page-header.tsx   # Single implementation
│   ├── page-container.tsx
│   ├── app-shell.tsx
│   └── sidebar/
│
├── domain/              # Business logic components
│   ├── budget/
│   ├── commitments/
│   ├── contracts/
│   ├── meetings/
│   └── projects/
│
├── features/            # Feature-specific components
│   ├── chat/
│   ├── rag/
│   ├── admin/
│   └── directory/
│
└── providers/           # Context providers

```

## Migration Steps

### Phase 1: Clean Up Duplicates (Priority: High)

1. **Consolidate PageHeaders**
   - Keep `/components/layout/page-header.tsx` as the main implementation
   - Merge functionality from all other headers into this one component
   - Delete: page-header2.tsx, budget-page-header.tsx, simplified-header.tsx, etc.

2. **Consolidate EmptyStates**
   - Keep `/components/ui/empty-state.tsx`
   - Delete all other implementations

3. **Consolidate Card Components**
   - Create single `/components/ui/card/` directory
   - Merge summary-card-grid.tsx and summary-cards-grid.tsx

### Phase 2: Standardize Naming (Priority: High)

1. Convert all component files to **kebab-case**
2. Rename poorly named files:
   - `page-header2.tsx` → Remove (merge into main page-header)
   - `BaseModal.tsx` → `base-modal.tsx`
   - All PascalCase files → kebab-case

### Phase 3: Reorganize Components (Priority: Medium)

1. **Move from /misc to appropriate folders:**
   - `data-table.tsx` → `/components/ui/data-display/`
   - `agent-panel.tsx`, `agents-list.tsx` → `/components/features/chat/`
   - `date-picker.tsx` → `/components/ui/form/`
   - `dropzone.tsx` → `/components/ui/form/`
   - `avatar-stack.tsx` → `/components/ui/`

2. **Consolidate similar folders:**
   - Merge `/shared`, `/ui`, and `/design-system` based on component type
   - Move domain-specific components to `/domain`

### Phase 4: Clean Up (Priority: Low)

1. Delete all screenshot PNG files from component directories
2. Remove empty or single-file directories
3. Update all imports to reflect new paths

## Implementation Order

1. **Week 1:**
   - Create backup branch
   - Consolidate duplicate components (PageHeader, EmptyState, Cards)
   - Standardize file naming to kebab-case

2. **Week 2:**
   - Reorganize folder structure
   - Move components to appropriate directories
   - Update imports using automated tools

3. **Week 3:**
   - Clean up remaining issues
   - Update documentation
   - Run comprehensive tests

## Success Criteria

- [ ] No duplicate components
- [ ] Consistent kebab-case naming
- [ ] Clear folder structure with obvious component locations
- [ ] All imports updated and working
- [ ] All tests passing
- [ ] No TypeScript or lint errors

## Risk Mitigation

- Create feature branch for all changes
- Use git mv to preserve history
- Update imports incrementally
- Run tests after each major change
- Keep detailed log of all moves/renames