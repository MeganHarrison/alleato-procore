"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { StatusBadge } from "@/components/misc/status-badge";
import { DataTable } from "@/components/tables/DataTable";
import { formatCurrency } from "@/config/tables";
import { formatDate } from "@/lib/table-config/formatters";

type InvoiceStatus = "draft" | "submitted" | "approved" | "paid" | "void";

interface Invoice {
  id: string;
  number: string;
  date?: string;
  amount: number;
  paid_amount: number;
  status: InvoiceStatus;
}

interface InvoicesTabProps {
  commitmentId: string;
}

export function InvoicesTab({ commitmentId }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/commitments/${commitmentId}/invoices`);

        if (!response.ok) {
          if (response.status === 404) {
            setInvoices([]);
            return;
          }
          throw new Error("Failed to fetch invoices");
        }

        const payload = await response.json();
        const rawInvoices = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        const normalizedInvoices: Invoice[] = rawInvoices.map((invoice) => {
          const record = invoice as Record<string, unknown>;

          const statusValue =
            typeof record.status === "string"
              ? (record.status.toLowerCase() as InvoiceStatus)
              : ("draft" as InvoiceStatus);

          return {
            id: String(record.id ?? crypto.randomUUID()),
            number: typeof record.number === "string"
              ? record.number
              : typeof record.invoice_number === "string"
                ? record.invoice_number
                : "Draft",
            date:
              typeof record.date === "string"
                ? record.date
                : typeof record.period_start === "string"
                  ? record.period_start
                  : undefined,
            amount: Number(record.amount ?? record.total_amount ?? 0),
            paid_amount: Number(record.paid_amount ?? 0),
            status: statusValue,
          };
        });

        setInvoices(normalizedInvoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [commitmentId]);

  const totals = invoices.reduce(
    (acc, invoice) => {
      const totalPaid = acc.paid + invoice.paid_amount;
      const totalAmount = acc.amount + invoice.amount;

      return {
        paid: totalPaid,
        amount: totalAmount,
      };
    },
    { amount: 0, paid: 0 },
  );

  const remainingBalance = Math.max(totals.amount - totals.paid, 0);

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "number",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Text>{row.original.number}</Text>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <Text>{row.original.date ? formatDate(row.original.date) : "—"}</Text>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Text>{formatCurrency(row.original.amount)}</Text>,
    },
    {
      accessorKey: "paid_amount",
      header: "Paid Amount",
      cell: ({ row }) => <Text>{formatCurrency(row.original.paid_amount)}</Text>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} type="invoice" />
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Invoices associated with this commitment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Invoices associated with this commitment</CardDescription>
        </CardHeader>
        <CardContent>
          <Text tone="destructive">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Invoices associated with this commitment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Text tone="muted" size="sm">
              No invoices for this commitment
            </Text>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Invoices associated with this commitment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <Text size="sm" weight="semibold">
            Invoice Totals
          </Text>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Text size="xs" variant="muted">
                Total Invoiced
              </Text>
              <Text weight="medium">{formatCurrency(totals.amount)}</Text>
            </div>
            <div className="space-y-1">
              <Text size="xs" variant="muted">
                Total Paid
              </Text>
              <Text weight="medium">{formatCurrency(totals.paid)}</Text>
            </div>
            <div className="space-y-1">
              <Text size="xs" variant="muted">
                Remaining Balance
              </Text>
              <Text weight="medium">{formatCurrency(remainingBalance)}</Text>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={invoices}
          showToolbar={false}
          showPagination={invoices.length > 10}
        />
      </CardContent>
    </Card>
  );
}
