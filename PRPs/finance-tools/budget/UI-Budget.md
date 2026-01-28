# Budget UI Components Specification

## Component Specifications

### 1. BudgetPage
**File**: `frontend/src/app/[projectId]/budget/page.tsx`
**Purpose**: Main budget page with tab navigation and data management
**Status**: ✅ Complete with 4-tab system

#### Props Interface
```typescript
interface BudgetPageProps {
  params: { projectId: string };
  searchParams: {
    tab?: 'main' | 'details' | 'forecast' | 'snapshots' | 'history';
    view?: string;
    group?: string;
    filter?: string;
  };
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Project Header & Breadcrumbs                                   │
├─────────────────────────────────────────────────────────────────┤
│ Budget Tab Navigation                                           │
│ [Main] [Details] [Forecast] [Snapshots] [History]             │
├─────────────────────────────────────────────────────────────────┤
│ [IF MAIN TAB]                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Budget Filters & Controls                                   │ │
│ │ Views: [Dropdown] Group: [Dropdown] Filter: [Dropdown]    │ │
│ │ [Create] [Lock Budget] [Export] [Quick Filters...]        │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Budget Table                                                │ │
│ │ [Complex data table with hierarchical grouping]            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [IF DETAILS TAB] → DetailsTab Component                        │
│ [IF FORECAST TAB] → ForecastingTab Component                   │
│ [IF SNAPSHOTS TAB] → SnapshotsTab Component                    │
│ [IF HISTORY TAB] → ChangeHistoryTab Component                  │
└─────────────────────────────────────────────────────────────────┘
```

#### State Management
```typescript
interface BudgetPageState {
  // Data
  budgetData: BudgetLineItem[];
  grandTotals: BudgetGrandTotals;
  loading: boolean;
  error?: string;

  // View Configuration
  currentViewId?: string;
  availableViews: BudgetView[];
  grouping: GroupingType;
  filtering: FilterType;
  searchTerm: string;

  // UI State
  activeTab: TabType;
  isLocked: boolean;
  selectedRows: string[];
  modals: ModalState;

  // User Preferences (localStorage)
  userPreferences: {
    defaultView?: string;
    defaultGrouping: GroupingType;
    defaultFilter: FilterType;
    tableSettings: TableSettings;
  };
}
```

### 2. BudgetTable
**File**: `frontend/src/components/budget/budget-table.tsx`
**Purpose**: Main data table with hierarchical grouping and inline editing
**Status**: ✅ Complete with 3-tier grouping

#### Props Interface
```typescript
interface BudgetTableProps {
  data: BudgetLineItem[];
  columns: ColumnDefinition[];
  grouping: GroupingType;
  isLocked: boolean;
  onEdit: (id: string, field: string, value: any) => void;
  onSelect: (ids: string[]) => void;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  selectedRows?: string[];
  loading?: boolean;
}

interface ColumnDefinition {
  key: string;
  header: string;
  width?: number;
  isVisible: boolean;
  isSortable: boolean;
  isEditable: boolean;
  formatType: 'currency' | 'number' | 'text' | 'date';
  alignment: 'left' | 'center' | 'right';
}
```

#### Features Implemented
- **Hierarchical Display**: 3-tier cost code grouping with expand/collapse
- **Inline Editing**: Click-to-edit cells with validation
- **Visual Styling**: Distinguished group rows vs leaf rows
- **Financial Formatting**: Currency, percentage, number formatting
- **Row Selection**: Multi-select with checkbox column
- **Responsive Design**: Horizontal scrolling on mobile

### 3. BudgetFilters
**File**: `frontend/src/components/budget/budget-filters.tsx`
**Purpose**: Filter controls and quick filter presets
**Status**: ✅ Complete with localStorage persistence

#### Props Interface
```typescript
interface BudgetFiltersProps {
  currentView?: string;
  availableViews: BudgetView[];
  grouping: GroupingType;
  filtering: FilterType;
  searchTerm: string;
  isLocked: boolean;
  onViewChange: (viewId: string) => void;
  onGroupingChange: (grouping: GroupingType) => void;
  onFilterChange: (filter: FilterType) => void;
  onSearchChange: (term: string) => void;
  onCreateLineItem: () => void;
  onExport: () => void;
  onToggleLock: () => void;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Views: [Procore Standard Budget ▼] [⚙️] [📋] [🔒Lock Budget]    │
├─────────────────────────────────────────────────────────────────┤
│ Group: [Cost Code Tier 1 ▼] Filter: [All Items ▼] 🔍[Search..] │
├─────────────────────────────────────────────────────────────────┤
│ Quick Filters: [All] [Over Budget] [Under Budget] [No Activity] │
├─────────────────────────────────────────────────────────────────┤
│ [Create ▼] [Export ▼] [Import ▼]                 [Save Changes] │
└─────────────────────────────────────────────────────────────────┘
```

