import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { PublicUser, Role } from '../utils/types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: unknown) {
      setError('Failed to load users. Are you an admin?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, role: Role) => {
    setUpdatingId(userId);
    try {
      await api.put(`/users/${userId}/role`, { role });
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err: unknown) {
      alert('Failed to update role');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'inactive') => {
    setUpdatingId(userId);
    try {
      await api.put(`/users/${userId}/status`, { status });
      setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
    } catch (err: unknown) {
      alert('Failed to update status');
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-accent" size={48} />
        <p className="text-slate-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading mb-2">User Management</h1>
        <p className="text-slate-400">Manage user permissions and account status</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-2xl flex items-center gap-4">
          <AlertCircle size={32} />
          <div>
            <h3 className="font-bold">Access Denied</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!error && (
        <div className="bg-background-secondary rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <select
                          disabled={updatingId === u.id}
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value as Role)}
                          className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        disabled={updatingId === u.id}
                        onClick={() => handleUpdateStatus(u.id, u.status === 'active' ? 'inactive' : 'active')}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                          }`}
                      >
                        {u.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {u.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {updatingId && (
        <div className="fixed bottom-8 right-8 bg-accent text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <Loader2 className="animate-spin" size={20} />
          <span className="font-medium text-sm">Updating user...</span>
        </div>
      )}
    </div>
  );
};
