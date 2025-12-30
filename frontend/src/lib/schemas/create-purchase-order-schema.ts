import { z } from 'zod';

// SOV Line Item for Purchase Orders (Unit/Quantity-based)
export const PurchaseOrderSovLineItemSchema = z.object({
  lineNumber: z.number(),
  changeEventLineItem: z.string().optional(),
  budgetCode: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().optional(),
  uom: z.string().optional(), // Unit of Measure: EA, LF, SF, etc.
  unitCost: z.number().optional(),
  amount: z.number(),
  billedToDate: z.number().optional(),
});

export type PurchaseOrderSovLineItem = z.infer<typeof PurchaseOrderSovLineItemSchema>;

// Contract Dates
const ContractDatesSchema = z.object({
  contractDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  signedPoReceivedDate: z.string().optional(),
  issuedOnDate: z.string().optional(),
});

// Privacy Settings
const PrivacySchema = z.object({
  isPrivate: z.boolean(),
  nonAdminUserIds: z.array(z.string()).optional(),
  allowNonAdminViewSovItems: z.boolean(),
});

// Main Purchase Order Schema
export const CreatePurchaseOrderSchema = z.object({
  // General Information
  contractNumber: z.string().min(1, 'Contract number is required'),
  contractCompanyId: z.string().optional(),
  title: z.string().optional(),
  status: z.enum(['Draft', 'Approved', 'Sent', 'Acknowledged', 'Completed']),
  executed: z.boolean(),
  defaultRetainagePercent: z.number().min(0).max(100).optional(),
  assignedTo: z.string().optional(), // User ID

  // Billing & Shipping
  billTo: z.string().optional(), // Rich text (HTML)
  paymentTerms: z.string().optional(),
  shipTo: z.string().optional(), // Rich text (HTML)
  shipVia: z.string().optional(),

  // Description
  description: z.string().optional(),

  // Schedule of Values (Unit/Quantity-based)
  sov: z.array(PurchaseOrderSovLineItemSchema),
  accountingMethod: z.enum(['unit-quantity', 'amount']),

  // Contract Dates
  dates: ContractDatesSchema.optional(),

  // Privacy & Access
  privacy: PrivacySchema.optional(),

  // Invoice Contacts
  invoiceContactIds: z.array(z.string()).optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
