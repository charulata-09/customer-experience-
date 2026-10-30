import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  MessageSquare,
  BarChart3,
  Sparkles,
  BookOpen,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, isStaff, isAdmin } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      roles: ['customer', 'agent', 'admin'],
    },
    {
      label: 'New Ticket',
      to: '/tickets/new',
      icon: PlusCircle,
      roles: ['customer'],
    },
    {
      label: 'Tickets Queue',
      to: '/tickets',
      icon: Ticket,
      roles: ['customer', 'agent', 'admin'],
    },
    {
      label: 'AI Chat Assistant',
      to: '/chat',
      icon: MessageSquare,
      roles: ['customer'],
    },
    {
      label: 'Analytics & KPIs',
      to: '/analytics',
      icon: BarChart3,
      roles: ['agent', 'admin'],
    },
    {
      label: 'AI Insight Reports',
      to: '/insights',
      icon: Sparkles,
      roles: ['admin'],
    },
    {
      label: 'Knowledge Base',
      to: '/knowledge-base',
      icon: BookOpen,
      roles: ['agent', 'admin'],
    },
    {
      label: 'Settings',
      to: '/settings',
      icon: Settings,
      roles: ['customer', 'agent', 'admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-white/5 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                CX Copilot
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Enterprise AI Experience
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-3 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Logged in role:</span>
          <Badge
            variant={isAdmin ? 'purple' : isStaff ? 'brand' : 'default'}
            size="sm"
            dot
          >
            {role.toUpperCase()}
          </Badge>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/5 bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>RLS Active · Model Gemini 2.5</span>
          </div>
        </div>
      </aside>
    </>
  );
};
