import { z } from 'zod'
import { AccountType, TransactionType } from '@prisma/client'

// ─── Account ─────────────────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  type: z.nativeEnum(AccountType),
  balance: z
    .number({ invalid_type_error: 'Balance must be a number' })
    .min(-9_999_999, 'Balance too low')
    .max(9_999_999, 'Balance too high'),
  currency: z.string().length(3, 'Invalid currency code').default('USD'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').optional().nullable(),
  lastFour: z
    .string()
    .regex(/^\d{4}$/, 'Must be exactly 4 digits')
    .optional()
    .nullable()
    .or(z.literal('')),
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().cuid(),
})

// ─── Transaction ─────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  accountId: z.string().cuid('Invalid account'),
  type: z.nativeEnum(TransactionType),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(9_999_999, 'Amount too large'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  description: z.string().max(255, 'Description too long').optional().nullable(),
  date: z.coerce.date(),
})

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().cuid(),
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
