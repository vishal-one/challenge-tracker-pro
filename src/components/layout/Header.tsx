import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Avatar } from '../ui/Avatar';
import {
  Bell,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  PlusSquare,
  Users,
  ClipboardCheck,
  Target,
  User as UserIcon,
  Shield,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-background/90 backdrop-blur-md border-b border-neutral-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand / Logo */}
          <Link to={user ? (role === 'admin' ? '/admin/dashboard' : '/my-challenges') : '/login'} className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-violet flex items-center justify-center text-black font-mono font-bold text-base sm:text-lg shadow-violet-glow group-hover:scale-105 transition-transform">
              CT
            </div>
            <div>
              <div className="font-mono font-bold text-sm sm:text-base tracking-wider text-neutral-txt flex items-center gap-2">
                <span>CHALLENGE TRACKER</span> <span className="text-violet text-xs font-mono px-1.5 py-0.5 bg-violet/10 border border-violet/30 rounded">PRO</span>
              </div>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {/* Notifications Link */}
              <Link className="relative p-2 rounded-lg text-neutral-muted hover:text-neutral-txt hover:bg-surface-high transition-colors" title="Notifications" to="/notifications">
                <Bell className="w-5 h-5"/>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-violet text-black font-mono text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Profile Pill (Desktop) */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-neutral-border">
                <Link className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" to="/profile">
                  <Avatar
                    src={user.avatar_url}
                    name={user.display_name}
                    className="w-8 h-8 rounded border border-neutral-border"
                  />
                  <div className="text-left">
                    <p className="font-mono text-xs font-semibold text-neutral-txt truncate max-w-[120px]">
                      {user.display_name}
                    </p>
                    <p className="font-mono text-[10px] text-violet capitalize">{user.role}</p>
                  </div>
                </Link>

                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                  className="p-1.5 text-neutral-muted hover:text-red-400 hover:bg-surface-high rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4"/>
                </button>
              </div>

              {/* Mobile Hamburger Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-lg text-neutral-muted hover:text-neutral-txt hover:bg-surface-high transition-colors"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-violet" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <Link className="font-mono text-xs uppercase bg-violet text-black font-semibold px-4 py-2 rounded hover:bg-violet-dim shadow-violet-glow transition-all" to="/login">
              Sign In
            </Link>
          )}
        </div>

      </div>
    </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-background/95 backdrop-blur-md border-b border-neutral-border flex flex-col overflow-y-auto">
          <div className="p-4 space-y-6 flex-1">
            {/* Mobile User Profile Card */}
            <div className="p-3 bg-surface-low rounded border border-neutral-border flex items-center justify-between">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar
                  src={user.avatar_url}
                  name={user.display_name}
                  className="w-10 h-10 rounded border border-neutral-border"
                />
                <div>
                  <p className="font-mono text-xs font-semibold text-neutral-txt">{user.display_name}</p>
                  <p className="font-mono text-[10px] text-violet uppercase">{user.role}</p>
                </div>
              </Link>
              <button
                onClick={async () => {
                  setIsMobileMenuOpen(false);
                  await signOut();
                  navigate('/login');
                }}
                className="p-2 text-neutral-muted hover:text-red-400 hover:bg-surface-high rounded transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Section */}
            {role === 'admin' && (
              <div>
                <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-muted mb-2 font-semibold">
                  Admin
                </p>
                <nav className="space-y-1">
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                          : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                      }`
                    }
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Admin Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/admin/challenges"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                          : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                      }`
                    }
                  >
                    <PlusSquare className="w-4 h-4 shrink-0" />
                    <span>Manage Challenges</span>
                  </NavLink>
                  <NavLink
                    to="/admin/cohorts"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                          : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                      }`
                    }
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Manage Cohorts</span>
                  </NavLink>
                  <NavLink
                    to="/admin/reviews"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                          : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                      }`
                    }
                  >
                    <ClipboardCheck className="w-4 h-4 shrink-0" />
                    <span>Review Submissions</span>
                  </NavLink>
                </nav>
              </div>
            )}

            {/* User Section */}
            {role === 'user' && (
              <div>
                <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-muted mb-2 font-semibold">
                  Challenges
                </p>
                <nav className="space-y-1">
                  <NavLink
                    to="/my-challenges"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                          : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                      }`
                    }
                  >
                    <Target className="w-4 h-4 shrink-0" />
                    <span>My Challenges</span>
                  </NavLink>
                </nav>
              </div>
            )}

            {/* Shared Account Section */}
            <div>
              <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-neutral-muted mb-2 font-semibold">
                Account
              </p>
              <nav className="space-y-1">
                <NavLink
                  to="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                        : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 bg-violet text-black font-mono text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                        : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                    }`
                  }
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>Profile Settings</span>
                </NavLink>
                <NavLink
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-violet/10 text-violet border border-violet/30 font-semibold shadow-violet-glow/10'
                        : 'text-neutral-muted hover:text-neutral-txt hover:bg-surface-high/50'
                    }`
                  }
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Account Security</span>
                </NavLink>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
