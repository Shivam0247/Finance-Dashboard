import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Receipt, Loader2, AlertCircle } from 'lucide-react';
import type { Transaction } from '../utils/types';

interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

interface CategoryTotal {
  category: string;
  total: number;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<CategoryTotal[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, categoriesRes, trendsRes, recentRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/categories'),
          api.get('/dashboard/trends'),
          api.get('/dashboard/recent'),
        ]);

        setSummary(summaryRes.data);
        setCategories(categoriesRes.data);
        setTrends(trendsRes.data);
        setRecent(recentRes.data);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-accent" size={48} />
        <p className="text-slate-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-heading text-white">Oops! Something went wrong</h2>
        <p className="text-slate-400 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={summary?.totalIncome || 0}
          icon={TrendingUp}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <StatCard
          title="Total Expenses"
          value={summary?.totalExpenses || 0}
          icon={TrendingDown}
          color="text-red-500"
          bg="bg-red-500/10"
        />
        <StatCard
          title="Net Balance"
          value={summary?.netBalance || 0}
          icon={Wallet}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          title="Transactions"
          value={summary?.transactionCount || 0}
          icon={Receipt}
          color="text-amber-500"
          bg="bg-amber-500/10"
          isCurrency={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-background-secondary p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-heading mb-6">Income & Expense Trends</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: 'var(--font-mono)' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                  tick={{ fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-background-secondary p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-heading mb-6">Category Breakdown</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="category"
                >
                  {categories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={(val: unknown) => {
                    const value = Array.isArray(val) ? val[0] : val;
                    if (typeof value === 'number' || typeof value === 'string') {
                      return `₹${Number(value).toFixed(2)}`;
                    }
                    return '';
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2">
            {categories.map((cat, index) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-400">{cat.category}</span>
                </div>
                <span className="text-white font-medium font-mono">₹{cat.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background-secondary rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-heading">Recent Transactions</h2>
          <button className="text-accent text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recent.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {tx.category}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  isCurrency?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, bg, isCurrency = true }) => {
  return (
    <div className="bg-background-secondary p-6 rounded-2xl border border-slate-800 flex items-center gap-6">
      <div className={`${bg} ${color} p-4 rounded-xl`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-500 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold font-mono text-white">
          {isCurrency ? `₹${value.toLocaleString()}` : value.toLocaleString()}
        </p>
      </div>
    </div>
  );
};