#### Quick Filter Implementation
```typescript
const QUICK_FILTERS = [
  { key: 'all', label: 'All Items', color: 'gray' },
  { key: 'over_budget', label: 'Over Budget', color: 'red' },
  { key: 'under_budget', label: 'Under Budget', color: 'green' },
  { key: 'no_activity', label: 'No Activity', color: 'yellow' }
];

const applyFilter = (items: BudgetLineItem[], filter: FilterType) => {
  return items.filter(item => {
    switch (filter) {
      case 'over_budget': return item.projectedOverUnder < 0;
      case 'under_budget': return item.projectedOverUnder > 0;
      case 'no_activity': return item.jobToDateCostDetail === 0;
      default: return true;
    }
  });
};
```

### 4. BudgetViewsManager
**File**: `frontend/src/components/budget/BudgetViewsManager.tsx`
**Purpose**: View selection dropdown with management actions
**Status**: ✅ Complete with CRUD operations

#### Props Interface
```typescript
interface BudgetViewsManagerProps {
  currentViewId?: string;
  views: BudgetView[];
  onViewChange: (viewId: string) => void;
  onViewCreate: () => void;
  onViewEdit: (viewId: string) => void;
  onViewClone: (viewId: string) => void;
  onViewDelete: (viewId: string) => void;
  onSetDefault: (viewId: string) => void;
}
```

#### Layout Structure
```
┌─────────────────────────────────────────┐
│ [Procore Standard Budget ▼]     [⚙️]   │ ← Trigger Buttons
└─────────────────────────────────────────┘
           ↓ (when dropdown open)
┌─────────────────────────────────────────┐
│ ⭐ Procore Standard Budget (Default)    │ ← System View
├─────────────────────────────────────────┤
│ Custom View 1                    [...] │ ← User Views
│ Executive Summary               [...] │
│ Cost Analysis                   [...] │
├─────────────────────────────────────────┤
│ ➕ Create New View                     │
└─────────────────────────────────────────┘
           ↓ (when [...] clicked)
┌─────────────────────────────────────────┐
│ ✏️ Edit View                           │
│ 📋 Clone View                          │
│ ⭐ Set as Default                      │
│ 🗑️ Delete View                         │
└─────────────────────────────────────────┘
```

### 5. BudgetViewsModal
**File**: `frontend/src/components/budget/BudgetViewsModal.tsx`
**Purpose**: Create/edit budget views with column configuration
**Status**: ✅ Complete with drag-drop ordering

#### Props Interface
```typescript
interface BudgetViewsModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  viewId?: string;
  initialData?: Partial<BudgetView>;
  onSave: (viewData: BudgetViewFormData) => void;
  onClose: () => void;
}

interface BudgetViewFormData {
  name: string;
  description?: string;
  isDefault: boolean;
  columns: BudgetViewColumn[];
}
```

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Create Budget View                                        [X]   │
├─────────────────────────────────────────────────────────────────┤
│ View Name: [Executive Summary                            ]     │
│                                                                 │
│ Description:                                                    │
│ [High-level budget view for executive reporting        ]      │
│                                                                 │
│ ☐ Set as Default View                                          │
├─────────────────────────────────────────────────────────────────┤
│ Column Configuration                                            │
│ ┌─────────────────┬─────────────────────────────────────┐      │
│ │ Available (8)   │ Selected (5)                        │      │
│ │                 │                                     │      │
│ │ ☐ Cost Type     │ ☑ Cost Code              [↑] [↓]   │      │
│ │ ☐ Unit Qty      │ ☑ Description            [↑] [↓]   │      │
│ │ ☐ UOM           │ ☑ Original Budget        [↑] [↓]   │      │
│ │ ☐ Unit Cost     │ ☑ Revised Budget         [↑] [↓]   │      │
│ │ ☐ Direct Costs  │ ☑ Projected Over/Under   [↑] [↓]   │      │
│ │ ☐ [Add →]       │ ☐ [← Remove]                        │      │
│ │                 │                                     │      │
│ └─────────────────┴─────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                                        [Cancel] [Save View]    │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Tab Components

#### DetailsTab
**File**: `frontend/src/components/budget/tabs/DetailsTab.tsx`
**Purpose**: Detailed budget information and line-level analytics
**Status**: ✅ Complete

```typescript
interface DetailsTabProps {
  projectId: string;
  budgetData: BudgetLineItem[];
  grandTotals: BudgetGrandTotals;
}
```

