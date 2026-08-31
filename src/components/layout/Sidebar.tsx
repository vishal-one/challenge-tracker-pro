import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusSquare,
  Users,
  ClipboardCheck,
  Target,
  Bell,
  User,
  Shield,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Challenges', path: '/admin/challenges', icon: PlusSquare },
    { name: 'Manage Cohorts', path: '/admin/cohorts', icon: Users },
    { name: 'Review Submissions', path: '/admin/reviews', icon: ClipboardCheck },
  ];

  const userLinks = [
    { name: 'My Challenges', path: '/my-challenges', icon: Target },
  ];

  const sharedLinks = [
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile Settings', path: '/profile', icon: User },
    { name: 'Account Security', path: '/account', icon: Shield },
  ];

  const renderLinks = (links: { name: string; path: string; icon: React.FC<{ className?: string }> }[]) =>
    links.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
              isActive
                ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
            }`
          }
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{item.name}</span>
        </NavLink>
      );
    });

  return (
    <aside className="w-64 bg-surface-low border-r border-neutral-border min-h-[calc(100vh-4rem)] p-4 flex flex-col shrink-0">
      <div className="space-y-6">
        {role === 'admin' && (
          <div>
            <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-muted mb-3 font-semibold">
              Admin
            </p>
            <nav className="space-y-1">
              {renderLinks(adminLinks)}
            </nav>
          </div>
        )}

        {role === 'user' && (
          <div>
            <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-muted mb-3 font-semibold">
              Challenges
            </p>
            <nav className="space-y-1">
              {renderLinks(userLinks)}
            </nav>
          </div>
        )}

        <div>
          <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-muted mb-3 font-semibold">
            Account
          </p>
          <nav className="space-y-1">
            {renderLinks(sharedLinks)}
          </nav>
        </div>
      </div>
    </aside>
  );
};

