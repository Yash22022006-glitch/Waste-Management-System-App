import React, { useState } from 'react';
import { UserRole } from '../types';

interface AuthFormProps {
  type: 'login' | 'signup';
  onSubmit: (username: string, password: string, role?: UserRole) => void;
  isLoading: boolean;
  error: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, isLoading, error }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>(UserRole.COMMUNITY_MEMBER); // Default role for signup

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'signup') {
      onSubmit(username, password, role);
    } else {
      onSubmit(username, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center space-x-3">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mono">
            {error}
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 mono">User ID</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-sm font-medium text-[var(--text-main)] placeholder-gray-400 mono animate-none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 mono">Access Key</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-sm font-medium text-[var(--text-main)] placeholder-gray-400 mono animate-none"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {type === 'signup' && (
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 mono">Clearance</label>
            <select
              className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-sm font-medium text-[var(--text-main)] appearance-none mono"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isLoading}
            >
              <option value={UserRole.COMMUNITY_MEMBER} className="bg-white text-[var(--text-main)]">Member</option>
              <option value={UserRole.COLLECTOR} className="bg-white text-[var(--text-main)]">Collector</option>
              <option value={UserRole.ADMIN} className="bg-white text-[var(--text-main)]">Admin</option>
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white rounded-lg font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] flex items-center justify-center space-x-2 mono"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span>{type === 'login' ? 'Authorize Access' : 'Initialize Profile'}</span>
        )}
      </button>
    </form>
  );
};

export default AuthForm;