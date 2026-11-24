import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(60, "Username must not exceed 60 characters")
    .regex(
      /^[a-zA-Z0-9._@-]+$/,
      "Username can only contain alphanumeric characters, underscores, dashes, dots, and @"
    ),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(250),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z
    .enum(["administrator", "manager", "partner", "sales-person", "engineer"])
    .default("engineer"),
  canShareProfile: z.boolean().optional().default(false),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).max(250).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z
    .enum(["administrator", "manager", "partner", "sales-person", "engineer"])
    .optional(),
  canShareProfile: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
