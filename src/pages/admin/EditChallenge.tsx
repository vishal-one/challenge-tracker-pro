import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { MarkdownRenderer } from '../../components/common/MarkdownRenderer';
import { DifficultyLevel, Profile } from '../../types/database';
import { ArrowLeft, Pencil, Eye, Edit3, Link2, Users, Check, Lock } from 'lucide-react';

const challengeSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  resource_url: z.string().url('Must be a valid URL (e.g. https://...)').or(z.literal('')),
  difficulty_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Hardcore']),
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

export const EditChallenge: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isCodingChallenge, setIsCodingChallenge] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // ── 1. Fetch active cohort members (role === 'user') via TanStack Query ──
  const { data: cohortMembers = [] } = useQuery<Profile[]>({
    queryKey: ['active-cohort-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .eq('account_status', 'active')
        .order('display_name', { ascending: true });

      if (error) throw error;
      return (data || []) as Profile[];
    },
  });

  // ── 2. Fetch existing assignments for this challenge ───────────────────
  const { data: existingAssignments = [] } = useQuery({
    queryKey: ['challenge-assignments', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('assignments')
        .select('user_id')
        .eq('challenge_id', id);

      if (error) throw error;
      return data as { user_id: string }[];
    },
    enabled: Boolean(id),
  });

  // Set of user IDs that already have the assignment (immutable baseline)
  const alreadyAssignedIds = useMemo(
    () => new Set(existingAssignments.map((a) => a.user_id)),
    [existingAssignments]
  );

  // Pre-populate selected state once assignments load
  useEffect(() => {
    if (existingAssignments.length > 0) {
      setSelectedUserIds((prev) => {
        const merged = new Set([...prev, ...existingAssignments.map((a) => a.user_id)]);
        return Array.from(merged);
      });
    }
  }, [existingAssignments]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      resource_url: '',
      difficulty_level: 'Intermediate',
    },
  });

  const descriptionValue = watch('description');

  // Populate form from existing DB record
  useEffect(() => {
    if (!id) return;

    const fetchChallenge = async () => {
      setIsFetching(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setFetchError('Challenge not found or failed to load.');
      } else {
        reset({
          title: data.title,
          description: data.description,
          resource_url: data.resource_url ?? '',
          difficulty_level: data.difficulty_level as DifficultyLevel,
        });
        setIsCodingChallenge(data.is_coding_challenge ?? false);
      }
      setIsFetching(false);
    };

    fetchChallenge();
  }, [id, reset]);

  // ── Assignee selection helpers ────────────────────────────────────────
  const toggleUserSelection = (userId: string) => {
    // Prevent unchecking already-assigned users
    if (alreadyAssignedIds.has(userId)) return;

    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const allIds = cohortMembers.map((u) => u.id);
    const allSelected = allIds.every((uid) => selectedUserIds.includes(uid));

    if (allSelected) {
      // Deselect only newly added users; keep already-assigned locked
      setSelectedUserIds(Array.from(alreadyAssignedIds));
    } else {
      setSelectedUserIds(allIds);
    }
  };

  const newAssigneeCount = selectedUserIds.filter((uid) => !alreadyAssignedIds.has(uid)).length;

  // ── 3. Submit Handler (Diffing & RPC Bulk Assignment) ──────────────────
  const onSubmit = async (data: ChallengeFormData) => {
    try {
      // 1. Update challenge metadata
      const { error } = await supabase
        .from('challenges')
        .update({
          title: data.title,
          description: data.description,
          resource_url: data.resource_url || null,
          difficulty_level: data.difficulty_level as DifficultyLevel,
          is_coding_challenge: isCodingChallenge,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!);

      if (error) throw error;

      // 2. Diff: calculate newly selected user IDs
      const newUserIds = selectedUserIds.filter((uid) => !alreadyAssignedIds.has(uid));

      if (newUserIds.length > 0) {
        // Stored procedure assigns newly added users and triggers notification alerts
        const { error: rpcError } = await supabase.rpc('assign_challenge_users', {
          p_challenge_id: id!,
          p_user_ids: newUserIds,
        });

        if (rpcError) throw rpcError;
      }

      // 3. Cache Invalidation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['all-challenges-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-pending-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-completed-submissions'] }),
        queryClient.invalidateQueries({ queryKey: ['metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['challenge-assignments', id] }),
      ]);

      navigate('/admin/challenges');
    } catch (err: any) {
      console.error('Update failed:', err);
      setError('root', {
        type: 'manual',
        message: err.message || 'Failed to update challenge. Please try again.',
      });
    }
  };

  if (isFetching) {
    return (
      <div className="p-12 flex flex-col items-center gap-3 text-neutral-muted font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-violet border-t-transparent animate-spin" />
        Loading challenge data…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="font-mono text-sm text-red-400">{fetchError}</p>
        <Link to="/admin/challenges">
          <Button variant="ghost">
            Back to Manage Challenges
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-border pb-4">
        <Link
          to="/admin/challenges"
          className="inline-flex items-center gap-2 font-mono text-xs text-neutral-muted hover:text-violet transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Manage Challenges
        </Link>
        <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
          <Pencil className="w-5 h-5 text-violet" /> EDIT CHALLENGE
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="space-y-5">
          {/* Root error */}
          {errors.root && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {errors.root.message}
            </div>
          )}

          {/* Title */}
          <Input
            label="Challenge Title *"
            placeholder="e.g. Implement Supabase Row Level Security & Triggers"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Difficulty + Resource URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-medium uppercase tracking-wider text-neutral-muted mb-1.5">
                Difficulty Level *
              </label>
              <select
                {...register('difficulty_level')}
                className="w-full bg-surface-lowest border border-neutral-border rounded font-mono text-xs text-neutral-txt px-3.5 py-2.5 outline-none focus:border-violet"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Hardcore">Hardcore</option>
              </select>
            </div>

            <Input
              label="External Resource / Specs URL"
              placeholder="https://docs.example.com/spec"
              leftIcon={<Link2 className="w-4 h-4" />}
              error={errors.resource_url?.message}
              {...register('resource_url')}
            />
          </div>

          {/* Coding Challenge Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase text-neutral-muted">
              Is this a coding question?
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={isCodingChallenge === true} 
                  onChange={() => setIsCodingChallenge(true)}
                  className="accent-violet"
                />
                <span className="text-sm font-mono text-neutral-txt">Yes, use built-in code editor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={isCodingChallenge === false} 
                  onChange={() => setIsCodingChallenge(false)}
                  className="accent-violet"
                />
                <span className="text-sm font-mono text-neutral-txt">No, require GitHub/LinkedIn URLs</span>
              </label>
            </div>
          </div>

          {/* Markdown editor with preview tab */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-xs font-medium uppercase tracking-wider text-neutral-muted">
                Challenge Specs & Requirements (Markdown Supported) *
              </label>
              <div className="flex items-center bg-surface-lowest border border-neutral-border rounded p-0.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                    activeTab === 'edit'
                      ? 'bg-violet text-black font-semibold'
                      : 'text-neutral-muted hover:text-neutral-txt'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-violet text-black font-semibold'
                      : 'text-neutral-muted hover:text-neutral-txt'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                rows={10}
                placeholder="Write challenge specs using Markdown…"
                className="w-full bg-surface-lowest border border-neutral-border rounded font-mono text-xs text-neutral-txt p-4 outline-none focus:border-violet focus:ring-1 focus:ring-violet/50 transition-all"
                {...register('description')}
              />
            ) : (
              <div className="p-4 rounded border border-neutral-border bg-surface-lowest min-h-[220px]">
                <MarkdownRenderer content={descriptionValue || '*No spec text entered yet.*'} />
              </div>
            )}
            {errors.description && (
              <p className="text-xs text-red-400 font-mono mt-1">{errors.description.message}</p>
            )}
          </div>
        </Card>

        {/* Assignees Selection Box */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet" />
              <div>
                <h3 className="font-mono text-sm font-bold uppercase text-neutral-txt">
                  Manage Assignees ({selectedUserIds.length} Selected{newAssigneeCount > 0 && `, ${newAssigneeCount} new`})
                </h3>
                <p className="text-xs font-mono text-neutral-muted">
                  Already-assigned students are locked to protect their progress. Select new students to assign.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={selectAllUsers}
              className="font-mono text-xs text-violet hover:underline uppercase"
            >
              {cohortMembers.length > 0 && cohortMembers.every((u) => selectedUserIds.includes(u.id))
                ? 'Deselect New'
                : 'Select All Users'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cohortMembers.map((u) => {
              const isAlreadyAssigned = alreadyAssignedIds.has(u.id);
              const isSelected = selectedUserIds.includes(u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`p-3 rounded border flex items-center justify-between font-mono text-xs transition-all ${
                    isAlreadyAssigned
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-neutral-muted cursor-default'
                      : isSelected
                        ? 'border-violet bg-violet/10 text-neutral-txt cursor-pointer'
                        : 'border-neutral-border bg-surface-lowest text-neutral-muted hover:border-violet/40 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Avatar
                      src={u.avatar_url}
                      name={u.display_name}
                      className="w-7 h-7 rounded border border-neutral-border bg-surface shrink-0"
                    />
                    <div className="truncate">
                      <span className="truncate font-semibold">{u.display_name || 'Student'}</span>
                      {isAlreadyAssigned && (
                        <span className="block text-[10px] text-emerald-400/70 font-normal">Already assigned</span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isAlreadyAssigned
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : isSelected
                          ? 'bg-violet border-violet text-black'
                          : 'border-neutral-border'
                    }`}
                  >
                    {isAlreadyAssigned ? (
                      <Lock className="w-3 h-3" />
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Submit actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/admin/challenges">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            {newAssigneeCount > 0
              ? `Save Changes & Assign ${newAssigneeCount} New`
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
