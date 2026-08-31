import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-neutral-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to={user ? (role === 'admin' ? '/admin/dashboard' : '/my-challenges') : '/login'} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded bg-violet flex items-center justify-center text-black font-mono font-bold text-lg shadow-violet-glow group-hover:scale-105 transition-transform">
            CT
          </div>
          <div>
            <div className="font-mono font-bold text-base tracking-wider text-neutral-txt flex items-center gap-2">
              CHALLENGE TRACKER <span className="text-violet text-xs font-mono px-1.5 py-0.5 bg-violet/10 border border-violet/30 rounded">PRO</span>
            </div>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
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

              {/* User Profile Pill */}
              <div className="flex items-center gap-3 pl-3 border-l border-neutral-border">
                <Link className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" to="/profile">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                    alt={user.display_name}
                    className="w-8 h-8 rounded border border-neutral-border object-cover bg-surface-lowest"
                  />
                  <div className="hidden sm:block text-left">
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
            </>
          ) : (
            <Link className="font-mono text-xs uppercase bg-violet text-black font-semibold px-4 py-2 rounded hover:bg-violet-dim shadow-violet-glow transition-all" to="/login">
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};