#### ForecastingTab
**File**: `frontend/src/components/budget/tabs/ForecastingTab.tsx`
**Purpose**: Forecast to complete calculations and curve management
**Status**: ✅ Complete with mock data

```typescript
interface ForecastingTabProps {
  projectId: string;
  budgetData: BudgetLineItem[];
}
```

#### SnapshotsTab
**File**: `frontend/src/components/budget/tabs/SnapshotsTab.tsx`
**Purpose**: Budget snapshots and historical comparison
**Status**: ✅ Complete

```typescript
interface SnapshotsTabProps {
  projectId: string;
}
```

#### ChangeHistoryTab
**File**: `frontend/src/components/budget/tabs/ChangeHistoryTab.tsx`
**Purpose**: Complete audit trail of budget changes
**Status**: ✅ Complete

```typescript
interface ChangeHistoryTabProps {
  projectId: string;
}
```

### 7. Modal Components (Specified but Not Implemented)

#### ApprovedCOsModal
**File**: `frontend/src/components/budget/modals/ApprovedCOsModal.tsx`
**Purpose**: Display approved change orders for a cost code
**Status**: 📝 Specified in budget-modals.md, not implemented

#### BudgetModificationsModal
**File**: `frontend/src/components/budget/modals/BudgetModificationsModal.tsx`
**Purpose**: Display budget modifications history
**Status**: 📝 Specified in budget-modals.md, not implemented

#### OriginalBudgetEditModal
**File**: `frontend/src/components/budget/modals/OriginalBudgetEditModal.tsx`
**Purpose**: Edit original budget with calculation methods
**Status**: 📝 Specified in budget-modals.md, not implemented

#### CreateBudgetLineItemsModal
**File**: `frontend/src/components/budget/modals/CreateBudgetLineItemsModal.tsx`
**Purpose**: Wizard for adding multiple budget lines
**Status**: 📝 Specified in budget-modals.md, not implemented

#### Additional Modals
- `JTDCostDetailModal.tsx` - Job to date cost breakdown
- `DirectCostsModal.tsx` - Direct costs detail
- `ForecastToCompleteModal.tsx` - FTC calculation details
- `PendingBudgetChangesModal.tsx` - Pending changes detail
- `UnlockBudgetConfirmationModal.tsx` - Budget unlock confirmation

## Component Hierarchy

```
BudgetPage
├── TabNavigation (query parameter based)
├── [Main Tab]
│   ├── BudgetFilters
│   │   ├── BudgetViewsManager
│   │   │   └── BudgetViewsModal
│   │   ├── GroupingSelector
│   │   ├── FilterSelector
│   │   └── QuickFilters
│   ├── BudgetTable
│   │   ├── TableHeader (sortable columns)
│   │   ├── GroupRows (hierarchical)
│   │   ├── DataRows (inline editable)
│   │   └── SummaryRow (grand totals)
│   └── ActionButtons (Create, Export, Lock)
├── [Details Tab] → DetailsTab
├── [Forecast Tab] → ForecastingTab
├── [Snapshots Tab] → SnapshotsTab
└── [History Tab] → ChangeHistoryTab
```

## State Management Patterns

### Data Fetching
```typescript
const useBudgetData = (projectId: string, options: FetchOptions) => {
  const [data, setData] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await budgetApi.getBudgetData(projectId, options);
      setData(response.lineItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, options]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return { data, loading, error, refreshData };
};
```

### Local Storage Persistence
```typescript
const useBudgetPreferences = () => {
  const [preferences, setPreferences] = useState(() => {
    const stored = localStorage.getItem('budgetPreferences');
    return stored ? JSON.parse(stored) : defaultPreferences;
  });

  const updatePreferences = (updates: Partial<BudgetPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    localStorage.setItem('budgetPreferences', JSON.stringify(newPreferences));
  };

  return [preferences, updatePreferences];
};
```

### Optimistic Updates
```typescript
const useOptimisticBudgetUpdate = () => {
  const [optimisticData, setOptimisticData] = useState<BudgetLineItem[]>([]);

  const updateLineItem = async (id: string, field: string, value: any) => {
    // Optimistic update
    setOptimisticData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    try {
      await budgetApi.updateLineItem(id, { [field]: value });
      // Refresh materialized view
      await budgetApi.refreshCalculations(projectId);
    } catch (error) {
      // Revert optimistic update
      setOptimisticData(originalData);
      toast.error('Update failed: ' + error.message);
    }
  };

  return { optimisticData, updateLineItem };
};
```

## Responsive Design

