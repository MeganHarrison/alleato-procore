import { z } from "zod";
import { optionalNumber, optionalPercent, optionalPositiveNumber } from "./common";

const dateString = z
  .string()
  .trim()
  .optional()
  // DOM only shows placeholder; keep permissive. You can tighten later.
  .refine((v) => !v || /^\d{2}\/\d{2}\/\d{4}$/.test(v), {
    message: "Use mm/dd/yyyy",
  });

export const SovLineItemSchema = z.object({
  lineNumber: optionalNumber, // maps to '#'
  changeEventLineItem: z.string().trim().optional(),
  budgetCode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  amount: optionalPositiveNumber,
  billedToDate: optionalPositiveNumber,
  // Amount Remaining is displayed as a column but is typically computed:
  // amountRemaining = amount - billedToDate
});

export const CreateSubcontractSchema = z.object({
  contractNumber: z.string().trim().optional(),
  contractCompanyId: z.string().trim().optional(),
  title: z.string().trim().optional(),

  status: z.enum(["Draft"]).optional(), // only option visible in captured DOM
  executed: z.boolean().optional(), // required (starred)

  defaultRetainagePercent: optionalPercent,

  description: z.string().optional(), // rich text content as string

  // Attachments: DOM shows file input + attach modal; keep as metadata list for now
  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number().optional(),
        type: z.string().optional(),
      })
    )
    .optional(),

  sov: z.array(SovLineItemSchema).optional(),

  inclusions: z.string().optional(),
  exclusions: z.string().optional(),

  dates: z
    .object({
      startDate: dateString,
      estimatedCompletionDate: dateString,
      actualCompletionDate: dateString,
      contractDate: dateString,
      signedContractReceivedDate: dateString,
      issuedOnDate: dateString,
    })
    .optional(),

  privacy: z.object({
    isPrivate: z.boolean().optional(),
    nonAdminUserIds: z.array(z.string()).optional(),
    allowNonAdminViewSovItems: z.boolean().optional(),
  }).optional(),

  invoiceContacts: z.array(z.string()).optional(),
});

export type CreateSubcontractInput = z.infer<typeof CreateSubcontractSchema>;
export type SovLineItem = z.infer<typeof SovLineItemSchema>;
