// =============================================================================
// SCAFFOLD: CRUD Form Dialog Component
// Replace: __ENTITY__, __entity__, __entities__, __ENTITY_TABLE__
// =============================================================================

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Form validation schema
const __entity__FormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
});

type __ENTITY__FormData = z.infer<typeof __entity__FormSchema>;

interface __ENTITY__FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number | string;
  __entity__?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  onSuccess?: () => void;
}

export function __ENTITY__FormDialog({
  open,
  onOpenChange,
  projectId,
  __entity__,
  onSuccess,
}: __ENTITY__FormDialogProps) {
  const isEdit = !!__entity__;

  const form = useForm<__ENTITY__FormData>({
    resolver: zodResolver(__entity__FormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when dialog opens or __entity__ changes
  useEffect(() => {
    if (open) {
      if (__entity__) {
        form.reset({
          name: __entity__.name,
          description: __entity__.description || "",
        });
      } else {
        form.reset({
          name: "",
          description: "",
        });
      }
    }
  }, [open, __entity__, form]);

  const onSubmit = async (data: __ENTITY__FormData) => {
    try {
      const projectIdNum = typeof projectId === "string"
        ? parseInt(projectId, 10)
        : projectId;

      const url = isEdit
        ? `/api/projects/${projectIdNum}/__entities__/${__entity__?.id}`
        : `/api/projects/${projectIdNum}/__entities__`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save __entity__");
      }

      toast.success(
        isEdit ? "__ENTITY__ updated successfully" : "__ENTITY__ created successfully"
      );

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save __entity__"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit __ENTITY__" : "Create __ENTITY__"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEdit
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
