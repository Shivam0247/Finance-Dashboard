export type Role = 'admin' | 'analyst' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // never returned in API responses
  role: Role;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<User, 'password'>;

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO date string
  notes?: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Express Request extension
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
