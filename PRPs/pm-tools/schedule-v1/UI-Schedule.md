# Schedule UI Components Specification

## Component Hierarchy

```
SchedulePage
├── ScheduleNavigation (view switcher tabs)
├── ScheduleToolbar (actions, filters, export)
└── ScheduleViews (conditional rendering)
    ├── ScheduleListView (AG Grid table)
    ├── ScheduleGanttView (timeline visualization)
    ├── ScheduleCalendarView (FullCalendar integration)
    └── ScheduleLookaheadView (2-week planning)

Modals & Drawers
├── TaskDetailModal (view/edit task details)
├── CreateTaskModal (new task creation)
├── BulkOperationsModal (multi-task operations)
├── ExportScheduleModal (export configuration)
└── ImportTasksModal (bulk import from CSV/Excel)

Shared Components
├── TaskCard (reusable task display)
├── TaskAssigneeList (assignee chips/avatars)
├── TaskStatusBadge (status indicator)
├── TaskProgressBar (completion visualization)
└── ScheduleFilterPanel (advanced filtering)
```

## Component Specifications

### 1. SchedulePage

**File**: `frontend/src/app/(main)/[projectId]/schedule/page.tsx`
**Purpose**: Main schedule page container with view state management
**Current Status**: ✅ Basic implementation exists

#### Props Interface

```typescript
interface SchedulePageProps {
  params: {
    projectId: string;
  };
  searchParams: {
    view?: 'list' | 'gantt' | 'calendar' | 'lookaheads';
    filter?: string;
    date?: string;
  };
}
```

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Schedule Management                                             │
├─────────────────────────────────────────────────────────────────┤
│ [List] [Gantt] [Calendar] [Lookaheads]     [Filter] [Export]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     Dynamic View Content                       │
│                   (List/Gantt/Calendar)                        │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Current Implementation

```typescript
// Existing implementation - needs enhancement
export default async function SchedulePage({ params }: SchedulePageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  // Current basic implementation
  const { data: tasks } = await supabase
    .from('schedule_tasks')
    .select('*')
    .eq('project_id', projectId);

  return (
    <ProjectToolPage title="Schedule">
      <GenericDataTable
        config={{
          queryKey: ['schedule', projectId],
          apiUrl: `/api/projects/${projectId}/schedule/tasks`,
          columns: scheduleColumns,
          searchPlaceholder: "Search schedule tasks...",
        }}
        data={tasks || []}
      />
    </ProjectToolPage>
  );
}
```

#### Enhanced Implementation Needed

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ScheduleNavigation } from './components/ScheduleNavigation';
import { ScheduleToolbar } from './components/ScheduleToolbar';
import { ScheduleListView } from './components/ScheduleListView';
import { ScheduleGanttView } from './components/ScheduleGanttView';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleLookaheadView } from './components/ScheduleLookaheadView';

type ScheduleView = 'list' | 'gantt' | 'calendar' | 'lookaheads';

export default function SchedulePage({ params, searchParams }: SchedulePageProps) {
  const [currentView, setCurrentView] = useState<ScheduleView>(
    searchParams.view || 'gantt'
  );
  const [filters, setFilters] = useState({});

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return <ScheduleListView projectId={params.projectId} filters={filters} />;
      case 'gantt':
        return <ScheduleGanttView projectId={params.projectId} filters={filters} />;
      case 'calendar':
        return <ScheduleCalendarView projectId={params.projectId} filters={filters} />;
      case 'lookaheads':
        return <ScheduleLookaheadView projectId={params.projectId} filters={filters} />;
      default:
        return <ScheduleGanttView projectId={params.projectId} filters={filters} />;
    }
  };

  return (
    <ProjectToolPage title="Schedule">
      <div className="flex flex-col h-full">
        <ScheduleNavigation
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        <ScheduleToolbar
          currentView={currentView}
          projectId={params.projectId}
          onFiltersChange={setFilters}
        />
        <div className="flex-1 overflow-hidden">
          {renderCurrentView()}
        </div>
      </div>
    </ProjectToolPage>
  );
}
```

### 2. ScheduleNavigation

**File**: `frontend/src/app/(main)/[projectId]/schedule/components/ScheduleNavigation.tsx`
**Purpose**: Tab navigation for switching between schedule views
**Screenshot Reference**: Based on Procore's tab structure

#### Props Interface

```typescript
interface ScheduleNavigationProps {
  currentView: 'list' | 'gantt' | 'calendar' | 'lookaheads';
  onViewChange: (view: 'list' | 'gantt' | 'calendar' | 'lookaheads') => void;
}
```

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [List] [Gantt] [Calendar] [Lookaheads]              [Settings] │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

```typescript
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, BarChart3, Clock } from 'lucide-react';

