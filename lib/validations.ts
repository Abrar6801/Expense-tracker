import { z } from 'zod'
import { AccountType, TransactionType } from '@prisma/client'

// ─── Account ──────────────────────────────────────────────────────────────────

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

// ─── Transaction ──────────────────────────────────────────────────────────────

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

// ─── Budget limit ─────────────────────────────────────────────────────────────

export const createBudgetLimitSchema = z.object({
  category: z.string().min(1, 'Category is required').max(50),
  amount: z.number().positive('Amount must be positive').max(9_999_999),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
})

// ─── Recurring template ───────────────────────────────────────────────────────

export const createRecurringSchema = z.object({
  accountId: z.string().cuid('Invalid account'),
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive('Amount must be positive').max(9_999_999),
  category: z.string().min(1).max(50),
  description: z.string().max(255).optional().nullable(),
  interval: z.enum(['weekly', 'biweekly', 'monthly', 'yearly']),
  nextDue: z.coerce.date(),
})

// ─── Savings goal ─────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  targetAmount: z.number().positive('Target must be positive').max(9_999_999),
  accountId: z.string().cuid().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
})

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().cuid(),
})

// ─── Cash envelope ────────────────────────────────────────────────────────────

export const createEnvelopeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  totalAmount: z.number().positive('Amount must be positive').max(9_999_999),
  accountId: z.string().cuid('Invalid account'),
})

export const createEnvelopeTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(9_999_999),
  description: z.string().max(255).optional().nullable(),
  category: z.string().min(1).max(50),
  date: z.coerce.date(),
})

// ─── Split ────────────────────────────────────────────────────────────────────

export const createSplitMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be positive').max(9_999_999),
})

export const createSplitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  totalAmount: z.number().positive('Amount must be positive').max(9_999_999),
  groupId: z.string().cuid().optional().nullable(),
  date: z.coerce.date(),
  members: z.array(createSplitMemberSchema).min(1, 'At least one member required').max(20),
})

export const markReceivedSchema = z.object({
  accountId: z.string().cuid('Invalid account'),
})

// ─── Split Group ──────────────────────────────────────────────────────────────

export const createSplitGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  members: z.array(z.string().min(1).max(100)).min(1, 'At least one member').max(30),
})

export const addGroupMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
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

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateBudgetLimitInput = z.infer<typeof createBudgetLimitSchema>
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type CreateEnvelopeInput = z.infer<typeof createEnvelopeSchema>
export type CreateEnvelopeTransactionInput = z.infer<typeof createEnvelopeTransactionSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateSplitInput = z.infer<typeof createSplitSchema>
export type CreateSplitMemberInput = z.infer<typeof createSplitMemberSchema>
export type MarkReceivedInput = z.infer<typeof markReceivedSchema>
export type CreateSplitGroupInput = z.infer<typeof createSplitGroupSchema>
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>
