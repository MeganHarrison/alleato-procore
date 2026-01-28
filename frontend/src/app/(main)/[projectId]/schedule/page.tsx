"use client";

/**
 * =============================================================================
 * PROJECT SCHEDULE PAGE
 * =============================================================================
 *
 * Main scheduling page with:
 * - Split view: Task table + Gantt chart
 * - Task CRUD operations
 * - Hierarchy management (indent/outdent)
 * - View mode toggle (table/gantt/split)
 * - Summary statistics
 */

import { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { TaskTable } from "@/components/scheduling/task-table";
import { GanttChart } from "@/components/scheduling/gantt-chart";
import { TaskEditModal } from "@/components/scheduling/task-edit-modal";
import {
  TaskContextMenu,
  useTaskContextMenu,
} from "@/components/scheduling/task-context-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Table2,
  BarChart3,
  Columns,
  Download,
  Upload,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ScheduleTask,
  ScheduleTaskWithHierarchy,
  ScheduleTaskCreate,
  ScheduleTaskUpdate,
} from "@/types/scheduling";
import { toast } from "sonner";
import { useScheduleTasks } from "@/hooks/use-schedule-tasks";

// =============================================================================
// TYPES
// =============================================================================

type ViewMode = "table" | "gantt" | "split";

// =============================================================================
// SUMMARY CARD COMPONENT
// =============================================================================

function SummaryCards({ summary }: { summary: { total_tasks: number; completed_tasks: number; in_progress_tasks: number; not_started_tasks: number; milestones_count: number; overdue_tasks: number } }) {
  const cards = [
    {
      label: "Total Tasks",
      value: summary.total_tasks,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      label: "Completed",
      value: summary.completed_tasks,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "In Progress",
      value: summary.in_progress_tasks,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Not Started",
      value: summary.not_started_tasks,
      icon: AlertCircle,
      color: "text-gray-600",
    },
    {
      label: "Milestones",
      value: summary.milestones_count,
      icon: Flag,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg"
        >
          <card.icon className={cn("h-4 w-4", card.color)} />
          <span className="text-sm text-muted-foreground">{card.label}:</span>
          <span className="text-sm font-medium">{card.value}</span>
        </div>
      ))}
      {summary.overdue_tasks > 0 && (
        <Badge variant="destructive" className="self-center">
          {summary.overdue_tasks} overdue
        </Badge>
      )}
    </div>
  );
}