export function ScheduleNavigation({ currentView, onViewChange }: ScheduleNavigationProps) {
  return (
    <div className="border-b bg-background">
      <Tabs value={currentView} onValueChange={onViewChange}>
        <TabsList className="h-12 px-6">
          <TabsTrigger value="list" className="gap-2">
            <List size={16} />
            List
          </TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2">
            <BarChart3 size={16} />
            Gantt
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar size={16} />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="lookaheads" className="gap-2">
            <Clock size={16} />
            Lookaheads
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
```

### 3. ScheduleListView

**File**: `frontend/src/app/(main)/[projectId]/schedule/components/ScheduleListView.tsx`
**Purpose**: AG Grid-based tabular view of schedule tasks
**Current Status**: ✅ Basic implementation exists, needs enhancement

#### Props Interface

```typescript
interface ScheduleListViewProps {
  projectId: string;
  filters: ScheduleFilters;
}

interface ScheduleFilters {
  status?: string[];
  assignee_id?: number[];
  company_id?: number[];
  start_date?: string;
  end_date?: string;
  search?: string;
}
```

#### Column Configuration

```typescript
const scheduleColumns: ColumnDef<ScheduleTask>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'sequence_number',
    header: 'ID',
    cell: ({ row }) => (
      <div className="w-[60px] text-center">
        {row.getValue('sequence_number')}
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Task Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.is_milestone && <Diamond size={12} className="text-yellow-500" />}
        <span className={cn(
          "font-medium",
          row.original.is_critical_path && "text-red-600"
        )}>
          {row.getValue('name')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => {
      const startDate = row.getValue('start_date') as string;
      return startDate ? format(new Date(startDate), 'MMM dd, yyyy') : '—';
    },
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
    cell: ({ row }) => {
      const endDate = row.getValue('end_date') as string;
      return endDate ? format(new Date(endDate), 'MMM dd, yyyy') : '—';
    },
  },
  {
    accessorKey: 'duration_days',
    header: 'Duration',
    cell: ({ row }) => {
      const days = row.getValue('duration_days') as number;
      return days ? `${days}d` : '—';
    },
  },
  {
    accessorKey: 'resource_name',
    header: 'Resource',
    cell: ({ row }) => {
      const resource = row.getValue('resource_name') as string;
      return resource || '—';
    },
  },
  {
    accessorKey: 'company_name',
    header: 'Company',
    cell: ({ row }) => {
      const company = row.getValue('company_name') as string;
      return company || '—';
    },
  },
  {
    accessorKey: 'assignees',
    header: 'Assignees',
    cell: ({ row }) => {
      const assignees = row.getValue('assignees') as TaskAssignee[];
      return <TaskAssigneeList assignees={assignees} max={3} />;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as TaskStatus;
      return <TaskStatusBadge status={status} />;
    },
  },
  {
    accessorKey: 'completion_percentage',
    header: 'Progress',
    cell: ({ row }) => {
      const percentage = row.getValue('completion_percentage') as number;
      return <TaskProgressBar percentage={percentage} />;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <TaskRowActions task={row.original} />,
  },
];
```

### 4. ScheduleGanttView

**File**: `frontend/src/app/(main)/[projectId]/schedule/components/ScheduleGanttView.tsx`
**Purpose**: Gantt chart timeline visualization (default view)
**Screenshot Reference**: Based on Procore's Gantt implementation

#### Props Interface

```typescript
interface ScheduleGanttViewProps {
  projectId: string;
  filters: ScheduleFilters;
}

interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  type: 'task' | 'milestone' | 'project';
  resource: string;
  isExpanded?: boolean;
  children?: GanttTask[];
}
```

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Task List (30%)           │ Timeline Chart (70%)                │
├───────────────────────────┼─────────────────────────────────────┤
│ ☐ ID │ Task Name │ Resource│ Jan │ Feb │ Mar │ Apr │ May │ Jun    │
│ ──────┼───────────┼─────────┼─────┼─────┼─────┼─────┼─────┼───── │
│  1    │ Demo MEP  │ Crew A  │ ████│     │     │     │     │      │
│  2    │ Frame Wall│ Crew B  │     │████ │     │     │     │      │
│  3    │ Plumbing  │ Crew C  │     │     │████ │     │     │      │
│       │           │         │     │     │     │     │     │      │
└───────────────────────────┴─────────────────────────────────────┘
```

#### Implementation Approach

```typescript
import { useGanttChart } from '@/hooks/useGanttChart';
import { GanttGrid } from './gantt/GanttGrid';
import { GanttTimeline } from './gantt/GanttTimeline';
import { GanttSplitter } from './gantt/GanttSplitter';

export function ScheduleGanttView({ projectId, filters }: ScheduleGanttViewProps) {
  const {
    tasks,
    timeScale,
    isLoading,
    selectedTask,
    onTaskUpdate,
    onTaskSelect
  } = useGanttChart(projectId, filters);

  const [gridWidth, setGridWidth] = useState(400);

  if (isLoading) {
    return <GanttSkeleton />;
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <div className="flex-1 flex">
        {/* Task Grid */}
        <div className="border-r bg-background" style={{ width: gridWidth }}>
          <GanttGrid
            tasks={tasks}
            selectedTask={selectedTask}
            onTaskSelect={onTaskSelect}
          />
        </div>

        {/* Splitter */}
        <GanttSplitter onResize={setGridWidth} />

        {/* Timeline */}
        <div className="flex-1 overflow-auto">
          <GanttTimeline
            tasks={tasks}
            timeScale={timeScale}
            selectedTask={selectedTask}
            onTaskUpdate={onTaskUpdate}
            onTaskSelect={onTaskSelect}
          />
        </div>
      </div>
    </div>
  );
}
```

### 5. ScheduleCalendarView

**File**: `frontend/src/app/(main)/[projectId]/schedule/components/ScheduleCalendarView.tsx`
**Purpose**: FullCalendar integration for calendar view of tasks and events
**Screenshot Reference**: Based on Procore's calendar implementation

#### Props Interface

```typescript
interface ScheduleCalendarViewProps {
  projectId: string;
  filters: ScheduleFilters;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
  extendedProps: {
    type: 'task' | 'milestone' | 'event';
    taskId?: number;
    priority?: string;
    resource?: string;
  };
}
```

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Month] [Week] [Day]     January 2024     [Today] [< >]         │
├─────────────────────────────────────────────────────────────────┤
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat                          │
├─────┼─────┼─────┼─────┼─────┼─────┼─────                        │
│  7  │  8  │  9  │ 10  │ 11  │ 12  │ 13                          │
│     │ MEP │     │     │     │     │                             │
│     │ Demo│     │     │     │     │                             │
├─────┼─────┼─────┼─────┼─────┼─────┼─────                        │
│ 14  │ 15  │ 16  │ 17  │ 18  │ 19  │ 20                          │
│     │████ │████ │████ │Wall │     │                             │
│     │     │     │     │Demo │     │                             │
└─────┴─────┴─────┴─────┴─────┴─────┴─────                        │
```

#### Implementation

```typescript
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useScheduleCalendar } from '@/hooks/useScheduleCalendar';

