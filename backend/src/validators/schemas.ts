import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().optional(),
  }),
});

export const getTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    type: z.enum(['income', 'expense']).or(z.literal('')).optional().transform(val => val === '' ? undefined : val),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(['admin', 'analyst', 'viewer']),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['active', 'inactive']),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'analyst', 'viewer']),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'analyst', 'viewer']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});
