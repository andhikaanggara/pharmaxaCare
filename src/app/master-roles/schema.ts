import * as z from "zod";

export const roleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Role name must be at least 3 characters").trim(),
  is_active: z.boolean(),
});

export type RoleSchema = z.infer<typeof roleSchema>;
