import * as z from "zod";

export const staffSchema = z.object({
  id: z.string().optional(),
  staff_name: z.string().min(3, "Staff name must be at least 3 characters"),
  role_id: z.string().min(1, "Roles must be selected"),
  is_active: z.boolean(),
  roles: z
    .object({
      role_name: z.string().nullable(),
    })
    .nullable(),
});

export type StaffSchema = z.infer<typeof staffSchema>;
