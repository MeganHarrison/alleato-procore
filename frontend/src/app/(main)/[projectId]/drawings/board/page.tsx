"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
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
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectToolPage } from "@/components/layout/project-tool-page";
import { Download, FileUp, GripVertical, Layers } from "lucide-react";

type DrawingStatus = "Issued for Construction" | "For Review" | "Superseded";

interface BoardItem {
  id: string;
  number: string;
  title: string;
  discipline: string;
  set: string;
  revision: string;
  fileSize: string;
  updatedAt: string;
  updatedBy: string;
  status: DrawingStatus;
}

interface BoardColumn {
  id: string;
  title: string;
  description: string;
  accent: string;
  items: BoardItem[];
}

const initialColumns: Record<string, BoardColumn> = {
  issued: {
    id: "issued",
    title: "Issued for Construction",
    description: "Field-ready revisions that crews can rely on.",
    accent: "bg-emerald-50 border-emerald-200",
    items: [
      {
        id: "drawing-a101",
        number: "A-101",
        title: "Level 1 Floor Plan",
        discipline: "Architectural",
        set: "IFC Set",
        revision: "Rev B",
        fileSize: "4.2 MB",
        updatedAt: "Nov 7, 2025",
        updatedBy: "Architect Studio",
        status: "Issued for Construction",
      },
      {
        id: "drawing-s201",
        number: "S-201",
        title: "Pool Deck Framing",
        discipline: "Structural",
        set: "Issued for Construction",
        revision: "Rev A",
        fileSize: "5.1 MB",
        updatedAt: "Nov 6, 2025",
        updatedBy: "Structural Partner",
        status: "Issued for Construction",
      },
    ],
  },
  review: {
    id: "review",
    title: "For Review",
    description: "Pending approvals before team-wide release.",
    accent: "bg-amber-50 border-amber-200",
    items: [
      {
        id: "drawing-m301",
        number: "M-301",
        title: "Mechanical Roof Plan",
        discipline: "Mechanical",
        set: "Coordination Set",
        revision: "Rev C",
        fileSize: "3.2 MB",
        updatedAt: "Nov 6, 2025",
        updatedBy: "MEP Team",
        status: "For Review",
      },
      {
        id: "drawing-e401",
        number: "E-401",
        title: "Lighting Layout",
        discipline: "Electrical",
        set: "Coordination Set",
        revision: "Rev A",
        fileSize: "1.9 MB",
        updatedAt: "Nov 5, 2025",
        updatedBy: "Electrical Lead",
        status: "For Review",
      },
    ],
  },
  superseded: {
    id: "superseded",
    title: "Superseded",
    description: "Revisions archived after newer releases.",
    accent: "bg-slate-50 border-slate-200",
    items: [
      {
        id: "drawing-a101v1",
        number: "A-101",
        title: "Level 1 Floor Plan (Rev A)",
        discipline: "Architectural",
        set: "Issue for Review",
        revision: "Rev A",
        fileSize: "3.8 MB",
        updatedAt: "Nov 2, 2025",
        updatedBy: "Architect Studio",
        status: "Superseded",
      },
    ],
  },
};

const columnOrder = ["issued", "review", "superseded"];

