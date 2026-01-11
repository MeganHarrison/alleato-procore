import { z } from "zod";

export const userFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(255),
  last_name: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone_mobile: z.string().optional().or(z.literal("")),
  phone_business: z.string().optional().or(z.literal("")),
  job_title: z.string().optional().or(z.literal("")),
  company_id: z
    .string()
    .uuid("Invalid company ID")
    .optional()
    .or(z.literal("")),
  permission_template_id: z.string().uuid("Permission template is required"),
  department: z.string().optional().or(z.literal("")),
  send_invite: z.boolean().default(false),
});

export type UserFormData = z.infer<typeof userFormSchema>;

export const bulkUserSchema = z.object({
  users: z.array(userFormSchema),
  send_invites: z.boolean().default(false),
});

export type BulkUserData = z.infer<typeof bulkUserSchema>;

export const userPermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      tool_name: z.string(),
      permission_type: z.enum(["read", "write", "admin", "approve"]),
      is_granted: z.boolean(),
    }),
  ),
  special_permissions: z
    .object({
      can_invite_users: z.boolean().optional(),
      can_manage_permissions: z.boolean().optional(),
      can_export_data: z.boolean().optional(),
      can_access_reports: z.boolean().optional(),
    })
    .optional(),
});

export type UserPermissionsData = z.infer<typeof userPermissionsSchema>;