export function ScheduleCalendarView({ projectId, filters }: ScheduleCalendarViewProps) {
  const {
    events,
    currentView,
    isLoading,
    onEventClick,
    onDateSelect,
    onEventDrop,
    onViewChange
  } = useScheduleCalendar(projectId, filters);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const taskId = event.extendedProps.taskId;
    if (taskId) {
      onEventClick(taskId);
    }
  };

  const eventContent = (eventInfo: EventContentArg) => {
    const { event } = eventInfo;
    const type = event.extendedProps.type;

    return (
      <div className={cn(
        "px-1 py-0.5 text-xs truncate",
        type === 'milestone' && "font-bold",
        type === 'task' && "bg-blue-100 text-blue-800",
        type === 'event' && "bg-green-100 text-green-800"
      )}>
        {type === 'milestone' && '◆ '}
        {event.title}
      </div>
    );
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="h-full p-4 bg-background">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        eventContent={eventContent}
        editable={true}
        droppable={true}
        eventDrop={onEventDrop}
        selectable={true}
        select={onDateSelect}
        height="100%"
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventClassNames={(eventInfo) => {
          const priority = eventInfo.event.extendedProps.priority;
          return cn(
            "cursor-pointer",
            priority === 'urgent' && "border-l-4 border-red-500",
            priority === 'high' && "border-l-4 border-orange-500"
          );
        }}
      />
    </div>
  );
}
```

### 6. TaskDetailModal

**File**: `frontend/src/app/(main)/[projectId]/schedule/components/TaskDetailModal.tsx`
**Purpose**: Comprehensive task view and editing modal

#### Props Interface

```typescript
interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  projectId: string;
  mode: 'view' | 'edit';
}
```

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Task Details                                               [×]  │
├─────────────────────────────────────────────────────────────────┤
│ [Details] [History] [Dependencies] [Attachments]                │
├─────────────────────────────────────────────────────────────────┤
│ Task Name: Demo/Make-safe MEP                [Edit]             │
│ Status: In Progress (25% complete)                              │
│ ProgressBar: ████░░░░░░░░░░░░░░░░                               │
│                                                                 │
│ Dates & Duration:                                               │
│ Start: Jan 15, 2024    End: Jan 17, 2024    Duration: 3 days   │
│                                                                 │
│ Assignment:                                                     │
│ Resource: MEP Contractor                                        │
│ Company: ABC Contracting                                        │
│ Assignees: [John Doe] [Jane Smith]                             │
│                                                                 │
│ Description:                                                    │
│ Demolition and make-safe of MEP systems...                     │
│                                                                 │
│ Notes:                                                          │
│ Coordinate with electrical contractor                           │
│                                                                 │
│                                          [Cancel] [Save]       │
└─────────────────────────────────────────────────────────────────┘
```

