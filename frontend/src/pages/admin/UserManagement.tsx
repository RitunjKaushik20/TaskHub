import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { adminApi } from '../../api/admin';
import type { UserManagementItem } from '../../types';
import { useToast } from '../../context/ToastContext';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const res = await adminApi.getUsers();
        if (res.success && res.data) {
          setUsers(res.data);
        }
      } catch (err) {
        console.warn('Failed to load admin users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await adminApi.updateUserStatus(userId, nextStatus as any);

    if (res.success && res.data) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: nextStatus as any } : u)));
      toast.info('User Status Updated', `User ${userId} status set to ${nextStatus}.`);
    }
  };

  const filteredUsers = users.filter((u) => roleFilter === 'ALL' || u.role === roleFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">User Management & Moderation</h1>
        <p className="text-xs text-slate-400">Filter platform users by role, inspect KYC state, and freeze/suspend accounts.</p>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Filter by Account Role:</span>
        <div className="flex gap-2">
          {['ALL', 'WORKER', 'BUSINESS', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === role
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl glass-panel border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">KYC Status</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No users found in this role category.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-slate-500 text-[10px]">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        u.kycStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" /> {u.kycStatus}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{u.joinedDate}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.status)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        u.status === 'ACTIVE'
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
