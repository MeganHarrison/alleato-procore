import { z } from "zod";

/**
 * Validation schemas for Prime Contracts API endpoints
 */

export const contractStatusSchema = z.enum([
  "draft",
  "active",
  "completed",
  "cancelled",
  "on_hold",
]);

export const createContractSchema = z.object({
  project_id: z.number().int().positive(),
  contract_number: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  vendor_id: z.string().uuid().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  status: contractStatusSchema.optional().default("draft"),
  original_contract_value: z.number().min(0),
  revised_contract_value: z.number().min(0).optional(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  retention_percentage: z.number().min(0).max(100).optional().default(0),
  payment_terms: z.string().max(1000).optional().nullable(),
  billing_schedule: z.string().max(1000).optional().nullable(),
});

export const updateContractSchema = z.object({
  contract_number: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(500).optional(),
  vendor_id: z.string().uuid().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  status: contractStatusSchema.optional(),
  original_contract_value: z.number().min(0).optional(),
  revised_contract_value: z.number().min(0).optional(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  retention_percentage: z.number().min(0).max(100).optional(),
  payment_terms: z.string().max(1000).optional().nullable(),
  billing_schedule: z.string().max(1000).optional().nullable(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
