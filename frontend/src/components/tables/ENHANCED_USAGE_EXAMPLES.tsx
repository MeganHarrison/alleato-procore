/**
 * ENHANCED GENERIC TABLE - USAGE EXAMPLES
 *
 * This file demonstrates how to use the enhanced table with:
 * - Virtual scrolling for large datasets
 * - Multi-column sorting
 * - Advanced filtering (date ranges, number ranges, multi-select)
 * - Persistent state
 */

import { GenericDataTableEnhanced } from './generic-table-factory-enhanced'

// ============================================================================
// EXAMPLE 1: Budget Items with Number Range Filtering
// ============================================================================

export function BudgetTableExample() {
  const budgetData = [
    {
      id: '1',
      line_item: 'Concrete Foundation',
      budget_amount: 125000,
      actual_cost: 118500,
      variance: -6500,
      status: 'complete',
      category: 'Structural',
      created_at: '2024-01-15',
    },
    // ... more items
  ]

  return (
    <GenericDataTableEnhanced
      data={budgetData}
      config={{
        id: 'project-budget', // For localStorage persistence
        title: 'Project Budget',
        description: 'Track budget vs actuals with advanced filtering',
        virtualScroll: true, // Enable for 1000+ rows
        columns: [
          {
            id: 'line_item',
            label: 'Line Item',
            defaultVisible: true,
            type: 'text',
            sortable: true,
            width: 250,
          },
          {
            id: 'budget_amount',
            label: 'Budget',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'currency', prefix: '$', showDecimals: true },
          },
          {
            id: 'actual_cost',
            label: 'Actual',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'currency', prefix: '$', showDecimals: true },
          },
          {
            id: 'variance',
            label: 'Variance',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'currency', prefix: '$', showDecimals: true },
          },
          {
            id: 'status',
            label: 'Status',
            defaultVisible: true,
            type: 'badge',
            sortable: true,
            renderConfig: {
              type: 'badge',
              variantMap: {
                complete: 'default',
                'in-progress': 'secondary',
                pending: 'outline',
                overbudget: 'destructive',
              },
            },
          },
          {
            id: 'category',
            label: 'Category',
            defaultVisible: true,
            sortable: true,
          },
          {
            id: 'created_at',
            label: 'Created',
            defaultVisible: false,
            type: 'date',
            sortable: true,
            sortType: 'date',
          },
        ],
        filters: [
          // Number range filter for budget
          {
            type: 'numberRange',
            id: 'budget-filter',
            label: 'Budget Range',
            field: 'budget_amount',
            min: 0,
            max: 1000000,
            step: 1000,
          },
          // Number range filter for variance
          {
            type: 'numberRange',
            id: 'variance-filter',
            label: 'Variance Range',
            field: 'variance',
            min: -100000,
            max: 100000,
            step: 1000,
          },
          // Multi-select for status
          {
            type: 'multiSelect',
            id: 'status-filter',
            label: 'Status',
            field: 'status',
            options: [
              { value: 'complete', label: 'Complete' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'pending', label: 'Pending' },
              { value: 'overbudget', label: 'Over Budget' },
            ],
          },
          // Single select for category
          {
            type: 'select',
            id: 'category-filter',
            label: 'Category',
            field: 'category',
            options: [
              { value: 'Structural', label: 'Structural' },
              { value: 'MEP', label: 'MEP' },
              { value: 'Finishes', label: 'Finishes' },
              { value: 'Site Work', label: 'Site Work' },
            ],
          },
        ],
        searchFields: ['line_item', 'category'],
        rowClickPath: '/budget/{id}',
        exportFilename: 'project-budget.csv',
        editConfig: {
          tableName: 'budget_line_items',
          editableFields: ['budget_amount', 'actual_cost', 'status'],
        },
      }}
    />
  )
}

// ============================================================================
// EXAMPLE 2: Risks with Date Range Filtering
// ============================================================================

