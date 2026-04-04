import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Transaction, PaginatedResult } from '../utils/types';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedResult<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>('');
  const [category, setCategory] = useState('');
  const [debouncedCategory, setDebouncedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce category search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCategory(category);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(handler);
  }, [category]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (type) params.append('type', type);
      if (debouncedCategory) params.append('category', debouncedCategory);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/transactions?${params.toString()}`);
      setData(response.data);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, type, debouncedCategory, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to delete transaction');
    }
  };

  const handleOpenModal = (tx: Transaction | null = null) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const canWrite = user?.role === 'admin' || user?.role === 'analyst';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading mb-1">Transactions</h1>
          <p className="text-slate-400">Manage and filter your financial records</p>
        </div>
        {canWrite && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-medium shadow-lg shadow-accent/20"
          >
            <Plus size={20} />
            <span>Add Transaction</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-background-secondary p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Category</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search category..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Type</label>
          <select
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none min-w-[120px]"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Start Date</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase mb-2">End Date</label>
          <input
            type="date"
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            setCategory('');
            setType('');
            setStartDate('');
            setEndDate('');
            setPage(1);
          }}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <Filter size={16} />
          Reset
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-background-secondary rounded-2xl border border-slate-800 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        )}

        {error && (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <AlertCircle className="text-red-500" size={48} />
            <p className="text-slate-400">{error}</p>
          </div>
        )}

        {!error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Notes</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    {canWrite && <th className="px-6 py-4 font-medium text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data?.data.length === 0 ? (
                    <tr>
                      <td colSpan={canWrite ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                        No transactions found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    data?.data.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {tx.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                          {tx.notes || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-medium font-mono ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </td>
                        {canWrite && (
                          <td className="px-6 py-4 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenModal(tx)}
                                className="p-2 text-slate-400 hover:text-accent transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-slate-800 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="text-white">{(page - 1) * (data?.limit || 10) + 1}</span> to <span className="text-white">{Math.min(page * (data?.limit || 10), data?.total || 0)}</span> of <span className="text-white">{data?.total || 0}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={!data || page * data.limit >= data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && createPortal(
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTransactions();
          }}
        />,
        document.body
      )}
    </div>
  );
};

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [type, setType] = useState(transaction?.type || 'expense');
  const [category, setCategory] = useState(transaction?.category || '');
  const [date, setDate] = useState(transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      amount: parseFloat(amount),
      type,
      category,
      date,
      notes: notes || undefined
    };

    try {
      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to save transaction. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-background-secondary rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h3 className="text-xl font-heading">{transaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Type</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                value={type}
                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Category</label>
            <input
              type="text"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Food, Rent, Salary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Date</label>
            <input
              type="date"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Notes (Optional)</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent outline-none resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add some details..."
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent hover:bg-accent-hover text-white px-8 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {transaction ? 'Save Changes' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
