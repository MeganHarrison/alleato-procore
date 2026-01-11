import { z } from "zod";

/**
 * Validation schemas for Contract Change Orders API endpoints
 */

export const createChangeOrderSchema = z.object({
  contract_id: z.string().uuid(),
  change_order_number: z.string().min(1).max(50),
  description: z.string().min(1).max(1000),
  amount: z.number(),
  status: z
    .enum(["pending", "approved", "rejected"])
    .optional()
    .default("pending"),
  requested_date: z.string().datetime().optional(),
});

export const updateChangeOrderSchema = z.object({
  change_order_number: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(1000).optional(),
  amount: z.number().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  approved_by: z.string().uuid().optional().nullable(),
  approved_date: z.string().datetime().optional().nullable(),
  rejection_reason: z.string().max(1000).optional().nullable(),
});

export const approveChangeOrderSchema = z.object({
  approved_by: z.string().uuid(),
});

export const rejectChangeOrderSchema = z.object({
  rejection_reason: z.string().min(1).max(1000),
});

export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>;
export type UpdateChangeOrderInput = z.infer<typeof updateChangeOrderSchema>;
export type ApproveChangeOrderInput = z.infer<typeof approveChangeOrderSchema>;
export type RejectChangeOrderInput = z.infer<typeof rejectChangeOrderSchema>;
