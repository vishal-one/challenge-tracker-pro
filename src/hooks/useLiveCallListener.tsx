import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Video, X, PhoneCall } from 'lucide-react';

interface LiveCallPayload {
  message: string;
  action_url: string;
}

export const LiveCallToast: React.FC = () => {
  const { user } = useAuth();
  const [callPayload, setCallPayload] = useState<LiveCallPayload | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to INSERT events on the notifications table filtered to this user
    const channelName = `live-call-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const record = payload.new as {
            type: string;
            message: string;
            action_url?: string;
          };

          if (record.type === 'video_call' && record.action_url) {
            setCallPayload({
              message: record.message,
              action_url: record.action_url,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!callPayload) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-[9999] w-80 animate-slide-up"
    >
      <div className="relative bg-surface border border-violet/40 rounded-xl shadow-2xl shadow-violet/20 overflow-hidden">
        {/* Animated violet accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-violet via-lavender to-violet animate-pulse" />

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-violet/20 border border-violet/40 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-violet animate-pulse" />
              </div>
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-violet">
                  Live Session Started
                </p>
                <p className="font-mono text-[10px] text-neutral-muted mt-0.5">
                  Your mentor is live now
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setCallPayload(null)}
              aria-label="Dismiss notification"
              className="p-1 rounded text-neutral-muted hover:text-neutral-txt hover:bg-surface-high transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <p className="font-mono text-xs text-neutral-txt leading-relaxed">
            {callPayload.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                window.open(callPayload.action_url, '_blank', 'noopener,noreferrer');
                setCallPayload(null);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-violet-dim shadow-violet-glow transition-all active:scale-[0.98]"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Join Call
            </button>
            <button
              onClick={() => setCallPayload(null)}
              className="px-3 py-2 rounded-lg bg-surface-high border border-neutral-border text-neutral-muted font-mono text-xs uppercase tracking-wider hover:text-neutral-txt hover:border-neutral-border/80 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
