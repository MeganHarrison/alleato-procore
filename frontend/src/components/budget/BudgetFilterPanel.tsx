"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Maximize2,
  Minimize2,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BudgetView, BudgetSnapshot, BudgetGroup } from "@/types/budget";
import { cn } from "@/lib/utils";

export type QuickFilterType =
  | "over-budget"
  | "under-budget"
  | "no-activity"
  | "all";

interface BudgetFilterPanelProps {
  views: BudgetView[];
  snapshots: BudgetSnapshot[];
  groups: BudgetGroup[];
  selectedView: string;
  selectedSnapshot: string;
  selectedGroup: string;
  onViewChange: (viewId: string) => void;
  onSnapshotChange: (snapshotId: string) => void;
  onGroupChange: (groupId: string) => void;
  onAddFilter?: () => void;
  onAnalyzeVariance?: () => void;
  onToggleFullscreen?: () => void;
  onQuickFilterChange?: (filter: QuickFilterType) => void;
  activeQuickFilter?: QuickFilterType;
  isFullscreen?: boolean;
}

export function BudgetFilterPanel({
  views,
  snapshots,
  groups,
  selectedView,
  selectedSnapshot,
  selectedGroup,
  onViewChange,
  onSnapshotChange,
  onGroupChange,
  onAddFilter,
  onAnalyzeVariance,
  onToggleFullscreen,
  onQuickFilterChange,
  activeQuickFilter = "all",
  isFullscreen = false,
}: BudgetFilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const selectedViewName =
    views.find((v) => v.id === selectedView)?.name || "Select View";
  const selectedSnapshotName =
    snapshots.find((s) => s.id === selectedSnapshot)?.name || "Select Snapshot";
  const selectedGroupName =
    groups.find((g) => g.id === selectedGroup)?.name || "Select Group";

  const quickFilterLabels = {
    all: "All Items",
    "over-budget": "Over Budget",
    "under-budget": "Under Budget",
    "no-activity": "No Activity",
  };

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (activeQuickFilter !== "all") count++;
    if (selectedView !== "procore-standard") count++;
    if (selectedSnapshot !== "current") count++;
    if (selectedGroup !== "cost-code-tier-1") count++;
    return count;
  }, [activeQuickFilter, selectedView, selectedSnapshot, selectedGroup]);

  return (
    <div className="w-full bg-muted/30 border border-border rounded-lg transition-all duration-300">
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        {/* Collapsed header - always visible */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {isCollapsed ? (
              <span className="text-sm font-medium text-foreground">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {activeFilterCount} active
                  </span>
                )}
              </span>
            ) : (
              <span className="text-sm font-medium text-foreground">Filters</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Analysis Tools - always visible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-sm gap-1.5 bg-background hover:bg-accent transition-colors"
                  onClick={onAnalyzeVariance}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Analyze Variance</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>
                  Compare projected costs against the original budget to identify
                  variances and potential cost overruns
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent transition-colors"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>

            {/* Collapse toggle */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent transition-colors"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Expandable filter content */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-up-1 data-[state=open]:slide-down-1 duration-200">
          <div className="px-4 pb-4 pt-1">
            {/* Filter controls grid */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Row 1: View + Snapshot */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">View</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 min-w-[160px] justify-between text-sm bg-background hover:bg-accent transition-colors"
                      aria-label="View"
                    >
                      {selectedViewName}
                      <ChevronDown className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    {views.map((view) => (
                      <DropdownMenuItem
                        key={view.id}
                        onSelect={() => onViewChange(view.id)}
                        className={cn(
                          "cursor-pointer",
                          selectedView === view.id && "bg-accent"
                        )}
                      >
                        {view.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">Snapshot</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 min-w-[110px] justify-between text-sm bg-background hover:bg-accent transition-colors"
                      aria-label="Snapshot"
                    >
                      {selectedSnapshotName}
                      <ChevronDown className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    {snapshots.map((snapshot) => (
                      <DropdownMenuItem
                        key={snapshot.id}
                        onSelect={() => onSnapshotChange(snapshot.id)}
                        className={cn(
                          "cursor-pointer",
                          selectedSnapshot === snapshot.id && "bg-accent"
                        )}
                      >
                        {snapshot.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Separator */}
              <div className="hidden md:block w-px h-8 bg-border" />

              {/* Row 2: Group + Quick Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">Group</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 min-w-[130px] justify-between text-sm bg-background hover:bg-accent transition-colors"
                      aria-label="Group"
                    >
                      {selectedGroupName}
                      <ChevronDown className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    {groups.map((group) => (
                      <DropdownMenuItem
                        key={group.id}
                        onSelect={() => onGroupChange(group.id)}
                        className={cn(
                          "cursor-pointer",
                          selectedGroup === group.id && "bg-accent"
                        )}
                      >
                        {group.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">Quick Filter</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={activeQuickFilter !== "all" ? "default" : "outline"}
                      className={cn(
                        "h-8 min-w-[130px] justify-between text-sm transition-colors",
                        activeQuickFilter === "all" && "bg-background hover:bg-accent"
                      )}
                      aria-label="Quick Filter"
                    >
                      <Filter className="w-3.5 h-3.5 mr-2" />
                      {quickFilterLabels[activeQuickFilter]}
                      <ChevronDown className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[180px]">
                    <DropdownMenuItem
                      onSelect={() => onQuickFilterChange?.("all")}
                      className={cn(
                        "cursor-pointer",
                        activeQuickFilter === "all" && "bg-accent"
                      )}
                    >
                      All Items
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => onQuickFilterChange?.("over-budget")}
                      className={cn(
                        "cursor-pointer",
                        activeQuickFilter === "over-budget" && "bg-accent"
                      )}
                    >
                      <span className="text-red-600 mr-2">●</span>
                      Over Budget
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onQuickFilterChange?.("under-budget")}
                      className={cn(
                        "cursor-pointer",
                        activeQuickFilter === "under-budget" && "bg-accent"
                      )}
                    >
                      <span className="text-green-600 mr-2">●</span>
                      Under Budget
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onQuickFilterChange?.("no-activity")}
                      className={cn(
                        "cursor-pointer",
                        activeQuickFilter === "no-activity" && "bg-accent"
                      )}
                    >
                      <span className="text-muted-foreground mr-2">●</span>
                      No Activity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Separator */}
              <div className="hidden md:block w-px h-8 bg-border" />

              {/* Row 3: Add Filter button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="h-8 text-sm bg-background hover:bg-accent transition-colors"
                  onClick={onAddFilter}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Filter
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
