import pool from '../database/pool';
import { Transaction, PaginatedResult } from '../utils/types';
import { AppError } from '../utils/AppError';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  category?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionDto {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
}

export interface UpdateTransactionDto {
  amount?: number;
  type?: 'income' | 'expense';
  category?: string;
  date?: string;
  notes?: string;
}

export class TransactionService {
  static async create(userId: string, data: CreateTransactionDto): Promise<Transaction> {
    const result = await pool.query<Transaction>(
      `INSERT INTO transactions (user_id, amount, type, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, data.amount, data.type, data.category, data.date, data.notes]
    );
    return result.rows[0]!;
  }

  static async findAll(filters: TransactionFilters): Promise<PaginatedResult<Transaction>> {
    const { startDate, endDate, type, category, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM transactions WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND date <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    if (category) {
      query += ` AND category ILIKE $${paramIndex++}`;
      params.push(category);
    }

    // Get total count for pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Get paginated data
    query += ` ORDER BY date DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query<Transaction>(query, params);

    return {
      data: result.rows,
      total,
      page,
      limit,
    };
  }

  static async update(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const fields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

    if (data.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      params.push(data.amount);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      params.push(data.type);
    }
    if (data.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    if (data.date !== undefined) {
      fields.push(`date = $${paramIndex++}`);
      params.push(data.date);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      params.push(data.notes);
    }

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE transactions
      SET ${fields.join(', ')}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query<Transaction>(query, params);

    if (result.rowCount === 0) {
      throw new AppError('Transaction not found', 404);
    }

    return result.rows[0]!;
  }

  static async softDelete(id: string): Promise<void> {
    const result = await pool.query(
      'UPDATE transactions SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rowCount === 0) {
      throw new AppError('Transaction not found', 404);
    }
  }
}
