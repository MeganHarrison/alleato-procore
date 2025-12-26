import { z } from 'zod';

// Enum for PCO status matching the spec
export const PcoStatusEnum = z.enum([
  'approved',
  'draft',
  'no_charge',
  'pending_in_review',
  'pending_not_pricing',
  'pending_not_proceeding',
  'pending_pricing',
  'pending_proceeding',
  'pending_revised',
  'rejected',
  'void',
]);

export type PcoStatus = z.infer<typeof PcoStatusEnum>;

// Schema for Prime Contract Change Order form
export const PrimeContractChangeOrderSchema = z.object({
  // Basic info
  number: z.string().nullable(),
  revision: z.string().nullable(),
  title: z.string().nullable(),

  // Status and privacy
  status: PcoStatusEnum.optional().default('draft'),
  is_private: z.boolean().optional().default(false),

  // Dates
  due_date: z.string().nullable(), // ISO date string
  invoiced_date: z.string().nullable(),
  paid_date: z.string().nullable(),
  signed_change_order_received_date: z.string().nullable(),
  revised_substantial_completion_date: z.string().nullable(),

  // Reviewers
  designated_reviewer_id: z.string().uuid().nullable(),

  // Description
  description_html: z.string().nullable(),

  // Execution
  executed: z.boolean().optional().default(false),

  // Schedule impact
  schedule_impact_days: z.number().int().min(0).nullable(),

  // Potential Change Orders
  potential_change_order_ids: z.array(z.string().uuid()).optional().default([]),

  // Attachments
  attachment_ids: z.array(z.string().uuid()).optional().default([]),

  // Action flags
  send_email: z.boolean().optional().default(false),
});

export type PrimeContractChangeOrderFormData = z.infer<typeof PrimeContractChangeOrderSchema>;

// Status display labels matching Procore
export const PCO_STATUS_LABELS: Record<PcoStatus, string> = {
  approved: 'Approved',
  draft: 'Draft',
  no_charge: 'No Charge',
  pending_in_review: 'Pending - In Review',
  pending_not_pricing: 'Pending - Not Pricing',
  pending_not_proceeding: 'Pending - Not Proceeding',
  pending_pricing: 'Pending - Pricing',
  pending_proceeding: 'Pending - Proceeding',
  pending_revised: 'Pending - Revised',
  rejected: 'Rejected',
  void: 'Void',
};
