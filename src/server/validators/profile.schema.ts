import { z } from "zod";

export const ProfileStatusEnum = z.enum([
  "in_draft",
  "in_review",
  "review_changes",
  "is_ready",
  "rejected",
]);

export const createProfileSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  designation: z.string().min(2, "Designation is required").max(100),
  experienceYears: z.number().min(0).max(50),
  bio: z.string().max(2000).optional().default(""),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  certifications: z.array(z.string()).optional().default([]),
  aliasName: z.string().max(100).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const updateStatusSchema = z.object({
  status: ProfileStatusEnum,
  feedback: z.string().max(1000).optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