export default function DrawingsBoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [columns, setColumns] = useState<Record<string, BoardColumn>>(
    initialColumns,
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const totalDrawings = useMemo(
    () =>
      Object.values(columns).reduce(
        (count, column) => count + column.items.length,
        0,
      ),
    [columns],
  );

  const stats = [
    { label: "Total drawings", value: totalDrawings, description: "Across the board" },
    {
      label: "Field ready",
      value: columns.issued.items.length,
      description: "Issued sets",
    },
    {
      label: "Under review",
      value: columns.review.items.length,
      description: "Awaiting approval",
    },
  ];

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return Object.values(columns)
      .flatMap((column) => column.items)
      .find((item) => item.id === activeId) ?? null;
  }, [activeId, columns]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const findColumnId = (itemId: UniqueIdentifier | null): string | null => {
    if (!itemId) return null;
    const entry = Object.entries(columns).find(([, column]) =>
      column.items.some((item) => item.id === itemId),
    );
    return entry?.[0] ?? null;
  };

  const handleDragStart = ({ active }: { active: { id: UniqueIdentifier } }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const sourceColumnId = findColumnId(active.id);
    const destinationColumnId = findColumnId(over.id);
    if (!sourceColumnId || !destinationColumnId) return;

    setColumns((prev) => {
      const source = prev[sourceColumnId];
      const destination = prev[destinationColumnId];
      const activeIndex = source.items.findIndex((item) => item.id === active.id);
      const overIndex = destination.items.findIndex((item) => item.id === over.id);

      if (sourceColumnId === destinationColumnId) {
        if (activeIndex === -1 || overIndex === -1) return prev;
        const updated = arrayMove(source.items, activeIndex, overIndex);
        return {
          ...prev,
          [sourceColumnId]: { ...source, items: updated },
        };
      }

      const movingItem = source.items[activeIndex];
      if (!movingItem) return prev;

      const updatedSource = source.items.filter((item) => item.id !== active.id);
      const updatedDestination = [...destination.items];
      const insertIndex = overIndex === -1 ? updatedDestination.length : overIndex;
      updatedDestination.splice(insertIndex, 0, movingItem);

      return {
        ...prev,
        [sourceColumnId]: { ...source, items: updatedSource },
        [destinationColumnId]: {
          ...destination,
          items: updatedDestination,
        },
      };
    });
  };

  return (
    <ProjectToolPage
      title="Drawings Board"
      description={`Drag-and-drop drawing packages for project ${projectId}`}
      actions={
        <Button size="sm" className="gap-2">
          <FileUp className="h-4 w-4" />
          Upload revisions
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl font-semibold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed border-2 border-border bg-card">
          <CardHeader className="flex flex-wrap items-center gap-3 justify-between pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <CardTitle className="text-base">Status board</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export board
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-4 pt-2">
            <DndContext
              collisionDetection={closestCenter}
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 min-w-[700px]">
                {columnOrder.map((columnId) => {
                  const column = columns[columnId];
                  return (
                    <div
                      key={column.id}
                      className={`min-w-[280px] w-[320px] rounded-2xl border p-4 ${column.accent}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{column.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {column.description}
                          </p>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-white text-sm font-semibold text-foreground">
                          {column.items.length}
                        </span>
                      </div>
                      <SortableContext
                        items={column.items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {column.items.map((item) => (
                            <BoardCard key={item.id} item={item} columnId={column.id} />
                          ))}
                          {column.items.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                              Drop drawings here
                            </div>
                          ) : null}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>
              <DragOverlay>
                {activeItem ? (
                  <div className="w-[320px]">
                    <BoardCardPreview item={activeItem} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </ProjectToolPage>
  );
}

interface BoardCardProps {
  item: BoardItem;
  columnId: string;
}

function BoardCard({ item, columnId }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.id,
      data: {
        columnId,
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border bg-background p-4 shadow-sm transition ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <Button
          {...attributes}
          {...listeners}
          variant="outline"
          size="icon"
          className="text-muted-foreground hover:bg-muted/40"
          aria-label="Drag card"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <BoardCardPreview item={item} />
      </div>
    </div>
  );
}

function BoardCardPreview({ item }: { item: BoardItem }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {item.set}
        </span>
        <span className="text-xs text-muted-foreground">{item.revision}</span>
      </div>
      <div className="text-lg font-semibold text-foreground">{item.number}</div>
      <p className="text-sm text-muted-foreground">{item.title}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="outline" className="px-2 py-1 text-[11px]">
          {item.discipline}
        </Badge>
        <span>{item.fileSize}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{item.updatedBy}</span>
        <span>{item.updatedAt}</span>
      </div>
    </div>
  );
}
