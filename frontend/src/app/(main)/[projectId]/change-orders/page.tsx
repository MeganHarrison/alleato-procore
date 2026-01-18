import Link from "next/link";
import {
  GenericDataTable,
  type GenericTableConfig,
} from "@/components/tables/generic-table-factory";
import { TableLayout } from "@/components/layouts";
import { getProjectInfo } from "@/lib/supabase/project-fetcher";
import { Button } from "@/components/ui/button";

export default async function ProjectChangeOrdersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { numericProjectId, supabase } = await getProjectInfo(projectId);

  const { data: changeOrders, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", numericProjectId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <TableLayout>
        <div className="text-center text-destructive p-6">
          Error loading change orders. Please try again later.
        </div>
      </TableLayout>
    );
  }

  const config: GenericTableConfig = {
    title: "Change Orders",
    description: "Manage contract change orders and modifications",
    searchFields: ["co_number", "title", "description"],
    exportFilename: "change-orders-export.csv",
    editConfig: {
      tableName: "change_orders",
      editableFields: ["co_number", "title", "description", "status"],
    },
    rowClickPath: `/${projectId}/change-orders/{id}`,
    requireDeleteConfirmation: true,
    columns: [
      {
        id: "co_number",
        label: "Number",
        defaultVisible: true,
        type: "text",
      },
      {
        id: "title",
        label: "Title",
        defaultVisible: true,
        type: "text",
      },
      {
        id: "description",
        label: "Description",
        defaultVisible: true,
        type: "text",
        renderConfig: {
          type: "truncate",
          maxLength: 50,
        },
      },
      {
        id: "status",
        label: "Status",
        defaultVisible: true,
        type: "badge",
        renderConfig: {
          type: "badge",
          variantMap: {
            approved: "default",
            pending: "secondary",
            draft: "outline",
            executed: "default",
            rejected: "destructive",
          },
          defaultVariant: "outline",
        },
      },
      {
        id: "submitted_at",
        label: "Submitted",
        defaultVisible: true,
        type: "date",
      },
      {
        id: "approved_at",
        label: "Approved",
        defaultVisible: false,
        type: "date",
      },
      {
        id: "created_at",
        label: "Created",
        defaultVisible: false,
        type: "date",
      },
      {
        id: "updated_at",
        label: "Updated",
        defaultVisible: false,
        type: "date",
      },
    ],
    filters: [
      {
        id: "status",
        label: "Status",
        field: "status",
        options: [
          { value: "draft", label: "Draft" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "executed", label: "Executed" },
          { value: "rejected", label: "Rejected" },
        ],
      },
    ],
  };

  const changeOrderRows = changeOrders || [];

  return (
    <TableLayout>
      <div className="flex items-center justify-end">
        <Button asChild data-testid="change-orders-create-button">
          <Link href={`/${projectId}/change-orders/new`}>Create Change Order</Link>
        </Button>
      </div>
      <GenericDataTable
        data={changeOrderRows}
        config={config}
        onDeleteRow={async (id) => {
          const response = await fetch(`/api/change-orders/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json();
            return { error: errorData.error || "Failed to delete change order" };
          }

          return {};
        }}
      />
    </TableLayout>
  );
}