### Breakpoint Strategy
```scss
// Tailwind CSS breakpoints used throughout
.budget-container {
  @apply w-full;

  /* Mobile: Stack vertically, horizontal scroll */
  @screen sm {
    @apply space-y-4;
  }

  /* Tablet: Adjust spacing, larger touch targets */
  @screen md {
    @apply space-y-6;

    .budget-filters {
      @apply grid grid-cols-2 gap-4;
    }
  }

  /* Desktop: Full layout */
  @screen lg {
    .budget-filters {
      @apply flex items-center space-x-4;
    }

    .budget-table {
      @apply min-w-full;
    }
  }
}
```

### Mobile Adaptations
- **Table**: Horizontal scrolling with sticky first column
- **Filters**: Collapsible panel on mobile
- **Modals**: Full-screen on mobile, centered on desktop
- **Touch Targets**: 44px minimum for all interactive elements

## Accessibility Features

### Keyboard Navigation
```typescript
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            refreshBudgetData();
            break;
          case 'e':
            event.preventDefault();
            navigate('?tab=details');
            break;
        }
      }

      if (event.key === 'Escape') {
        closeActiveModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### Screen Reader Support
```tsx
<table role="table" aria-label="Budget line items">
  <thead>
    <tr>
      <th scope="col" aria-sort={sortDirection}>
        Cost Code
        <button aria-label="Sort by cost code">
          <SortIcon />
        </button>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr aria-expanded={isExpanded} aria-level={depth}>
      <td aria-describedby="costcode-help">
        {costCode}
      </td>
    </tr>
  </tbody>
</table>

<div id="costcode-help" className="sr-only">
  Cost codes categorize budget line items by work type
</div>
```

### Focus Management
```typescript
const useFocusManagement = () => {
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElementsRef.current = Array.from(focusableElements) as HTMLElement[];

    const firstElement = focusableElementsRef.current[0];
    const lastElement = focusableElementsRef.current[focusableElementsRef.current.length - 1];

    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  };

  return { trapFocus };
};
```

## Performance Optimizations

### Virtualization for Large Datasets
```typescript
import { VariableSizeList as List } from 'react-window';

const VirtualizedBudgetTable = ({ items }: { items: BudgetLineItem[] }) => {
  const getItemSize = useCallback((index: number) => {
    const item = items[index];
    return item.isGroup ? 40 : 32; // Different heights for groups vs items
  }, [items]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <BudgetTableRow item={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Memoization
```typescript
const BudgetTable = memo(({ data, columns, grouping, ...props }) => {
  const groupedData = useMemo(() => {
    return groupBudgetData(data, grouping);
  }, [data, grouping]);

  const visibleColumns = useMemo(() => {
    return columns.filter(col => col.isVisible);
  }, [columns]);

  return (
    <table>
      {/* Table implementation */}
    </table>
  );
});
```

### Debounced Search
```typescript
const useDebouncedsearch = (searchTerm: string, delay: number = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
};
```

## Testing Strategy

### Component Testing
```typescript
// Example test for BudgetFilters component
describe('BudgetFilters', () => {
  it('should update filter when quick filter is clicked', async () => {
    const mockOnFilterChange = jest.fn();

    render(
      <BudgetFilters
        filtering="all"
        onFilterChange={mockOnFilterChange}
        {...otherProps}
      />
    );

    const overBudgetButton = screen.getByText('Over Budget');
    await user.click(overBudgetButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('over_budget');
  });
});
```

### E2E Testing with Playwright
```typescript
// From frontend/tests/e2e/budget-quick-wins.spec.ts
test('should apply Over Budget filter and persist to localStorage', async ({ page }) => {
  await page.goto('/14/budget');

  // Click Over Budget filter
  await page.locator('[data-testid="quick-filter-over_budget"]').click();

  // Verify localStorage persistence
  const filterValue = await page.evaluate(() => {
    const prefs = localStorage.getItem('budgetPreferences');
    return prefs ? JSON.parse(prefs).filtering : null;
  });

  expect(filterValue).toBe('over_budget');
});
```

## Component Library Integration

### shadcn/ui Components Used
```typescript
// Standard components from shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
```

### Custom Component Extensions
```typescript
// Enhanced table with budget-specific features
const BudgetDataTable = ({ data, columns, grouping, ...props }) => {
  const table = useReactTable({
    data: groupedData,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Budget-specific configuration
    getSubRows: (row) => row.children,
    getIsGrouped: (row) => row.isGroup,
    // Custom cell renderers for currency, percentages
    meta: {
      updateData: (rowIndex, columnId, value) => {
        optimisticUpdate(rowIndex, columnId, value);
      }
    }
  });

  return <Table>...</Table>;
};
```

This comprehensive UI specification provides Claude Code with complete context for working with the Budget module's user interface components, their relationships, and implementation details.