"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const changeOrderFormSchema = z.object({
  co_number: z.string().min(1, "Change order number is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["draft", "pending", "approved", "executed", "rejected"]),
});

type ChangeOrderFormValues = z.infer<typeof changeOrderFormSchema>;

export default function NewProjectChangeOrderPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string, 10);

  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ChangeOrderFormValues>({
    resolver: zodResolver(changeOrderFormSchema),
    defaultValues: {
      co_number: "",
      title: "",
      description: "",
      status: "draft",
    },
  });

  const onSubmit: SubmitHandler<ChangeOrderFormValues> = async (values) => {
    try {
      setSubmitting(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const now = new Date().toISOString();
      const submittedAt =
        values.status !== "draft" && values.status !== "rejected" ? now : null;

      const { data, error } = await supabase
        .from("change_orders")
        .insert({
          project_id: projectId,
          co_number: values.co_number,
          title: values.title,
          description: values.description,
          status: values.status,
          submitted_at: submittedAt,
          submitted_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (error || !data) {
        toast.error(error?.message || "Failed to create change order");
        return;
      }

      toast.success("Change order created");
      router.push(`/${projectId}/change-orders/${data.id}`);
    } catch (error) {
      toast.error("Unexpected error creating change order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${projectId}/change-orders`);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Change Orders
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Change Order</h1>
        <p className="text-muted-foreground">
          Create a new project change order
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Change Order Details</CardTitle>
          <CardDescription>
            Capture the required details for the change order before submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="co_number">Change Order #*</Label>
                  <Input
                    id="co_number"
                    placeholder="CO-001"
                    data-testid="change-order-number"
                    {...form.register("co_number")}
                  />
                  {form.formState.errors.co_number && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.co_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title*</Label>
                  <Input
                    id="title"
                    placeholder="Owner-requested modification"
                    data-testid="change-order-title"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description*</Label>
                  <Textarea
                    id="description"
                    rows={6}
                    placeholder="Describe the scope and justification for the change"
                    data-testid="change-order-description"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status*</Label>
                  <Select
                    value={form.watch("status") || "draft"}
                    onValueChange={(value) =>
                      form.setValue(
                        "status",
                        value as ChangeOrderFormValues["status"],
                      )
                    }
                  >
                    <SelectTrigger data-testid="change-order-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="executed">Executed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.status.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                data-testid="change-order-submit"
              >
                {submitting ? "Creating..." : "Create Change Order"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
