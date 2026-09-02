import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useChallenges, useCohortMetrics } from '../../hooks/useChallenges';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DifficultyBadge } from '../../components/ui/Badge';
import * as Avatar from '@radix-ui/react-avatar';
import { getInitials } from '../../components/ui/Avatar';
import {
  Users,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [showArchived, setShowArchived] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { challenges, isLoading, toggleArchive } = useChallenges(showArchived);
  const { data: metrics } = useCohortMetrics();

  const { data: cohortMembers = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['cohort-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .eq('account_status', 'active')
        .not('cohort_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    }
  });

  const filteredChallenges = challenges.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.difficulty_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
            ADMINISTRATOR <span className="text-violet">COMMAND CENTER</span>
          </h1>
          <p className="text-xs font-mono text-neutral-muted mt-1">
            Cohort management, milestone publishing, and completion analytics
          </p>
        </div>

        <Link to="/admin/challenges/new">
          <Button>
            Publish New Challenge
          </Button>
        </Link>
      </div>

      {/* Cohort Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Active Users</span>
            <Users className="w-5 h-5 text-violet" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-neutral-txt">{metrics?.activeUsers ?? cohortMembers.length}</span>
            <span className="text-xs font-mono text-neutral-muted">/ {metrics?.totalUsers ?? cohortMembers.length} registered</span>
          </div>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Published Challenges</span>
            <Trophy className="w-5 h-5 text-violet" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-neutral-txt">{metrics?.activeChallenges ?? challenges.length}</span>
            <span className="text-xs font-mono text-neutral-muted">active</span>
          </div>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Completed Tasks</span>
            <CheckCircle2 className="w-5 h-5 text-violet" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-neutral-txt">{metrics?.completedAssignments ?? 0}</span>
            <span className="text-xs font-mono text-neutral-muted">/ {metrics?.totalAssignments ?? 0} assigned</span>
          </div>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Cohort Rate</span>
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-gold">{metrics?.completionRatePercentage ?? 0}%</span>
            <span className="text-xs font-mono text-neutral-muted">completion</span>
          </div>
        </Card>
      </div>

      {/* Challenges Management Table */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet" />
            <h2 className="text-base font-mono font-bold uppercase text-neutral-txt">
              Challenge Repository ({filteredChallenges.length})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface-lowest border border-neutral-border rounded pl-9 pr-3 py-1.5 font-mono text-xs text-neutral-txt outline-none focus:border-violet"
              />
            </div>

            {/* Toggle Archive Filter */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded font-mono text-xs border uppercase tracking-wider transition-colors ${
                showArchived
                  ? 'bg-violet/10 border-violet/40 text-violet'
                  : 'bg-surface-lowest border-neutral-border text-neutral-muted hover:text-neutral-txt'
              }`}
            >
              {showArchived ? 'Showing Archived' : 'Active Only'}
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-muted">
            Loading repository data...
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-muted space-y-3">
            <p>No challenges match your search filter.</p>
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
                  <th className="pb-3 px-3">Resource Link</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/30 font-mono text-xs">
                {filteredChallenges.map((chal) => (
                  <tr key={chal.id} className="hover:bg-surface-high/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-txt">
                      <div className="flex items-center gap-2">
                        <span>{chal.title}</span>
                        {chal.is_archived && (
                          <span className="text-[10px] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <DifficultyBadge level={chal.difficulty_level} />
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs ${chal.is_archived ? 'text-neutral-muted' : 'text-violet font-semibold'}`}>
                        {chal.is_archived ? 'Soft Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-muted">
                      {chal.resource_url ? (
                        <a
                          href={chal.resource_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-violet hover:underline"
                        >
                          Resource <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={chal.is_archived ? 'ghost' : 'danger'}
                        onClick={() => toggleArchive.mutate({ id: chal.id, is_archived: chal.is_archived })}
                        isLoading={toggleArchive.isPending}
                      >
                        {chal.is_archived ? 'Unarchive' : 'Archive'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cohort Users Directory */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-border pb-4">
          <Users className="w-5 h-5 text-violet" />
          <h2 className="text-base font-mono font-bold uppercase text-neutral-txt">
            Active Cohort Directory ({cohortMembers.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {isMembersLoading ? (
            <div className="p-8 text-center font-mono text-xs text-neutral-muted col-span-full">
              Loading cohort directory...
            </div>
          ) : cohortMembers.map((u) => (
            <div key={u.id} className="p-3 rounded bg-surface-lowest border border-neutral-border flex items-center gap-3">
              <Avatar.Root className="w-10 h-10 rounded border border-neutral-border bg-[#211E26] shrink-0 overflow-hidden inline-flex items-center justify-center">
                <Avatar.Image
                  src={u.avatar_url || undefined}
                  alt={u.display_name}
                  className="w-full h-full object-cover"
                />
                <Avatar.Fallback
                  delayMs={0}
                  className="w-full h-full bg-[#211E26] text-[#A78BF9] font-mono font-bold text-xs flex items-center justify-center select-none"
                >
                  {getInitials(u.display_name)}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-bold text-neutral-txt truncate">{u.display_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                    u.role === 'admin' ? 'border-violet text-violet bg-violet/10' : 'border-neutral-border text-neutral-muted'
                  }`}>
                    {u.role}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">● Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
