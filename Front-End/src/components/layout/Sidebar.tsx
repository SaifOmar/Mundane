import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { signOut, useSession } from '@/lib/auth-client';
import { useNotificationContext } from '@/lib/notification-context';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  CalendarCheck,
  ListTodo,
  BarChart3,
  Settings,
  Layers,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: CalendarCheck, label: 'Today' },
  { to: '/manage', icon: Layers, label: 'Recurring' },
  { to: '/tasks', icon: ListTodo, label: 'OneOffs' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotificationContext();
  const { data: session } = useSession();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border-default">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
          Mu
        </div>
        {!collapsed && (
          <span className="text-text-primary font-semibold text-sm tracking-wide">
            Mundane
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="flex-1">{label}</span>}
            {!collapsed && to === '/reminders' && unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* User footer */}
      <div className="border-t border-border-default p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 text-xs font-semibold flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-text-muted truncate">
                {session?.user?.email}
              </p>
            </div>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-bg-raised transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-bg-surface border border-border-default text-text-secondary"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-bg-surface border-r border-border-default transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-text-muted"
        >
          <X size={18} />
        </button>
        {nav}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-bg-surface border-r border-border-default transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-7 z-10 w-6 h-6 rounded-full bg-bg-raised border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-xs"
        >
          {collapsed ? '→' : '←'}
        </button>
        <div className="relative h-full">
          {nav}
        </div>
      </aside>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        confirmDanger
        onConfirm={() => { signOut(); setShowLogoutConfirm(false); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