### 7. Shared Components

#### 7.1 TaskCard

**File**: `frontend/src/app/(main)/[projectId]/schedule/components/shared/TaskCard.tsx`
**Purpose**: Reusable task display component

```typescript
interface TaskCardProps {
  task: ScheduleTask;
  variant: 'compact' | 'detailed';
  onClick?: () => void;
  showProgress?: boolean;
}

export function TaskCard({ task, variant, onClick, showProgress }: TaskCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        variant === 'compact' && "p-3",
        variant === 'detailed' && "p-4"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {task.is_milestone && <Diamond size={12} className="text-yellow-500" />}
            <h4 className="font-medium text-sm">{task.name}</h4>
          </div>

          {variant === 'detailed' && task.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.start_date && (
              <span>{format(new Date(task.start_date), 'MMM dd')}</span>
            )}
            {task.duration_days && <span>{task.duration_days}d</span>}
            {task.resource_name && <span>{task.resource_name}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <TaskStatusBadge status={task.status} size="sm" />
          {showProgress && (
            <TaskProgressBar
              percentage={task.completion_percentage}
              size="sm"
            />
          )}
        </div>
      </div>

      {task.assignees?.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <TaskAssigneeList assignees={task.assignees} max={3} size="sm" />
        </div>
      )}
    </Card>
  );
}
```

#### 7.2 TaskStatusBadge

```typescript
interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

const statusConfig = {
  not_started: { label: 'Not Started', color: 'gray' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  on_hold: { label: 'On Hold', color: 'yellow' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export function TaskStatusBadge({ status, size = 'md' }: TaskStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={cn(
        `bg-${config.color}-100 text-${config.color}-800`,
        size === 'sm' && "px-1.5 py-0.5 text-xs",
        size === 'md' && "px-2 py-1 text-xs"
      )}
    >
      {config.label}
    </Badge>
  );
}
```

## Responsive Design Details

### Mobile Layout (< 768px)
- Stack navigation tabs vertically
- Gantt view switches to list view automatically
- Calendar shows single day view
- Task cards use compact variant
- Modals become full-screen drawers

### Tablet Layout (768px - 1024px)
- Reduce Gantt grid width to 300px
- Calendar shows week view by default
- Side-by-side layout for task details
- Smaller font sizes and spacing

### Desktop Layout (> 1024px)
- Full Gantt chart with optimal grid/timeline split
- Calendar shows month view by default
- Multiple modals can be open simultaneously
- Hover states and tooltips enabled

## Performance Considerations

### Virtual Scrolling
- Implement virtual scrolling for task lists >100 items
- Use react-window or @tanstack/react-virtual
- Lazy load task details on demand

### Data Optimization
- Implement proper pagination (50 items per page)
- Use React Query for caching and background updates
- Debounce search and filter inputs
- Optimize re-renders with React.memo and useMemo

### Loading States
- Skeleton loaders for each component
- Progressive loading for large datasets
- Error boundaries for graceful failure handling

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow
- Arrow keys navigate within grids and calendars
- Enter/Space activate buttons and links
- Escape closes modals and menus

### Screen Reader Support
- Proper ARIA labels and roles
- Live regions for dynamic updates
- Table headers properly associated
- Form labels linked to controls

### Visual Accessibility
- High contrast mode support
- Focus indicators (2px blue outline)
- Text scalable to 200%
- Color not sole indicator of status

This UI specification provides a comprehensive blueprint for implementing the Schedule feature frontend while maintaining consistency with the existing design system and ensuring optimal user experience across all device types.