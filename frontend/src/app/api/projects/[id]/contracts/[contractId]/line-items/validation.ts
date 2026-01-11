import { z } from "zod";

/**
 * Validation schemas for Contract Line Items API endpoints
 */

export const createLineItemSchema = z.object({
  contract_id: z.string().uuid(),
  line_number: z.number().int().positive(),
  description: z.string().min(1).max(500),
  cost_code_id: z.number().int().positive().optional().nullable(),
  quantity: z.number().min(0).optional().default(0),
  unit_of_measure: z.string().max(50).optional().nullable(),
  unit_cost: z.number().min(0).optional().default(0),
});

export const updateLineItemSchema = z.object({
  line_number: z.number().int().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  cost_code_id: z.number().int().positive().optional().nullable(),
  quantity: z.number().min(0).optional(),
  unit_of_measure: z.string().max(50).optional().nullable(),
  unit_cost: z.number().min(0).optional(),
});

export type CreateLineItemInput = z.infer<typeof createLineItemSchema>;
export type UpdateLineItemInput = z.infer<typeof updateLineItemSchema>;
