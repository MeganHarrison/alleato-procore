"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { PageContainer, PageTabs, ProjectPageHeader } from "@/components/layout";
import {
  SummaryCardGrid,
  formatCurrencyValue,
  formatNumberValue,
} from "@/components/ui/summary-card-grid";
import { ChangeEventsTableColumns } from "@/components/domain/change-events/ChangeEventsTableColumns";
import { useProjectChangeEvents, type ChangeEvent } from "@/hooks/use-change-events";
import { formatDate } from "@/lib/utils";

type TabValue = "detail" | "summary" | "rfqs" | "recycle";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  pending: "Pending Approval",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
  converted: "Converted",
};

const getStatusKey = (status?: string | null) =>
  status?.toLowerCase().replace(/\s+/g, "_") ?? "unknown";

const getStatusLabel = (status?: string | null) => {
  if (!status) return "Unknown";
  return STATUS_LABELS[status.toLowerCase()] ?? status;
};

export default function ProjectChangeEventsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const projectIdParamRaw = params.projectId;
  const projectIdParam =
    typeof projectIdParamRaw === "string"
      ? projectIdParamRaw
      : Array.isArray(projectIdParamRaw)
      ? projectIdParamRaw[0]
      : undefined;
  const parsedProjectId = projectIdParam ? parseInt(projectIdParam, 10) : NaN;
  const hasValidProjectId = Number.isFinite(parsedProjectId) && parsedProjectId > 0;
  const projectId = hasValidProjectId ? parsedProjectId : 0;
  const statusParam = searchParams.get("status") ?? "";

  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("detail");

  const detailOptions = useMemo(
    () => ({
      status: statusParam || undefined,
      limit: 500,
      enabled: hasValidProjectId,
    }),
    [statusParam, hasValidProjectId],
  );

  const { changeEvents = [], isLoading, error, refetch: refetchChangeEvents } =
    useProjectChangeEvents(projectId, detailOptions);

  const {
    changeEvents: deletedEvents = [],
    isLoading: isRecycleLoading,
    refetch: refetchDeletedEvents,
  } = useProjectChangeEvents(projectId, {
    includeDeleted: true,
    enabled: hasValidProjectId,
  });

  const recycleList = useMemo(
    () => deletedEvents.filter((event) => Boolean(event.deleted_at)),
    [deletedEvents],
  );

  const handleView = useCallback(
    (changeEventId: number) => {
      router.push(`/${projectId}/change-events/${changeEventId}`);
    },
    [projectId, router],
  );

  const handleEdit = useCallback(
    (changeEventId: number) => {
      router.push(`/${projectId}/change-events/${changeEventId}/edit`);
    },
    [projectId, router],
  );

  const handleDelete = useCallback(
    async (changeEventId: number) => {
      const confirmed = window.confirm(
        "Move this change event to the recycle bin? You can restore it later manually.",
      );
      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(
          `/api/projects/${projectId}/change-events/${changeEventId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const message = await response.text();
          throw new Error(
            message || "Unable to delete change event. Check permissions and try again.",
          );
        }

        toast.success("Change event moved to recycle bin");
        refetchChangeEvents();
        refetchDeletedEvents();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete change event";
        toast.error(message);
      }
    },
    [projectId, refetchChangeEvents, refetchDeletedEvents],
  );

  const detailColumns = useMemo(
    () =>
      ChangeEventsTableColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete],
  );

  const detailTable = useReactTable({
    data: changeEvents
      .filter((event) => !event.deleted_at)
      .filter((event) => {
        const term = searchValue.trim().toLowerCase();
        if (!term) return true;

        const number = event.event_number ?? `CE-${event.id}`;
        return (
          number.toLowerCase().includes(term) ||
          event.title?.toLowerCase().includes(term) ||
          event.reason?.toLowerCase().includes(term) ||
          event.notes?.toLowerCase().includes(term)
        );
      }),
    columns: detailColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    changeEvents.forEach((event) => {
      const key = getStatusKey(event.status);
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [changeEvents]);

  const totalEvents = changeEvents.length;
  const openCount = statusCounts.open ?? 0;
  const pendingCount = (statusCounts.pending ?? 0) + (statusCounts.pending_approval ?? 0);
  const approvedCount = statusCounts.approved ?? 0;
  const rejectedCount = statusCounts.rejected ?? 0;
  const closedCount = statusCounts.closed ?? 0;

  const totalImpact = changeEvents.reduce(
    (sum, event) => sum + (event.estimated_impact ?? 0),
    0,
  );

  const mostRecentUpdate = useMemo(() => {
    let timestamp = 0;
    changeEvents.forEach((event) => {
      const candidate = event.updated_at ?? event.created_at;
      if (!candidate) return;
      const millis = new Date(candidate).getTime();
      if (!Number.isNaN(millis) && millis > timestamp) {
        timestamp = millis;
      }
    });
    return timestamp ? new Date(timestamp).toISOString() : null;
  }, [changeEvents]);

  const topImpactEvents = useMemo(() => {
    return [...changeEvents]
      .sort((a, b) => (b.estimated_impact ?? 0) - (a.estimated_impact ?? 0))
      .slice(0, 3);
  }, [changeEvents]);

  const summaryCards = useMemo(
    () => [
      {
        id: "total-events",
        label: "Change Events",
        value: formatNumberValue(totalEvents),
      },
      {
        id: "open",
        label: "Open",
        value: formatNumberValue(openCount),
      },
      {
        id: "pending",
        label: "Pending Approval",
        value: formatNumberValue(pendingCount),
      },
      {
        id: "approved",
        label: "Approved",
        value: formatNumberValue(approvedCount),
      },
      {
        id: "impact",
        label: "Estimated Impact",
        value: formatCurrencyValue(totalImpact),
      },
    ],
    [totalEvents, openCount, pendingCount, approvedCount, totalImpact],
  );

  const recycleColumns = useMemo<ColumnDef<ChangeEvent>[]>(() => {
    return [
      {
        accessorKey: "event_number",
        header: "#",
        cell: ({ row }) => {
          const number = row.getValue("event_number") as string | null;
          return <span className="font-mono text-sm">{number ?? `CE-${row.original.id}`}</span>;
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="max-w-xs truncate font-medium">{row.getValue("title") as string}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline">
            {getStatusLabel(row.getValue("status") as string | null)}
          </Badge>
        ),
      },
      {
        accessorKey: "deleted_at",
        header: "Deleted On",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.getValue("deleted_at") as string)}
          </span>
        ),
      },
    ];
  }, []);

  const recycleTable = useReactTable({
    data: recycleList,
    columns: recycleColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!hasValidProjectId) {
    return (
      <>
        <ProjectPageHeader
          title="Change Events"
          description="Provide a valid project identifier to access change events."
        />
        <PageContainer>
          <Card>
            <CardHeader>
              <CardTitle>Invalid Project</CardTitle>
              <CardDescription>
                Change events require a numeric project identifier. Navigate through the
                project workspace to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text tone="muted">Missing or malformed `{projectIdParam}` parameter.</Text>
            </CardContent>
          </Card>
        </PageContainer>
      </>
    );
  }

  const basePath = `/${projectId}/change-events`;
  const statusTabs = [
    {
      label: "All Change Events",
      href: basePath,
      count: totalEvents,
    },
    {
      label: "Open",
      href: `${basePath}?status=open`,
      count: openCount,
    },
    {
      label: "Pending",
      href: `${basePath}?status=pending`,
      count: pendingCount,
    },
    {
      label: "Approved",
      href: `${basePath}?status=approved`,
      count: approvedCount,
    },
  ];

  return (
    <>
      <ProjectPageHeader
        title="Change Events"
        description="Track scope changes, approvals, line items, and financial impact."
        actions={
          <Button
            size="sm"
            onClick={() => router.push(`/${projectId}/change-events/new`)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Change Event
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="recycle">Recycle Bin</TabsTrigger>
        </TabsList>

        <TabsContent value="detail">
          <PageContainer className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Search change events..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="max-w-md"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refetchChangeEvents}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Text size="sm" tone="muted">
                  Showing {detailTable.getRowModel().rows.length} / {totalEvents}
                </Text>
              </div>
            </div>

            <PageTabs tabs={statusTabs} />

            {error ? (
              <Card>
                <CardHeader>
                  <CardTitle>Unable to load change events</CardTitle>
                  <CardDescription>{error.message}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={refetchChangeEvents}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : isLoading && !detailTable.getRowModel().rows.length ? (
              <Card className="space-y-3 p-6">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-4 w-full rounded-full bg-muted/40 animate-pulse"
                  />
                ))}
              </Card>
            ) : detailTable.getRowModel().rows.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No change events yet</CardTitle>
                  <CardDescription>
                    Create your first change event to begin tracking scope changes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/${projectId}/change-events/new`)}
                  >
                    Add change event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    {detailTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {!header.isPlaceholder &&
                              flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {detailTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </PageContainer>
        </TabsContent>

        <TabsContent value="summary">
          <PageContainer className="space-y-6">
            {changeEvents.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>No data available yet.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                <SummaryCardGrid cards={summaryCards} columns={3} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status breakdown</CardTitle>
                      <CardDescription>
                        Updated {mostRecentUpdate ? formatDate(mostRecentUpdate) : "—"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[{
                        label: "Open",
                        value: openCount,
                      }, {
                        label: "Pending Approval",
                        value: pendingCount,
                      }, {
                        label: "Approved",
                        value: approvedCount,
                      }, {
                        label: "Rejected",
                        value: rejectedCount,
                      }, {
                        label: "Closed",
                        value: closedCount,
                      }].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <Badge variant="outline">{item.value}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Top estimated impacts</CardTitle>
                      <CardDescription>
                        Ranked by preliminary estimate across active change events.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topImpactEvents.length === 0 ? (
                        <Text tone="muted" size="sm">
                          Add change events to see financial highlights.
                        </Text>
                      ) : (
                        topImpactEvents.map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div>
                              <p className="text-sm font-medium">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {(event.event_number ?? `CE-${event.id}`)} • {getStatusLabel(event.status)}
                              </p>
                            </div>
                            <span className="text-sm font-medium">
                              {formatCurrencyValue(event.estimated_impact ?? 0)}
                            </span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </PageContainer>
        </TabsContent>

        <TabsContent value="rfqs">
          <PageContainer>
            <Card>
              <CardHeader>
                <CardTitle>RFQ Management (Phase 2)</CardTitle>
                <CardDescription>
                  Request for Quote workflows are planned. This tab will surface RFQ creation,
                  distribution, and collaborator responses once Phase 2 is complete.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  RFQs will be generated from approved change events, assigned to
                  subcontractors, and tracked until a response is submitted.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Design RFQ template and data model</li>
                  <li>Generate RFQs directly from the change event detail view</li>
                  <li>Track response status, pricing, and attachments</li>
                  <li>Expose comparison insights alongside change event totals</li>
                </ul>
              </CardContent>
            </Card>
          </PageContainer>
        </TabsContent>

        <TabsContent value="recycle">
          <PageContainer className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recycle Bin</CardTitle>
                <CardDescription>
                  Soft-deleted change events are retained for compliance. They can currently be
                  restored through the Supabase dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
            {isRecycleLoading && recycleList.length === 0 ? (
              <Card className="space-y-3 p-6">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="h-4 w-full rounded-full bg-muted/40 animate-pulse"
                  />
                ))}
              </Card>
            ) : recycleList.length === 0 ? (
              <Card>
                <CardContent className="text-center text-sm text-muted-foreground">
                  No items in the recycle bin.
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    {recycleTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {!header.isPlaceholder &&
                              flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {recycleTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </PageContainer>
        </TabsContent>
      </Tabs>
    </>
  );
}
