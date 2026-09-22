import { z } from "zod";

// Create Invoice Schema
export const createInvoiceSchema = z.object({
  shopId: z.string().optional(),
  email: z.string().email("Invalid email address"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(1, "Minimum amount is $1"),
  note: z.string().optional(),
});

// Filter Invoice Schema
export const filterInvoiceSchema = z.object({
  shopId: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(["pending", "paid", "cancelled"]).optional(),
});

// Types
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type FilterInvoiceInput = z.infer<typeof filterInvoiceSchema>;
