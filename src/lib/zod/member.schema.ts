import { z } from "zod";

// Create Member Schema
export const createMemberSchema = z
  .object({
    name: z
      .string({ message: "Name is required" })
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),

    role: z
      .string({ message: "Role is required" })
      .min(1, "Role is required"),

    year: z.preprocess(
      (val) =>
        typeof val === "string" || typeof val === "number"
          ? new Date(val)
          : val,
      z.date({ message: "Year must be a valid date" })
    ),

    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .strict(); // disallow unknown keys like "names"

// Update Member Schema (Partial)
export const updateMemberSchema = createMemberSchema.partial().strict();

// Member Params Schema
export const memberParamsSchema = z
  .object({
    id: z.string().uuid("Invalid member ID format"),
  })
  .strict();

// Get Members Query Schema
export const getMembersQuerySchema = z
  .object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a positive number")
      .transform(Number)
      .refine((val) => val > 0, "Page must be greater than 0")
      .optional()
      .default(1),

    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a positive number")
      .transform(Number)
      .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
      .optional()
      .default(10),
  })
  .strict();

// TypeScript Types
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type MemberParamsInput = z.infer<typeof memberParamsSchema>;
export type GetMembersQueryInput = z.infer<typeof getMembersQuerySchema>;
