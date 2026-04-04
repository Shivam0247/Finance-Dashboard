import pool from '../database/pool';
import { Transaction } from '../utils/types';

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface MonthlyTrend {
  month: string; // 'YYYY-MM'
  income: number;
  expenses: number;
}

export class DashboardService {
  static async getSummary(): Promise<DashboardSummary> {
    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
        COUNT(*) as count
      FROM transactions 
      WHERE deleted_at IS NULL
    `;
    const result = await pool.query(query);
    const { income, expense, count } = result.rows[0];

    return {
      totalIncome: parseFloat(income),
      totalExpenses: parseFloat(expense),
      netBalance: parseFloat(income) - parseFloat(expense),
      transactionCount: parseInt(count, 10),
    };
  }

  static async getCategories(): Promise<CategoryTotal[]> {
    const query = `
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE deleted_at IS NULL
      GROUP BY category
      ORDER BY total DESC
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      category: row.category,
      total: parseFloat(row.total),
    }));
  }

  static async getTrends(): Promise<MonthlyTrend[]> {
    const query = `
      WITH months AS (
        SELECT TO_CHAR(CURRENT_DATE - INTERVAL '1 month' * s.i, 'YYYY-MM') as month
        FROM generate_series(0, 5) AS s(i)
      )
      SELECT 
        m.month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expenses
      FROM months m
      LEFT JOIN transactions t ON TO_CHAR(t.date, 'YYYY-MM') = m.month AND t.deleted_at IS NULL
      GROUP BY m.month
      ORDER BY m.month ASC
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      month: row.month,
      income: parseFloat(row.income),
      expenses: parseFloat(row.expenses),
    }));
  }

  static async getRecent(): Promise<Transaction[]> {
    const query = `
      SELECT * FROM transactions
      WHERE deleted_at IS NULL
      ORDER BY date DESC, created_at DESC
      LIMIT 10
    `;
    const result = await pool.query<Transaction>(query);
    return result.rows;
  }
}
