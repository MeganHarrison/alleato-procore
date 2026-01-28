"use client";

/**
 * =============================================================================
 * SCHEDULE VIEWS COMPONENTS
 * =============================================================================
 *
 * Multiple view modes for the scheduling module, inspired by Microsoft Planner:
 * - Grid View: Detailed table with all task properties
 * - Board View: Kanban-style grouped by status/bucket
 * - Calendar View: Monthly calendar with tasks on dates
 * - Timeline View: Gantt chart timeline
 */

import { useMemo, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ScheduleTask,
  ScheduleTaskWithHierarchy,
  TaskStatus,
} from "@/types/scheduling";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Flag,
  Calendar,
  Circle,
  CheckCircle2,
  Clock,
  X,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// =============================================================================
// TYPES
// =============================================================================

// Priority levels for tasks (matching Planner style)
type Priority = "low" | "medium" | "important" | "urgent";

// Label colors (matching Planner style)
type LabelColor = "pink" | "yellow" | "green" | "blue" | "purple" | "red";

interface BaseViewProps {
  tasks: ScheduleTaskWithHierarchy[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onTaskClick: (task: ScheduleTask) => void;
  onAddTask: (parentId?: string | null) => void;
  onEditTask: (task: ScheduleTask) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<ScheduleTask>) => Promise<void>;
  isLoading?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; color: string }> = {
  not_started: { label: "Not started", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-500" },
  complete: { label: "Complete", icon: CheckCircle2, color: "text-green-500" },
};

const priorityConfig: Record<Priority, { label: string; color: string; dotColor: string }> = {
  low: { label: "Low", color: "text-muted-foreground", dotColor: "bg-muted-foreground" },
  medium: { label: "Medium", color: "text-foreground", dotColor: "bg-foreground" },
  important: { label: "Important", color: "text-red-500", dotColor: "bg-red-500" },
  urgent: { label: "Urgent", color: "text-red-600", dotColor: "bg-red-600" },
};

const labelColors: Record<LabelColor, string> = {
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
};

// Flatten hierarchical tasks to a flat array
function flattenTasks(tasks: ScheduleTaskWithHierarchy[]): ScheduleTaskWithHierarchy[] {
  const result: ScheduleTaskWithHierarchy[] = [];
  const flatten = (list: ScheduleTaskWithHierarchy[]) => {
    for (const task of list) {
      result.push(task);
      if (task.children?.length) {
        flatten(task.children);
      }
    }
  };
  flatten(tasks);
  return result;
}

// Get priority from percent_complete or a derived field
function getTaskPriority(task: ScheduleTask): Priority {
  // For now, use a simple heuristic based on milestone status
  if (task.is_milestone) return "important";
  return "medium";
}

// Get a pseudo-random label color based on task WBS code
function getTaskLabel(task: ScheduleTask): LabelColor | null {
  if (!task.wbs_code) return null;
  const colors: LabelColor[] = ["pink", "yellow", "green", "blue", "purple", "red"];
  const hash = task.wbs_code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Group tasks by status for board view
function groupTasksByStatus(tasks: ScheduleTaskWithHierarchy[]): Record<TaskStatus, ScheduleTaskWithHierarchy[]> {
  const flatList = flattenTasks(tasks);
  return {
    not_started: flatList.filter(t => t.status === "not_started"),
    in_progress: flatList.filter(t => t.status === "in_progress"),
    complete: flatList.filter(t => t.status === "complete"),
  };
}

const formatDate = (date: string | null): string => {
  if (!date) return "-";
  try {
    return format(new Date(date), "MMM dd");
  } catch {
    return "-";
  }
};

// =============================================================================
// GRID VIEW (Microsoft Planner Style Table)
// =============================================================================

export function ScheduleGridView({
  tasks,
  selectedIds,
  onSelectionChange,
  onTaskClick,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  isLoading,
}: BaseViewProps) {
  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks]);

  const handleToggleSelect = useCallback(
    (taskId: string, checked: boolean) => {
      const newSelection = new Set(selectedIds);
      if (checked) {
        newSelection.add(taskId);
      } else {
        newSelection.delete(taskId);
      }
      onSelectionChange(newSelection);
    },
    [selectedIds, onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        onSelectionChange(new Set(flatTasks.map(t => t.id)));
      } else {
        onSelectionChange(new Set());
      }
    },
    [flatTasks, onSelectionChange]
  );

  const isAllSelected = flatTasks.length > 0 && selectedIds.size === flatTasks.length;

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_120px_100px_100px_100px_100px_100px_80px] gap-2 px-4 py-3 border-b bg-muted/30 text-sm font-medium text-muted-foreground">
        <div className="flex items-center">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all"
          />
        </div>
        <div className="flex items-center gap-1">
          Task Name
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Assignment
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Start date
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Due date
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Bucket
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Progress
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Priority
          <ChevronRight className="h-3 w-3 rotate-90" />
        </div>
        <div className="flex items-center gap-1">
          Labels
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {flatTasks.map((task) => {
          const priority = getTaskPriority(task);
          const label = getTaskLabel(task);
          const statusInfo = statusConfig[task.status];
          const priorityInfo = priorityConfig[priority];

          return (
            <div
              key={task.id}
              className={cn(
                "grid grid-cols-[40px_1fr_120px_100px_100px_100px_100px_100px_80px] gap-2 px-4 py-3 hover:bg-muted/30 cursor-pointer group",
                selectedIds.has(task.id) && "bg-primary/5"
              )}
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(task.id)}
                  onCheckedChange={(checked) => handleToggleSelect(task.id, !!checked)}
                  aria-label={`Select ${task.name}`}
                />
              </div>

              <div className="flex items-center gap-2 min-w-0">
                {task.is_milestone && <Flag className="h-4 w-4 text-amber-500 shrink-0" />}
                <span className="truncate text-sm">{task.name}</span>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">-</span>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">{formatDate(task.start_date)}</span>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">{formatDate(task.finish_date)}</span>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">{task.wbs_code || "General"}</span>
              </div>

              <div className="flex items-center gap-2">
                <statusInfo.icon className={cn("h-4 w-4", statusInfo.color)} />
                <span className="text-sm">{statusInfo.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {priority === "important" && <AlertTriangle className="h-3 w-3 text-red-500" />}
                <span className={cn("text-sm", priorityInfo.color)}>{priorityInfo.label}</span>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {label && (
                  <Badge
                    variant="secondary"
                    className={cn("h-6 px-2 text-xs text-white", labelColors[label])}
                  >
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:opacity-70" />
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Row */}
      <div
        className="flex items-center gap-2 px-4 py-3 text-primary hover:bg-muted/30 cursor-pointer border-t"
        onClick={() => onAddTask(null)}
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add new task</span>
      </div>
    </div>
  );
}

// =============================================================================
// BOARD VIEW (Kanban Style with Drag & Drop)
// =============================================================================

interface DraggableTaskCardProps {
  task: ScheduleTaskWithHierarchy;
  onTaskClick: (task: ScheduleTask) => void;
  onUpdateTask: (taskId: string, updates: Partial<ScheduleTask>) => Promise<void>;
}

function DraggableTaskCard({ task, onTaskClick, onUpdateTask }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label = getTaskLabel(task);
  const priority = getTaskPriority(task);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Drag Handle + Labels */}
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {label && (
            <Badge
              variant="secondary"
              className={cn("h-5 px-2 text-xs text-white", labelColors[label])}
            >
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Badge>
          )}
        </div>

        {/* Task Name */}
        <div className="flex items-start gap-2">
          <Checkbox
            checked={task.status === "complete"}
            onCheckedChange={async (checked) => {
              await onUpdateTask(task.id, {
                status: checked ? "complete" : "not_started",
                percent_complete: checked ? 100 : 0
              });
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
          <span className={cn(
            "text-sm",
            task.status === "complete" && "line-through text-muted-foreground"
          )}>
            {task.name}
          </span>
        </div>

        {/* Subtasks indicator (if has children) */}
        {task.children && task.children.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>
              {task.children.filter(c => c.status === "complete").length} / {task.children.length}
            </span>
          </div>
        )}

        {/* Priority indicator */}
        {priority === "important" && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskCardOverlay({ task }: { task: ScheduleTaskWithHierarchy }) {
  const label = getTaskLabel(task);
  const priority = getTaskPriority(task);

  return (
    <Card className="cursor-grabbing shadow-xl ring-2 ring-primary w-72">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          {label && (
            <Badge
              variant="secondary"
              className={cn("h-5 px-2 text-xs text-white", labelColors[label])}
            >
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Badge>
          )}
        </div>
        <div className="flex items-start gap-2">
          <Checkbox checked={task.status === "complete"} disabled className="mt-0.5" />
          <span className={cn(
            "text-sm font-medium",
            task.status === "complete" && "line-through text-muted-foreground"
          )}>
            {task.name}
          </span>
        </div>
        {priority === "important" && (
          <div className="flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BoardColumnProps {
  title: string;
  status: TaskStatus;
  tasks: ScheduleTaskWithHierarchy[];
  onTaskClick: (task: ScheduleTask) => void;
  onAddTask: () => void;
  onUpdateTask: (taskId: string, updates: Partial<ScheduleTask>) => Promise<void>;
}

function BoardColumn({ title, status, tasks, onTaskClick, onAddTask, onUpdateTask }: BoardColumnProps) {
  return (
    <div className="flex flex-col w-72 shrink-0 bg-muted/30 rounded-lg p-3">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 py-2 mb-2">
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
          {tasks.length}
        </span>
      </div>

      {/* Add Task Button */}
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 mb-3 text-primary hover:text-primary hover:bg-background"
        onClick={onAddTask}
      >
        <Plus className="h-4 w-4" />
        Add task
      </Button>

      {/* Cards - Droppable Area */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2 min-h-[200px]">
            {tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onUpdateTask={onUpdateTask}
              />
            ))}
            {tasks.length === 0 && (
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center text-sm text-muted-foreground">
                Drop tasks here
              </div>
            )}
          </div>
        </ScrollArea>
      </SortableContext>
    </div>
  );
}

export function ScheduleBoardView({
  tasks,
  selectedIds,
  onSelectionChange,
  onTaskClick,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  isLoading,
}: BaseViewProps) {
  const [activeTask, setActiveTask] = useState<ScheduleTaskWithHierarchy | null>(null);
  const groupedTasks = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  // All flat tasks for finding by ID
  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const columns: { status: TaskStatus; title: string }[] = [
    { status: "not_started", title: "Not Started" },
    { status: "in_progress", title: "In Progress" },
    { status: "complete", title: "Complete" },
  ];

  // Find which column a task belongs to
  const findTaskColumn = (taskId: UniqueIdentifier): TaskStatus | null => {
    for (const status of Object.keys(groupedTasks) as TaskStatus[]) {
      if (groupedTasks[status].some((t) => t.id === taskId)) {
        return status;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = flatTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a column (detect by checking if overId matches a status)
    const isColumn = columns.some((c) => c.status === overId);

    // Find the source column
    const sourceColumn = findTaskColumn(activeId);

    // Find the destination column
    let destColumn: TaskStatus | null = null;
    if (isColumn) {
      destColumn = overId as TaskStatus;
    } else {
      destColumn = findTaskColumn(overId);
    }

    if (!sourceColumn || !destColumn) return;

    // If moving to a different column, update the task status
    if (sourceColumn !== destColumn) {
      await onUpdateTask(activeId, {
        status: destColumn,
        percent_complete: destColumn === "complete" ? 100 : destColumn === "in_progress" ? 50 : 0,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[500px]">
        {columns.map(({ status, title }) => (
          <BoardColumn
            key={status}
            title={title}
            status={status}
            tasks={groupedTasks[status]}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(null)}
            onUpdateTask={onUpdateTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// =============================================================================
// CALENDAR VIEW
// =============================================================================

export function ScheduleCalendarView({
  tasks,
  selectedIds,
  onSelectionChange,
  onTaskClick,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  isLoading,
}: BaseViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ScheduleTaskWithHierarchy[]>();

    flatTasks.forEach(task => {
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      const finishDate = task.finish_date ? parseISO(task.finish_date) : null;

      // Add task to its start date
      if (startDate) {
        const key = format(startDate, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }

      // Also show on finish date if different from start
      if (finishDate && startDate && !isSameDay(startDate, finishDate)) {
        const key = format(finishDate, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        // Avoid duplicates
        const existing = map.get(key)!;
        if (!existing.find(t => t.id === task.id)) {
          existing.push(task);
        }
      }
    });

    return map;
  }, [flatTasks]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px bg-muted mb-px">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-card px-2 py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-muted">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-card min-h-[100px] p-2",
                !isCurrentMonth && "opacity-40"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                isCurrentDay && "bg-primary text-primary-foreground"
              )}>
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => {
                  const label = getTaskLabel(task);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80",
                        label ? cn("text-white", labelColors[label]) : "bg-muted"
                      )}
                      onClick={() => onTaskClick(task)}
                      title={task.name}
                    >
                      {task.name}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TIMELINE VIEW (Simplified Gantt)
// =============================================================================

export function ScheduleTimelineView({
  tasks,
  selectedIds,
  onSelectionChange,
  onTaskClick,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  isLoading,
}: BaseViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks]);

  // Generate weeks for the timeline (12 weeks)
  const weeks = useMemo(() => {
    const result: Date[] = [];
    const start = startOfWeek(subMonths(currentDate, 1));
    for (let i = 0; i < 16; i++) {
      result.push(new Date(start.getTime() + i * 7 * 24 * 60 * 60 * 1000));
    }
    return result;
  }, [currentDate]);

  const timelineStart = weeks[0];
  const timelineEnd = weeks[weeks.length - 1];
  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000));

  // Calculate bar position and width for each task
  const getTaskBarStyle = (task: ScheduleTaskWithHierarchy) => {
    if (!task.start_date || !task.finish_date) return null;

    const startDate = parseISO(task.start_date);
    const finishDate = parseISO(task.finish_date);

    const startOffset = Math.max(0, (startDate.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000));
    const duration = Math.max(1, (finishDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  return (
    <div className="rounded-lg border bg-card">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
          >
            Go to date
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Zoom</span>
          <div className="w-24 h-1 bg-muted rounded-full">
            <div className="w-12 h-1 bg-primary rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Task list sidebar */}
        <div className="w-64 border-r shrink-0">
          <div className="h-10 border-b px-3 flex items-center text-sm font-medium bg-muted/30">
            {format(currentDate, "yyyy")}
          </div>
          <div className="divide-y">
            {flatTasks.map((task, index) => (
              <div
                key={task.id}
                className="h-10 px-3 flex items-center gap-2 hover:bg-muted/30 cursor-pointer"
                onClick={() => onTaskClick(task)}
              >
                <span className="text-xs text-muted-foreground w-6">{index + 1}</span>
                <Checkbox
                  checked={task.status === "complete"}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={async (checked) => {
                    await onUpdateTask(task.id, {
                      status: checked ? "complete" : "not_started",
                      percent_complete: checked ? 100 : 0
                    });
                  }}
                />
                <span className="text-sm truncate flex-1">{task.name}</span>
              </div>
            ))}
            <div
              className="h-10 px-3 flex items-center gap-2 text-primary hover:bg-muted/30 cursor-pointer"
              onClick={() => onAddTask(null)}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add new task</span>
            </div>
          </div>
        </div>

        {/* Timeline area */}
        <ScrollArea className="flex-1">
          <div className="min-w-[800px]">
            {/* Timeline header */}
            <div className="h-10 border-b flex bg-muted/30">
              {weeks.map((week) => (
                <div
                  key={week.toISOString()}
                  className="flex-1 px-2 border-r text-xs text-muted-foreground flex items-center justify-center"
                >
                  {format(week, "MMM d")}
                </div>
              ))}
            </div>

            {/* Task bars */}
            <div className="divide-y relative">
              {/* Today indicator */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                style={{
                  left: `${((new Date().getTime() - timelineStart.getTime()) / (totalDays * 24 * 60 * 60 * 1000)) * 100}%`
                }}
              />

              {flatTasks.map((task) => {
                const barStyle = getTaskBarStyle(task);
                const label = getTaskLabel(task);

                return (
                  <div key={task.id} className="h-10 relative">
                    {/* Week grid lines */}
                    <div className="absolute inset-0 flex">
                      {weeks.map((week) => (
                        <div key={week.toISOString()} className="flex-1 border-r" />
                      ))}
                    </div>

                    {/* Task bar */}
                    {barStyle && (
                      <div
                        className={cn(
                          "absolute top-2 h-6 rounded cursor-pointer hover:opacity-80",
                          task.status === "complete"
                            ? "bg-green-500"
                            : task.status === "in_progress"
                            ? "bg-blue-500"
                            : label
                            ? labelColors[label]
                            : "bg-muted-foreground"
                        )}
                        style={barStyle}
                        onClick={() => onTaskClick(task)}
                        title={task.name}
                      />
                    )}
                  </div>
                );
              })}

              {/* Empty row for add task */}
              <div className="h-10 relative">
                <div className="absolute inset-0 flex">
                  {weeks.map((week) => (
                    <div key={week.toISOString()} className="flex-1 border-r" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
