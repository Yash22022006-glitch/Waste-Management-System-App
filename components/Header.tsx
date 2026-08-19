import React from 'react';
import { Trash2, LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 glass-panel rounded-none border-x-0 border-t-2 border-b-0 border-blue-600 z-50 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
             <Trash2 size={14} className="text-white" />
          </div>
          <h1 className="text-sm font-black text-[var(--text-main)] tracking-widest uppercase mono">SmartWaste<span className="text-blue-600">OS</span></h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[10px] font-bold text-[var(--text-main)] mono">{user?.fullName || user?.username}</span>
          <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mono">{user?.role}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;