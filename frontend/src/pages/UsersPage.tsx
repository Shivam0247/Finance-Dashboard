import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import api from '../api/axios';
import {
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Search as SearchIcon,
  Edit2,
  Trash2
} from 'lucide-react';
import type { PublicUser, Role } from '../utils/types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as Role
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users${debouncedSearch ? `?search=${debouncedSearch}` : ''}`);
      setUsers(response.data);
    } catch (err: unknown) {
      let message = 'Failed to load users. Are you an admin?';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user: PublicUser | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role
      });
    } else {
      setFormData({ name: '', email: '', password: '', role: 'viewer' });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role
        };
        const response = await api.put(`/users/${editingUser.id}`, updateData);
        setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
      } else {
        const response = await api.post('/users', formData);
        setUsers([...users, response.data]);
      }
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'viewer' });
      setEditingUser(null);
    } catch (err: unknown) {
      alert('Failed to save user. Please check if the email already exists.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also remove all their transactions.')) return;
    setUpdatingId(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: unknown) {
      let message = 'Failed to delete user';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        message = err.response.data.message;
      }
      alert(message);
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-heading mb-2">User Management</h1>
          <p className="text-slate-400">Manage user permissions and account status</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search name or email..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-accent outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background-secondary border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-heading">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-accent outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    editingUser ? 'Save Changes' : 'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

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
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-slate-400 hover:text-accent transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
