import Transaction from '../models/Transaction';
import { Transaction as ITransactionType, PaginatedResult } from '../utils/types';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

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
  private static toTransactionType(tx: any): ITransactionType {
    return {
      id: tx._id.toString(),
      user_id: tx.user_id.toString(),
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date.toISOString().split('T')[0],
      notes: tx.notes,
      created_at: tx.created_at.toISOString(),
      updated_at: tx.updated_at.toISOString(),
      deleted_at: tx.deleted_at ? tx.deleted_at.toISOString() : undefined
    };
  }

  static async create(userId: string, data: CreateTransactionDto): Promise<ITransactionType> {
    const tx = await Transaction.create({
      user_id: new mongoose.Types.ObjectId(userId),
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      notes: data.notes
    });
    return this.toTransactionType(tx);
  }

  static async findAll(filters: TransactionFilters): Promise<PaginatedResult<ITransactionType>> {
    const { startDate, endDate, type, category, page = 1, limit = 10 } = filters;

    const query: any = { deleted_at: null };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          throw new AppError('Invalid start date format', 400);
        }
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          throw new AppError('Invalid end date format', 400);
        }
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      // Escape special characters for regex
      const escapedCategory = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.category = { $regex: escapedCategory, $options: 'i' };
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const total = await Transaction.countDocuments(query);
    console.log('Total documents matching query:', total);
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1, created_at: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    console.log('Transactions found:', transactions.length);

    return {
      data: transactions.map(tx => this.toTransactionType(tx)),
      total,
      page,
      limit,
    };
  }

  static async update(id: string, data: UpdateTransactionDto): Promise<ITransactionType> {
    const updateData: any = { ...data, updated_at: new Date() };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const tx = await Transaction.findOneAndUpdate(
      { _id: id, deleted_at: null },
      updateData,
      { new: true }
    );

    if (!tx) {
      throw new AppError('Transaction not found', 404);
    }

    return this.toTransactionType(tx);
  }

  static async softDelete(id: string): Promise<void> {
    const result = await Transaction.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { deleted_at: new Date() }
    );

    if (!result) {
      throw new AppError('Transaction not found', 404);
    }
  }
}
