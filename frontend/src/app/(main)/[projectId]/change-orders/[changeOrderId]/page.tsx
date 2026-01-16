import Link from "next/link";
import { TableLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectInfo } from "@/lib/supabase/project-fetcher";

export default async function ChangeOrderDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; changeOrderId: string }>;
}) {
  const { projectId, changeOrderId } = await params;
  const { numericProjectId, supabase } = await getProjectInfo(projectId);

  const { data: changeOrder, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", numericProjectId)
    .eq("id", Number(changeOrderId))
    .single();

  if (error || !changeOrder) {
    return (
      <TableLayout>
        <div className="text-center text-destructive p-6">
          Change order not found. Please return to the list and try again.
        </div>
      </TableLayout>
    );
  }

  return (
    <TableLayout>
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href={`/${projectId}/change-orders`}>
            Back to Change Orders
          </Link>
        </Button>
        <span
          className="text-sm text-muted-foreground"
          data-testid="created-change-order-id"
        >
          {changeOrder.id}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{changeOrder.title || "Change Order Detail"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Number</p>
            <p className="text-sm">{changeOrder.co_number || "--"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm">{changeOrder.status || "--"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{changeOrder.description || "--"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Submitted</p>
            <p className="text-sm">
              {changeOrder.submitted_at
                ? new Date(changeOrder.submitted_at).toLocaleDateString()
                : "--"}
            </p>
          </div>
        </CardContent>
      </Card>
    </TableLayout>
  );
}
