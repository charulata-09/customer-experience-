import React from 'react';
import { Menu, LogOut, User, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Topbar = ({ onToggleSidebar }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>AI Engine Online</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User profile capsule */}
        <div className="flex items-center gap-3 pl-3 pr-2 py-1 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="w-7 h-7 rounded-lg bg-brand-600/30 border border-brand-500/40 text-brand-300 flex items-center justify-center text-xs font-semibold">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.full_name || 'Active User'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[140px]">
              {user?.email || ''}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="sm"
          icon={LogOut}
          onClick={signOut}
          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
        >
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};
