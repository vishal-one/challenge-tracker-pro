import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Challenge } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DifficultyBadge } from '../../components/ui/Badge';
import {
  Trophy,
  Archive,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const AdminManageChallenges: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all challenges regardless of archive status
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['all-challenges-admin'],
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-challenges-admin'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const handleDelete = async (challenge: Challenge) => {
    if (!confirm(`Delete "${challenge.title}"? This cannot be undone.`)) return;
    setDeletingId(challenge.id);
    try {
      await deleteMutation.mutateAsync(challenge.id);
    } finally {
      setDeletingId(null);
    }
  };

  // Derived metrics
  const totalCount = challenges.length;
  const activeCount = challenges.filter((c) => !c.is_archived).length;
  const archivedCount = challenges.filter((c) => c.is_archived).length;

  const filtered = challenges.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.difficulty_level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
            MANAGE <span className="text-violet">CHALLENGES</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/admin/challenges/new">
            <Button size="sm">
              New Challenge
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4">
        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Total</span>
            <Trophy className="w-4 h-4 text-violet" />
          </div>
          <p className="text-3xl font-mono font-bold text-neutral-txt mt-2">{totalCount}</p>
          <p className="text-[10px] font-mono text-neutral-muted mt-0.5">challenges</p>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-mono font-bold text-emerald-400 mt-2">{activeCount}</p>
          <p className="text-[10px] font-mono text-neutral-muted mt-0.5">published</p>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Archived</span>
            <Archive className="w-4 h-4 text-gold" />
          </div>
          <p className="text-3xl font-mono font-bold text-gold mt-2">{archivedCount}</p>
          <p className="text-[10px] font-mono text-neutral-muted mt-0.5">soft-archived</p>
        </Card>
      </div>

      {/* Table card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-border pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet" />
            <h2 className="font-mono text-base font-bold uppercase text-neutral-txt">
              Challenge Repository ({filtered.length})
            </h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" />
            <input
              type="text"
              placeholder="Search challenges…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-lowest border border-neutral-border rounded pl-9 pr-3 py-1.5 font-mono text-xs text-neutral-txt outline-none focus:border-violet w-60"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center font-mono text-xs text-neutral-muted">
            <div className="w-7 h-7 rounded-full border-2 border-violet border-t-transparent animate-spin mx-auto mb-3" />
            Loading repository…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs text-neutral-muted space-y-3">
            <p>No challenges match your search.</p>
            <Link to="/admin/challenges/new">
              <Button size="sm">
                Create One Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-border/60 text-[11px] font-mono uppercase tracking-wider text-neutral-muted">
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Difficulty</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Published</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/30 font-mono text-xs">
                {filtered.map((challenge) => (
                  <tr
                    key={challenge.id}
                    className="hover:bg-surface-high/30 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold text-neutral-txt max-w-[240px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{challenge.title}</span>
                        {challenge.is_archived && (
                          <span className="text-[10px] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <DifficultyBadge level={challenge.difficulty_level} />
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-semibold ${
                          challenge.is_archived ? 'text-neutral-muted' : 'text-violet'
                        }`}
                      >
                        {challenge.is_archived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-muted">
                      {new Date(challenge.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/challenges/edit/${challenge.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={deletingId === challenge.id}
                          onClick={() => handleDelete(challenge)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