export function RisksTableExample() {
  const risksData = [
    {
      id: '1',
      title: 'Weather delays for foundation',
      probability: 0.65,
      impact: 'high',
      cost_impact: 45000,
      status: 'open',
      owner: 'John Smith',
      identified_date: '2024-01-10',
      created_at: '2024-01-10',
    },
    // ... more items
  ]

  return (
    <GenericDataTableEnhanced
      data={risksData}
      config={{
        id: 'project-risks',
        title: 'Project Risks',
        description: 'Manage and track project risks',
        virtualScroll: false, // Smaller dataset, no need for virtual scroll
        columns: [
          {
            id: 'title',
            label: 'Risk',
            defaultVisible: true,
            sortable: true,
            width: 300,
          },
          {
            id: 'probability',
            label: 'Probability',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'truncate', maxLength: 10 },
          },
          {
            id: 'impact',
            label: 'Impact',
            defaultVisible: true,
            sortable: true,
            renderConfig: {
              type: 'badge',
              variantMap: {
                high: 'destructive',
                medium: 'default',
                low: 'outline',
              },
            },
          },
          {
            id: 'cost_impact',
            label: 'Cost Impact',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'currency' },
          },
          {
            id: 'status',
            label: 'Status',
            defaultVisible: true,
            sortable: true,
            renderConfig: {
              type: 'badge',
              variantMap: {
                open: 'destructive',
                mitigated: 'default',
                closed: 'secondary',
              },
            },
          },
          {
            id: 'owner',
            label: 'Owner',
            defaultVisible: true,
            sortable: true,
          },
          {
            id: 'identified_date',
            label: 'Identified',
            defaultVisible: true,
            type: 'date',
            sortable: true,
            sortType: 'date',
          },
        ],
        filters: [
          // Date range filter
          {
            type: 'dateRange',
            id: 'identified-date-filter',
            label: 'Identified Date',
            field: 'identified_date',
          },
          // Multi-select for impact
          {
            type: 'multiSelect',
            id: 'impact-filter',
            label: 'Impact',
            field: 'impact',
            options: [
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ],
          },
          // Multi-select for status
          {
            type: 'multiSelect',
            id: 'status-filter',
            label: 'Status',
            field: 'status',
            options: [
              { value: 'open', label: 'Open' },
              { value: 'mitigated', label: 'Mitigated' },
              { value: 'closed', label: 'Closed' },
            ],
          },
          // Number range for cost impact
          {
            type: 'numberRange',
            id: 'cost-impact-filter',
            label: 'Cost Impact',
            field: 'cost_impact',
            min: 0,
            max: 200000,
            step: 5000,
          },
        ],
        searchFields: ['title', 'owner'],
        rowClickPath: '/risks/{id}',
        exportFilename: 'project-risks.csv',
      }}
    />
  )
}

// ============================================================================
// EXAMPLE 3: Large Dataset with Virtual Scrolling
// ============================================================================

export function LargeDatasetExample() {
  // Generate 10,000 sample rows
  const largeData = Array.from({ length: 10000 }, (_, i) => ({
    id: String(i + 1),
    item_number: `ITEM-${String(i + 1).padStart(5, '0')}`,
    description: `Sample item description ${i + 1}`,
    quantity: Math.floor(Math.random() * 1000),
    unit_price: Math.random() * 1000,
    total: 0, // Calculate below
    category: ['Materials', 'Labor', 'Equipment', 'Subcontractor'][
      Math.floor(Math.random() * 4)
    ],
    status: ['pending', 'approved', 'ordered', 'delivered'][Math.floor(Math.random() * 4)],
    created_at: new Date(2024, 0, Math.floor(Math.random() * 365)).toISOString(),
  })).map((item) => ({
    ...item,
    total: item.quantity * item.unit_price,
  }))

  return (
    <GenericDataTableEnhanced
      data={largeData}
      config={{
        id: 'large-dataset-example',
        title: 'Large Dataset (10,000 Items)',
        description: 'Demonstrates virtual scrolling performance',
        virtualScroll: true, // CRITICAL for large datasets
        columns: [
          {
            id: 'item_number',
            label: 'Item #',
            defaultVisible: true,
            sortable: true,
            width: 150,
          },
          {
            id: 'description',
            label: 'Description',
            defaultVisible: true,
            sortable: true,
            renderConfig: { type: 'truncate', maxLength: 50 },
            width: 300,
          },
          {
            id: 'quantity',
            label: 'Qty',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            type: 'number',
          },
          {
            id: 'unit_price',
            label: 'Unit Price',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'currency', showDecimals: true },
          },
          {
            id: 'total',
            label: 'Total',
            defaultVisible: true,
            sortable: true,
            sortType: 'number',
            renderConfig: { type: 'currency', showDecimals: true },
          },
          {
            id: 'category',
            label: 'Category',
            defaultVisible: true,
            sortable: true,
          },
          {
            id: 'status',
            label: 'Status',
            defaultVisible: true,
            sortable: true,
            renderConfig: {
              type: 'badge',
              variantMap: {
                pending: 'outline',
                approved: 'secondary',
                ordered: 'default',
                delivered: 'default',
              },
            },
          },
          {
            id: 'created_at',
            label: 'Created',
            defaultVisible: false,
            type: 'date',
            sortable: true,
            sortType: 'date',
          },
        ],
        filters: [
          {
            type: 'multiSelect',
            id: 'category-filter',
            label: 'Category',
            field: 'category',
            options: [
              { value: 'Materials', label: 'Materials' },
              { value: 'Labor', label: 'Labor' },
              { value: 'Equipment', label: 'Equipment' },
              { value: 'Subcontractor', label: 'Subcontractor' },
            ],
          },
          {
            type: 'multiSelect',
            id: 'status-filter',
            label: 'Status',
            field: 'status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'ordered', label: 'Ordered' },
              { value: 'delivered', label: 'Delivered' },
            ],
          },
          {
            type: 'numberRange',
            id: 'total-filter',
            label: 'Total Amount',
            field: 'total',
            min: 0,
            max: 100000,
            step: 1000,
          },
        ],
        searchFields: ['item_number', 'description'],
        exportFilename: 'large-dataset.csv',
      }}
    />
  )
}

