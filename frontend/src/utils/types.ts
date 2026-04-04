export type Role = 'admin' | 'analyst' | 'viewer';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
