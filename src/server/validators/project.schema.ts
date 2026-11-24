import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(200),
  alias_name: z.string().max(200).optional().default(""),
  clientId: z.string().or(z.number()).optional(),
  type: z.string().max(100).optional().default("Web Application"),
  category: z.string().max(100).optional().default("Cloud Native"),
  cloud: z.string().max(100).optional().default("AWS"),
  solution: z.string().max(3000).optional().default(""),
  architecture: z.string().max(3000).optional().default(""),
  responsibilities: z.array(z.string()).or(z.string()).optional().default([]),
  contributions: z.array(z.string()).or(z.string()).optional().default([]),
  toolprocesses: z.string().max(1000).optional().default(""),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
