import { z } from "zod";
import { staffRoles, type StaffRole } from "@/lib/access";

export const accountRoles = [
  "customer",
  "businessowner",
  "story_manager",
  "operations_manager",
  "admin",
] as const;
export const accountStatuses = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "DELETED",
  "BLOCKED",
] as const;

export const userFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phoneNumber: z.string().trim(),
  role: z.enum(staffRoles, {
    errorMap: () => ({ message: "Select a staff role" }),
  }),
  status: z.enum(accountStatuses),
  password: z.string(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const accountSchema = z.object({
  _id: z.string(),
  fullName: z.string(),
  email: z.string(),
  phoneNumber: z.string().optional(),
  role: z.enum(accountRoles),
  status: z.enum(accountStatuses),
  verified: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type Account = z.infer<typeof accountSchema>;
export type StaffAccount = Account & { role: StaffRole };

export function validStaffPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(value)
  );
}
