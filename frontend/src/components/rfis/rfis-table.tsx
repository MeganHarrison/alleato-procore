"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, CheckCircle } from "lucide-react";
import type { Database } from "@/types/database.types";

export type RfiRow = Database["public"]["Tables"]["rfis"]["Row"] & {
  projects?: {
    id: number;
    name: string | null;
  } | null;
};

interface RfisTableProps {
  rfis: RfiRow[];
  showProjectColumn?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  open: "bg-blue-100 text-blue-700",
  answered: "bg-purple-100 text-purple-700",
  closed: "bg-green-100 text-green-700",
};

const getStatusLabel = (status: string | null) =>
  status ? status.replace(/_/g, " ") : "-";

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const isOverdue = (rfi: RfiRow) => {
  if (!rfi.due_date) return false;
  const dueDate = new Date(rfi.due_date);
  if (Number.isNaN(dueDate.getTime())) return false;
  const status = rfi.status?.toLowerCase();
  if (status === "closed") return false;
  return dueDate < new Date();
};

export function RfisTable({ rfis, showProjectColumn = false }: RfisTableProps) {
  const columns = React.useMemo<ColumnDef<RfiRow>[]>(() => {
    const base: ColumnDef<RfiRow>[] = [
      {
        accessorKey: "number",
        header: "Number",
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-[hsl(var(--procore-orange))] hover:underline"
          >
            RFI-{row.getValue("number")}
          </button>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="block max-w-xs truncate">
            {row.getValue("subject")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = (row.getValue("status") as string | null) ?? "";
          return (
            <Badge className={STATUS_STYLES[status] || STATUS_STYLES.draft}>
              {getStatusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "ball_in_court",
        header: "Ball In Court",
        cell: ({ row }) => row.getValue("ball_in_court") || "-",
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.getValue("due_date")),
      },
      {
        accessorKey: "received_from",
        header: "Received From",
        cell: ({ row }) => row.getValue("received_from") || "-",
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => formatDate(row.getValue("created_at")),
      },
    ];

    if (showProjectColumn) {
      base.splice(2, 0, {
        id: "project",
        header: "Project",
        cell: ({ row }) => row.original.projects?.name || "-",
      });
    }

    base.push({
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CheckCircle className="mr-2 h-4 w-4" />
              Close
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return base;
  }, [showProjectColumn]);

  const summary = React.useMemo(() => {
    const statusCounts = rfis.reduce(
      (acc, rfi) => {
        const status = rfi.status?.toLowerCase() ?? "draft";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      open: statusCounts.open ?? 0,
      answered: statusCounts.answered ?? 0,
      closed: statusCounts.closed ?? 0,
      overdue: rfis.filter(isOverdue).length,
    };
  }, [rfis]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Open</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary.open}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Overdue</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary.overdue}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Answered</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary.answered}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Closed</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summary.closed}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border overflow-hidden">
        <DataTable
          columns={columns}
          data={rfis}
          searchKey="subject"
          searchPlaceholder="Search RFIs..."
        />
      </div>
    </div>
  );
}
