import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, CheckCheck, Check, Clock, Inbox, Loader2 } from 'lucide-react';

export const Notifications: React.FC = () => {
  // 1. Safe Hook Destructuring
  const {
    notifications = [],
    isLoading = false,
    unreadCount = 0,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 2. Early Loading State (Guard before rendering layout/feed)
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-neutral-border pb-6">
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
            NOTIFICATION <span className="text-violet">ALERTS</span>
          </h1>
          <p className="text-xs font-mono text-neutral-muted mt-1">
            Realtime updates on assignment dispatches, challenge updates, and cohort metrics
          </p>
        </div>

        <Card className="p-12 flex flex-col items-center justify-center gap-3 text-neutral-muted font-mono text-xs">
          <Loader2 className="w-8 h-8 text-violet animate-spin" />
          <span>Loading notification feed...</span>
        </Card>
      </div>
    );
  }

  // 3. Safe Filtering with array fallback
  const safeNotifications = notifications || [];
  const filteredNotifs = safeNotifications.filter((n) => (filter === 'unread' ? !n?.is_read : true));
  const safeUnreadCount = typeof unreadCount === 'number' ? unreadCount : safeNotifications.filter((n) => !n?.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
            NOTIFICATION <span className="text-violet">ALERTS</span>
          </h1>
          <p className="text-xs font-mono text-neutral-muted mt-1">
            Realtime updates on assignment dispatches, challenge updates, and cohort metrics
          </p>
        </div>

        {safeUnreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead?.mutate?.()}
            isLoading={markAllAsRead?.isPending}
            leftIcon={<CheckCheck className="w-4 h-4 text-violet" />}
          >
            Mark All As Read ({safeUnreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-border pb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-muted">
            <Bell className="w-4 h-4 text-violet" />
            <span>Feed Filters</span>
          </div>

          <div className="flex items-center bg-surface-lowest border border-neutral-border rounded p-0.5 font-mono text-xs">
            <button
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`px-3 py-1 rounded uppercase tracking-wider transition-colors ${
                filter === 'all' ? 'bg-violet text-black font-semibold' : 'text-neutral-muted hover:text-neutral-txt'
              }`}
            >
              All Alerts ({safeNotifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              aria-pressed={filter === 'unread'}
              className={`px-3 py-1 rounded uppercase tracking-wider transition-colors ${
                filter === 'unread' ? 'bg-violet text-black font-semibold' : 'text-neutral-muted hover:text-neutral-txt'
              }`}
            >
              Unread Only ({safeUnreadCount})
            </button>
          </div>
        </div>

        {/* 4. Empty State */}
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-neutral-muted space-y-2">
            <Inbox className="w-8 h-8 text-neutral-muted/40 mx-auto" />
            <p>
              {filter === 'unread'
                ? 'No unread notifications in your feed.'
                : 'No notifications in your feed right now.'}
            </p>
          </div>
        ) : (
          /* 5. Safe Mapping */
          <div className="space-y-3">
            {filteredNotifs.map((n) => {
              if (!n || !n.id) return null;
              const isUnread = !n.is_read;

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded border font-mono transition-all flex items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-violet/5 border-violet/30 text-neutral-txt'
                      : 'bg-surface-lowest border-neutral-border/60 text-neutral-muted'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-2 rounded shrink-0 ${
                        isUnread ? 'bg-violet text-black' : 'bg-surface-high text-neutral-muted'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs ${isUnread ? 'font-semibold text-neutral-txt' : 'text-neutral-muted'}`}>
                        {n.message}
                      </p>
                      {n.created_at && (
                        <p className="text-[10px] text-neutral-muted/70 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {isUnread && markAsRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead.mutate?.(n.id)}
                      isLoading={Boolean(markAsRead.isPending && markAsRead.variables === n.id)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Read
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