// =============================================================================
// VIEW MODE TOGGLE
// =============================================================================

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center border rounded-md">
      <Button
        variant={mode === "table" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-r-none"
        onClick={() => onChange("table")}
        aria-label="Table view"
      >
        <Table2 className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === "split" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-none border-x"
        onClick={() => onChange("split")}
        aria-label="Split view"
      >
        <Columns className="h-4 w-4" />
      </Button>
      <Button
        variant={mode === "gantt" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-l-none"
        onClick={() => onChange("gantt")}
        aria-label="Gantt view"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProjectSchedulePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // State
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentTaskIdForNew, setParentTaskIdForNew] = useState<string | null>(
    null
  );
  const [copiedTask, setCopiedTask] = useState<ScheduleTask | null>(null);

  // Fetch data using the same pattern as other pages (commitments, companies, etc.)
  const { data, error, isLoading, refetch } = useScheduleTasks({
    projectId,
    enabled: true,
  });

  // Context menu
  const { contextMenu, openContextMenu, closeContextMenu, handleContextMenuAction } =
    useTaskContextMenu({
      add_task: () => {
        setParentTaskIdForNew(null);
        setEditingTask(null);
        setIsModalOpen(true);
      },
      edit_task: (task) => {
        if (task) {
          setEditingTask(task);
          setIsModalOpen(true);
        }
      },
      delete_task: async (task) => {
        if (task) {
          await handleDeleteTask(task.id);
        }
      },
      copy_task: (task) => {
        if (task) {
          setCopiedTask(task);
          toast.success("Task copied to clipboard");
        }
      },
      cut_task: (task) => {
        if (task) {
          setCopiedTask(task);
          toast.success("Task cut to clipboard");
        }
      },
      paste_task: async () => {
        if (copiedTask) {
          await handlePasteTask();
        }
      },
      indent_task: async (task) => {
        if (task) {
          await handleIndentTask(task.id);
        }
      },
      outdent_task: async (task) => {
        if (task) {
          await handleOutdentTask(task.id);
        }
      },
      convert_to_milestone: async (task) => {
        if (task) {
          await handleUpdateTask(task.id, { is_milestone: !task.is_milestone });
        }
      },
      scroll_to_task: (task) => {
        if (task) {
          // Scroll to task in Gantt
          const element = document.getElementById(`gantt-task-${task.id}`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
    });

  // Flatten tasks for available tasks list
  const flatTasks = useMemo(() => {
    const result: Array<{ id: string; name: string }> = [];
    const flatten = (tasks: ScheduleTaskWithHierarchy[]) => {
      for (const task of tasks) {
        result.push({ id: task.id, name: task.name });
        if (task.children?.length) {
          flatten(task.children);
        }
      }
    };
    if (data?.tasks) {
      flatten(data.tasks);
    }
    return result;
  }, [data?.tasks]);

  // Handlers
  const handleAddTask = useCallback((parentId: string | null = null) => {
    setParentTaskIdForNew(parentId);
    setEditingTask(null);
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: ScheduleTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleTaskClick = useCallback((task: ScheduleTask) => {
    // For now, just edit on click
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    async (taskData: ScheduleTaskCreate | ScheduleTaskUpdate) => {
      try {
        if (editingTask) {
          // Update existing task
          const res = await fetch(`${apiUrl}/${editingTask.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to update task");
          }

          toast.success("Task updated successfully");
        } else {
          // Create new task
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create task");
          }

          toast.success("Task created successfully");
        }

        // Refresh data
        refetch();
        setIsModalOpen(false);
        setEditingTask(null);
      } catch (err) {
        console.error("Failed to save task:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to save task"
        );
        throw err;
      }
    },
    [projectId, editingTask, refetch]
  );

  const apiUrl = `/api/projects/${projectId}/scheduling/tasks`;

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<ScheduleTask>) => {
      try {
        const res = await fetch(`${apiUrl}/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update task");
        }

        refetch();
      } catch (err) {
        console.error("Failed to update task:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to update task"
        );
        throw err;
      }
    },
    [projectId, refetch]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`${apiUrl}/${taskId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to delete task");
        }

        toast.success("Task deleted successfully");
        refetch();
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      } catch (err) {
        console.error("Failed to delete task:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to delete task"
        );
      }
    },
    [projectId, refetch]
  );

  const handleIndentTask = useCallback(
    async (taskId: string) => {
      // Find the task and its previous sibling to make parent
      const findTaskAndPrevSibling = (
        tasks: ScheduleTaskWithHierarchy[]
      ): { task: ScheduleTaskWithHierarchy | null; prevSibling: ScheduleTaskWithHierarchy | null } => {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].id === taskId) {
            return {
              task: tasks[i],
              prevSibling: i > 0 ? tasks[i - 1] : null,
            };
          }
          if (tasks[i].children?.length) {
            const result = findTaskAndPrevSibling(tasks[i].children);
            if (result.task) return result;
          }
        }
        return { task: null, prevSibling: null };
      };

      if (!data?.tasks) return;

      const { prevSibling } = findTaskAndPrevSibling(data.tasks);

      if (!prevSibling) {
        toast.error("Cannot indent - no previous sibling to become parent");
        return;
      }

      await handleUpdateTask(taskId, { parent_task_id: prevSibling.id });
      toast.success("Task indented");
    },
    [data?.tasks, handleUpdateTask]
  );

  const handleOutdentTask = useCallback(
    async (taskId: string) => {
      // Find the task and get its grandparent
      const findTaskParentAndGrandparent = (
        tasks: ScheduleTaskWithHierarchy[],
        parentId: string | null,
        grandparentId: string | null
      ): { task: ScheduleTaskWithHierarchy | null; parentId: string | null; grandparentId: string | null } => {
        for (const t of tasks) {
          if (t.id === taskId) {
            return { task: t, parentId, grandparentId };
          }
          if (t.children?.length) {
            const result = findTaskParentAndGrandparent(t.children, t.id, parentId);
            if (result.task) return result;
          }
        }
        return { task: null, parentId: null, grandparentId: null };
      };

      if (!data?.tasks) return;

      const { parentId, grandparentId } = findTaskParentAndGrandparent(
        data.tasks,
        null,
        null
      );

      if (!parentId) {
        toast.error("Cannot outdent - task is already at root level");
        return;
      }

      await handleUpdateTask(taskId, { parent_task_id: grandparentId });
      toast.success("Task outdented");
    },
    [data?.tasks, handleUpdateTask]
  );

  const handlePasteTask = useCallback(async () => {
    if (!copiedTask) return;

    try {
      const newTaskData: ScheduleTaskCreate = {
        project_id: Number(projectId),
        name: `${copiedTask.name} (Copy)`,
        parent_task_id: copiedTask.parent_task_id,
        start_date: copiedTask.start_date,
        finish_date: copiedTask.finish_date,
        duration_days: copiedTask.duration_days,
        percent_complete: 0,
        status: "not_started",
        is_milestone: copiedTask.is_milestone,
        constraint_type: copiedTask.constraint_type,
        constraint_date: copiedTask.constraint_date,
        wbs_code: copiedTask.wbs_code,
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaskData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to paste task");
      }

      toast.success("Task pasted successfully");
      refetch();
    } catch (err) {
      console.error("Failed to paste task:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to paste task"
      );
    }
  }, [projectId, copiedTask, refetch]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Actions for header
  const headerActions = (
    <div className="flex items-center gap-2">
      <ViewModeToggle mode={viewMode} onChange={setViewMode} />

      <Button onClick={() => handleAddTask()} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload className="h-4 w-4 mr-2" />
            Import Schedule
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="h-4 w-4 mr-2" />
            Export Schedule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <ProjectToolPage
        title="Schedule"
        description="Track project schedule tasks and milestones"
        actions={headerActions}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProjectToolPage>
    );
  }

  // Error state
  if (error) {
    return (
      <ProjectToolPage
        title="Schedule"
        description="Track project schedule tasks and milestones"
        actions={headerActions}
      >
        <div data-testid="error-state" className="text-center text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-4">
          Failed to load schedule data. Please try again.
        </div>
      </ProjectToolPage>
    );
  }

  return (
    <ProjectToolPage
      title="Schedule"
      description="Track project schedule tasks and milestones"
      actions={headerActions}
    >
      {/* Summary Cards */}
      {data?.summary && <SummaryCards summary={data.summary} />}

      {/* Main Content */}
      <div className="flex-1 min-h-[600px]">
        {viewMode === "table" && (
          <TaskTable
            tasks={data?.tasks || []}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onTaskClick={handleTaskClick}
            onAddSubtask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onIndentTask={handleIndentTask}
            onOutdentTask={handleOutdentTask}
            onUpdateTask={handleUpdateTask}
            onContextMenu={openContextMenu}
            isLoading={isLoading}
          />
        )}

        {viewMode === "gantt" && (
          <GanttChart
            data={data?.ganttData || []}
            onTaskClick={(taskId) => {
              const fullTask = data?.tasks
                ? findTaskById(data.tasks, taskId)
                : null;
              if (fullTask) {
                handleEditTask(fullTask);
              }
            }}
          />
        )}

        {viewMode === "split" && (
          <div className="grid grid-cols-2 gap-4 min-h-[600px]">
            <div className="overflow-auto border rounded-lg">
              <TaskTable
                tasks={data?.tasks || []}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onTaskClick={handleTaskClick}
                onAddSubtask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onIndentTask={handleIndentTask}
                onOutdentTask={handleOutdentTask}
                onUpdateTask={handleUpdateTask}
                onContextMenu={openContextMenu}
                isLoading={isLoading}
              />
            </div>
            <div className="overflow-auto border rounded-lg">
              <GanttChart
                data={data?.ganttData || []}
                onTaskClick={(taskId) => {
                  const fullTask = data?.tasks
                    ? findTaskById(data.tasks, taskId)
                    : null;
                  if (fullTask) {
                    handleEditTask(fullTask);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={editingTask}
        parentTaskId={parentTaskIdForNew}
        projectId={projectId}
        availableTasks={flatTasks}
        onSave={handleSaveTask}
      />

      {/* Context Menu */}
      <TaskContextMenu
        task={contextMenu.task}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onAction={handleContextMenuAction}
        hasCopiedTask={!!copiedTask}
      />
    </ProjectToolPage>
  );
}

// Helper to find task by ID in hierarchy
function findTaskById(
  tasks: ScheduleTaskWithHierarchy[],
  id: string
): ScheduleTask | null {
  for (const task of tasks) {
    if (task.id === id) return task;
    if (task.children?.length) {
      const found = findTaskById(task.children, id);
      if (found) return found;
    }
  }
  return null;
}