// ============================================================================
// EXAMPLE 4: Multi-Column Sorting Demo
// ============================================================================

export function MultiColumnSortExample() {
  const data = [
    {
      id: '1',
      project: 'Building A',
      priority: 'high',
      due_date: '2024-02-15',
      assignee: 'John Smith',
      status: 'in-progress',
    },
    {
      id: '2',
      project: 'Building A',
      priority: 'medium',
      due_date: '2024-02-10',
      assignee: 'Jane Doe',
      status: 'pending',
    },
    // ... more items
  ]

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">💡 Multi-Column Sorting Tip</h3>
        <p className="text-sm text-muted-foreground">
          Click a column header to sort. Hold <kbd className="px-2 py-1 bg-white rounded">Shift</kbd> and click
          another column to add a secondary sort. The table will maintain sort order across
          multiple columns.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Example: Sort by Project (ascending), then by Priority (descending), then by Due Date
          (ascending)
        </p>
      </div>

      <GenericDataTableEnhanced
        data={data}
        config={{
          id: 'multi-sort-demo',
          title: 'Tasks (Multi-Column Sort Demo)',
          columns: [
            { id: 'project', label: 'Project', defaultVisible: true, sortable: true },
            {
              id: 'priority',
              label: 'Priority',
              defaultVisible: true,
              sortable: true,
              renderConfig: {
                type: 'badge',
                variantMap: { high: 'destructive', medium: 'default', low: 'outline' },
              },
            },
            {
              id: 'due_date',
              label: 'Due Date',
              defaultVisible: true,
              sortable: true,
              sortType: 'date',
              type: 'date',
            },
            { id: 'assignee', label: 'Assignee', defaultVisible: true, sortable: true },
            {
              id: 'status',
              label: 'Status',
              defaultVisible: true,
              sortable: true,
              type: 'badge',
            },
          ],
          searchFields: ['project', 'assignee'],
        }}
      />
    </div>
  )
}

// ============================================================================
// EXAMPLE 5: Complete Feature Showcase
// ============================================================================

export function CompleteFeatureShowcase() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Enhanced Table Features</h1>
        <p className="text-muted-foreground">
          Demonstration of all advanced features in the enhanced table component
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🚀 Virtual Scrolling</h3>
          <p className="text-sm text-muted-foreground">
            Handle 10,000+ rows smoothly. Only renders visible rows for maximum performance.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔄 Multi-Column Sort</h3>
          <p className="text-sm text-muted-foreground">
            Hold Shift and click headers to sort by multiple columns simultaneously.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">🔍 Advanced Filters</h3>
          <p className="text-sm text-muted-foreground">
            Date ranges, number ranges, multi-select filters with visual indicators.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">💾 Persistent State</h3>
          <p className="text-sm text-muted-foreground">
            Your filters, sorts, and column visibility are saved in localStorage.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">⚡ Loading States</h3>
          <p className="text-sm text-muted-foreground">
            Skeleton loaders provide feedback while data is loading.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">📊 Export</h3>
          <p className="text-sm text-muted-foreground">
            Export filtered and sorted data to CSV with visible columns only.
          </p>
        </div>
      </div>

      {/* Live Examples */}
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Budget Example</h2>
          <BudgetTableExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Risks Example</h2>
          <RisksTableExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Large Dataset (10,000 rows)</h2>
          <LargeDatasetExample />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Multi-Column Sorting</h2>
          <MultiColumnSortExample />
        </section>
      </div>
    </div>
  )
}
