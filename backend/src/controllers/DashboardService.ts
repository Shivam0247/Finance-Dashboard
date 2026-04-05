import Transaction from '../models/Transaction';
import { Transaction as ITransactionType } from '../utils/types';

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
  month: string;
  income: number;
  expenses: number;
}

export class DashboardService {
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

  static async getSummary(): Promise<DashboardSummary> {
    const result = await Transaction.aggregate([
      { $match: { deleted_at: null } },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          count: { $sum: 1 }
        }
      }
    ]);

    const { income = 0, expense = 0, count = 0 } = result[0] || {};

    return {
      totalIncome: income,
      totalExpenses: expense,
      netBalance: income - expense,
      transactionCount: count,
    };
  }

  static async getCategories(): Promise<CategoryTotal[]> {
    const result = await Transaction.aggregate([
      { $match: { deleted_at: null } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    return result.map((row) => ({
      category: row._id,
      total: row.total,
    }));
  }

  static async getTrends(): Promise<MonthlyTrend[]> {
    const sixMonthsAgo = new Date();
    // Start of the month six months ago
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const result = await Transaction.aggregate([
      {
        $match: {
          deleted_at: null,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing months if necessary
    const trends: MonthlyTrend[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthStr = date.toISOString().split('T')[0].substring(0, 7);

      const found = result.find(r => r._id === monthStr);
      trends.push({
        month: monthStr,
        income: found ? found.income : 0,
        expenses: found ? found.expense : 0
      });
    }

    return trends;
  }

  static async getRecent(): Promise<ITransactionType[]> {
    const transactions = await Transaction.find({ deleted_at: null })
      .sort({ date: -1, created_at: -1 })
      .limit(10);

    return transactions.map(tx => this.toTransactionType(tx));
  }
}
