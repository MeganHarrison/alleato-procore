"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatCurrency } from "@/config/tables";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LineItem {
  id: string;
  line_number?: number | null;
  budget_code?: string | null;
  description?: string | null;
  amount?: number | null;
  billed_to_date?: number | null;
}

interface ScheduleOfValuesTabProps {
  lineItems: LineItem[];
  isLoading?: boolean;
  error?: string | null;
}

export function ScheduleOfValuesTab({
  lineItems,
  isLoading = false,
  error = null,
}: ScheduleOfValuesTabProps) {
  const [items, setItems] = useState<LineItem[]>(lineItems);

  useEffect(() => {
    setItems(lineItems);
  }, [lineItems]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const amount = Number(item.amount ?? 0);
          const billed = Number(item.billed_to_date ?? 0);

          return {
            amount: acc.amount + amount,
            billed: acc.billed + billed,
          };
        },
        { amount: 0, billed: 0 },
      ),
    [items],
  );

  const amountRemaining = Math.max(totals.amount - totals.billed, 0);

  const handleAdd = () => {
    const nextLineNumber = (items[items.length - 1]?.line_number || items.length) + 1;
    setItems([
      ...items,
      {
        id: `temp-${Date.now()}`,
        line_number: nextLineNumber,
        description: "",
        budget_code: "",
        amount: 0,
        billed_to_date: 0,
      },
    ]);
  };

  const updateItem = (
    id: string,
    field: keyof LineItem,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "amount" || field === "billed_to_date") {
          return { ...item, [field]: value === "" ? null : Number(value) };
        }

        if (field === "line_number") {
          return { ...item, line_number: value === "" ? null : Number(value) };
        }

        return { ...item, [field]: value };
      }),
    );
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const newItems = [...prev];
      const [removed] = newItems.splice(index, 1);
      newItems.splice(targetIndex, 0, removed);

      return newItems.map((item, idx) => ({
        ...item,
        line_number: idx + 1,
      }));
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule of Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <CardTitle>Schedule of Values</CardTitle>
        </CardHeader>
        <CardContent>
          <Text tone="destructive">{error}</Text>
        </CardContent>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule of Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Text tone="muted" size="sm">
              No SOV line items for this commitment
            </Text>
            <div className="mt-4">
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule of Values</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Text size="sm" tone="muted">
            Manage line items for this commitment
          </Text>
          <Button size="sm" onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Line Item
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Budget Code</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Billed to Date</th>
                <th className="px-4 py-3 text-right font-medium">Remaining</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const amount = Number(item.amount ?? 0);
                const billed = Number(item.billed_to_date ?? 0);
                const remaining = Math.max(amount - billed, 0);

                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input
                        aria-label={`Line number ${index + 1}`}
                        type="number"
                        className="w-20"
                        value={item.line_number ?? ""}
                        onChange={(e) => updateItem(item.id, "line_number", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 min-w-[200px]">
                      <Input
                        aria-label={`Description ${index + 1}`}
                        value={item.description ?? ""}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input
                        aria-label={`Budget code ${index + 1}`}
                        value={item.budget_code ?? ""}
                        onChange={(e) => updateItem(item.id, "budget_code", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        aria-label={`Amount ${index + 1}`}
                        type="number"
                        className="text-right"
                        value={item.amount ?? ""}
                        onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Input
                        aria-label={`Billed to date ${index + 1}`}
                        type="number"
                        className="text-right"
                        value={item.billed_to_date ?? ""}
                        onChange={(e) => updateItem(item.id, "billed_to_date", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">{formatCurrency(remaining)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Move line ${index + 1} up`}
                          disabled={index === 0}
                          onClick={() => moveItem(item.id, "up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Move line ${index + 1} down`}
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(item.id, "down")}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete line ${index + 1}`}
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/60">
              <tr className="font-semibold">
                <td className="px-4 py-3" colSpan={3}>
                  Totals
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(totals.amount)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(totals.billed)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(amountRemaining)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
