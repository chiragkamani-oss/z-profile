import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters").max(200),
  description: z.string().max(1000).optional().default(""),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry: z.string().max(100).optional().default(""),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
