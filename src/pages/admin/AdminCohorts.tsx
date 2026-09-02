import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminCohorts } from '../../hooks/useAssignments';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Assignment, Profile } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge, DifficultyBadge } from '../../components/ui/Badge';
import * as Avatar from '@radix-ui/react-avatar';
import { getInitials } from '../../components/ui/Avatar';
import {
  Users,
  Building2,
  Github,
  Linkedin,
  ExternalLink,
  FileText,
  Search,
  ChevronRight,
  Eye,
  EyeOff,
  Code2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

// Inner component so the hook call respects Rules of Hooks
const UserAssignmentsTable: React.FC<{ userId: string }> = ({ userId }) => {
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['admin-user-assignments', userId],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, challenge:challenges(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: Boolean(userId),
  });

  if (isLoading) {
    return (
      <p className="text-xs font-mono text-neutral-muted py-4 text-center">
        Loading assignments…
      </p>
    );
  }

  if (assignments.length === 0) {
    return (
      <p className="text-xs font-mono text-neutral-muted py-4 text-center">
        No challenges assigned yet.
      </p>
    );
  }

  const toggleExpand = (assignmentId: string) => {
    setExpandedAssignmentId((prev) => (prev === assignmentId ? null : assignmentId));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-neutral-border/60 text-[10px] font-mono uppercase tracking-wider text-neutral-muted">
            <th className="pb-2 pr-3">Challenge</th>
            <th className="pb-2 pr-3">Difficulty</th>
            <th className="pb-2 pr-3">Status</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border/20 font-mono text-xs">
          {assignments.map((a) => {
            const isComplete = a.progress_status === 'complete';
            const isExpanded = expandedAssignmentId === a.id;
            const isCoding = Boolean(a.challenge?.is_coding_challenge);

            return (
              <React.Fragment key={a.id}>
                <tr className="hover:bg-surface-high/20 transition-colors">
                  <td className="py-2 pr-3 font-medium text-neutral-txt">
                    {a.challenge?.title ?? '—'}
                  </td>
                  <td className="py-2 pr-3">
                    {a.challenge ? (
                      <DifficultyBadge level={a.challenge.difficulty_level} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={a.progress_status} />
                  </td>
                  <td className="py-2 text-right">
                    {isComplete ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(a.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
                          isExpanded
                            ? 'bg-violet/20 border-violet/50 text-violet'
                            : 'bg-surface-high/60 hover:bg-surface-highest border-neutral-border text-neutral-txt hover:border-violet/40 hover:text-violet'
                        }`}
                        title={isExpanded ? 'Hide Submission' : 'View Submission'}
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-neutral-muted text-[11px]">—</span>
                    )}
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-surface-lowest/70">
                    <td colSpan={4} className="p-3 border-b border-neutral-border/40">
                      <div className="rounded-md bg-[#0F0D14] border border-neutral-border/60 p-3.5 space-y-2.5 shadow-inner">
                        <div className="flex items-center justify-between border-b border-neutral-border/40 pb-2">
                          <div className="flex items-center gap-2">
                            {isCoding ? (
                              <Code2 className="w-3.5 h-3.5 text-violet" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-violet" />
                            )}
                            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-muted font-semibold">
                              {isCoding ? 'Submitted Code Solution' : 'Student Submission Proof'}
                            </span>
                          </div>
                          {a.completed_at && (
                            <span className="text-[10px] font-mono text-neutral-muted">
                              Completed: {new Date(a.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {isCoding ? (
                          <div className="space-y-1.5">
                            {a.submitted_code ? (
                              <pre className="p-3 rounded bg-[#141219] border border-neutral-border/40 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto overflow-y-auto max-h-60 select-text">
                                <code>{a.submitted_code}</code>
                              </pre>
                            ) : (
                              <p className="text-xs font-mono text-neutral-muted italic py-2">
                                No code submitted.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 py-1">
                            {a.github_url || a.linkedin_url ? (
                              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                {a.github_url && (
                                  <a
                                    href={a.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#141219] border border-neutral-border/60 text-xs font-mono text-violet hover:text-neutral-txt hover:border-violet/50 transition-colors"
                                  >
                                    <Github className="w-4 h-4 text-violet" />
                                    <span className="truncate max-w-[220px]">{a.github_url}</span>
                                    <ExternalLink className="w-3 h-3 text-neutral-muted ml-auto" />
                                  </a>
                                )}
                                {a.linkedin_url && (
                                  <a
                                    href={a.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#141219] border border-neutral-border/60 text-xs font-mono text-violet hover:text-neutral-txt hover:border-violet/50 transition-colors"
                                  >
                                    <Linkedin className="w-4 h-4 text-violet" />
                                    <span className="truncate max-w-[220px]">{a.linkedin_url}</span>
                                    <ExternalLink className="w-3 h-3 text-neutral-muted ml-auto" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs font-mono text-neutral-muted italic">
                                No submission links provided.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Detail modal for a single student
const StudentDetailModal: React.FC<{
  user: Profile;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (userId: string) => void | Promise<void>;
  isRemoving: boolean;
  onStartCall: () => void;
  isStartingCall: boolean;
}> = ({ user, isOpen, onClose, onRemove, isRemoving, onStartCall, isStartingCall }) => {
  const studentUserId = user.user_id || user.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user.display_name}
      description={user.institution ?? 'No institution set'}
    >
      <div className="space-y-5">
        {/* Avatar + identity */}
        <div className="flex items-center gap-4 p-4 rounded bg-surface-lowest border border-neutral-border/60">
          <Avatar.Root className="w-16 h-16 rounded-lg border-2 border-violet/40 bg-[#211E26] shrink-0 overflow-hidden inline-flex items-center justify-center">
            <Avatar.Image
              src={user.avatar_url || undefined}
              alt={user.display_name}
              className="w-full h-full object-cover"
            />
            <Avatar.Fallback
              delayMs={0}
              className="w-full h-full bg-[#211E26] text-[#A78BF9] font-mono font-bold text-lg flex items-center justify-center select-none"
            >
              {getInitials(user.display_name)}
            </Avatar.Fallback>
          </Avatar.Root>
          <div className="space-y-1 min-w-0">
            <p className="font-mono text-sm font-bold text-neutral-txt truncate">
              {user.display_name}
            </p>
            {user.institution && (
              <p className="text-xs font-mono text-neutral-muted flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {user.institution}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  user.account_status === 'active'
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                    : 'border-neutral-border text-neutral-muted'
                }`}
              >
                ● {user.account_status}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  user.cohort_id
                    ? 'border-violet/30 text-violet bg-violet/10'
                    : 'border-neutral-border text-neutral-muted'
                }`}
              >
                {user.cohort_id ? 'Enrolled in Cohort' : 'Not in a cohort'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-muted flex items-center gap-1">
              <FileText className="w-3 h-3" /> Bio
            </p>
            <p className="text-xs font-mono text-neutral-txt leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* GitHub / LinkedIn links */}
        {(user.github_username || user.linkedin_url) && (
          <div className="flex flex-wrap gap-3">
            {user.github_username && (
              <a
                href={`https://github.com/${user.github_username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-violet hover:underline"
              >
                <Github className="w-4 h-4" /> {user.github_username}{' '}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {user.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-violet hover:underline"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn{' '}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Assignment history */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-muted">
            Challenge Assignments
          </p>
          <UserAssignmentsTable userId={studentUserId} />
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-neutral-border flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            isLoading={isStartingCall}
            onClick={onStartCall}
          >
            Start Live Class
          </Button>

          <Button
            variant="danger"
            size="sm"
            isLoading={isRemoving}
            disabled={isRemoving}
            onClick={() => onRemove(studentUserId)}
          >
            Remove from Cohort
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────

export const AdminCohorts: React.FC = () => {
  const { members, isLoading, removeFromCohort } = useAdminCohorts();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [search, setSearch] = useState('');
  const [isStartingGlobalCall, setIsStartingGlobalCall] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filtered = members.filter(
    (m) =>
      m.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.institution ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = async (userId: string) => {
    try {
      await removeFromCohort.mutateAsync(userId);
      setSelectedUser(null);
      setToast({ message: 'Student removed from cohort successfully.', type: 'success' });
    } catch (err: any) {
      console.error('Failed to remove student from cohort:', err);
      const errorMessage = err?.message || 'Failed to remove student from cohort.';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleStartGlobalCall = async () => {
    setIsStartingGlobalCall(true);
    const roomUrl = `https://meet.jit.si/CTP-LiveClass-${crypto.randomUUID()}`;
    
    try {
      // Fetch all standard users (students)
      const { data: users, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'user');
        
      if (fetchError) throw fetchError;
      if (!users || users.length === 0) {
        alert('No students found to invite.');
        return;
      }

      // Prepare bulk notification payload
      const notifications = users.map(u => ({
        user_id: u.id,
        message: 'Your mentor has started a live video session! Join now.',
        type: 'video_call',
        action_url: roomUrl
      }));

      // Bulk insert to trigger Realtime WebSockets
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      // Open the call for the Admin
      window.open(roomUrl, '_blank');
      
    } catch (err) {
      console.error('Failed to start call:', err);
      alert('Failed to start the live class.');
    } finally {
      setIsStartingGlobalCall(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
            MANAGE <span className="text-violet">COHORTS</span>
          </h1>
        </div>

        <Button
          isLoading={isStartingGlobalCall}
          onClick={handleStartGlobalCall}
        >
          Start Live Class
        </Button>
      </div>

      <Card className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-border pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet" />
            <h2 className="font-mono text-base font-bold uppercase text-neutral-txt">
              Student Directory ({filtered.length})
            </h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" />
            <input
              type="text"
              placeholder="Search name or institution…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-lowest border border-neutral-border rounded pl-9 pr-3 py-1.5 font-mono text-xs text-neutral-txt outline-none focus:border-violet w-64"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-10 text-center font-mono text-xs text-neutral-muted">
            Loading student directory…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-neutral-muted">
            No students match your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-border/60 text-[11px] font-mono uppercase tracking-wider text-neutral-muted">
                  <th className="pb-3 px-3">Student</th>
                  <th className="pb-3 px-3">Institution</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Cohort</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/30 font-mono text-xs">
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-high/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(member)}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <Avatar.Root className="w-8 h-8 rounded border border-neutral-border bg-[#211E26] shrink-0 overflow-hidden inline-flex items-center justify-center">
                          <Avatar.Image
                            src={member.avatar_url || undefined}
                            alt={member.display_name}
                            className="w-full h-full object-cover"
                          />
                          <Avatar.Fallback
                            delayMs={0}
                            className="w-full h-full bg-[#211E26] text-[#A78BF9] font-mono font-bold text-xs flex items-center justify-center select-none"
                          >
                            {getInitials(member.display_name)}
                          </Avatar.Fallback>
                        </Avatar.Root>
                        <span className="font-semibold text-neutral-txt truncate max-w-[160px]">
                          {member.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-neutral-muted">
                      {member.institution ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {member.institution}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                          member.account_status === 'active'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                            : 'border-neutral-border text-neutral-muted'
                        }`}
                      >
                        ● {member.account_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-muted">
                      {member.cohort_id ? (
                        <span className="text-violet text-[10px] px-2 py-0.5 rounded border border-violet/30 bg-violet/10">
                          Enrolled
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-muted">No cohort</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          isLoading={isStartingGlobalCall}
                          onClick={handleStartGlobalCall}
                        >
                          Live Class
                        </Button>
                        <ChevronRight className="w-4 h-4 text-neutral-muted" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedUser && (
        <StudentDetailModal
          user={selectedUser}
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          onRemove={handleRemove}
          isRemoving={removeFromCohort.isPending}
          onStartCall={handleStartGlobalCall}
          isStartingCall={isStartingGlobalCall}
        />
      )}

      {/* Toast Notification */}
      {toast &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="alert"
            aria-live="assertive"
            className="fixed bottom-6 right-6 z-[9999] max-w-md animate-slide-up"
          >
            <div
              className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
                toast.type === 'error'
                  ? 'bg-[#181116]/95 border-red-500/50 text-red-200 shadow-red-950/40'
                  : 'bg-[#141d18]/95 border-emerald-500/50 text-emerald-200 shadow-emerald-950/40'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs font-mono">
                <p className={`font-bold uppercase tracking-wider ${toast.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {toast.type === 'error' ? 'Removal Failed' : 'Success'}
                </p>
                <p className="mt-0.5 text-neutral-txt">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-neutral-muted hover:text-neutral-txt p-1 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
