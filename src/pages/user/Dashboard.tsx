import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserAssignments } from '../../hooks/useAssignments';
import { Card } from '../../components/ui/Card';
import { StatusBadge, DifficultyBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressStatus } from '../../types/database';
import { CheckSquare, Clock, CheckCircle2, Search, ArrowRight, ExternalLink } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { assignments, isLoading } = useUserAssignments();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const completedCount = assignments.filter((a) => a.progress_status === 'complete').length;
  const ongoingCount = assignments.filter((a) => a.progress_status === 'ongoing').length;
  const incompleteCount = assignments.filter((a) => a.progress_status === 'incomplete').length;

  const filtered = assignments.filter((a) => {
    const safeTitle = a.challenge?.title || '';
    const searchClean = searchQuery.trim().toLowerCase();
    const titleMatch = safeTitle.toLowerCase().includes(searchClean);

    const statusMatch = statusFilter === 'all' ? true : a.progress_status === statusFilter;

    return titleMatch && statusMatch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-neutral-border pb-6">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
          MY ASSIGNED <span className="text-violet">CHALLENGES</span>
        </h1>
        <p className="text-xs font-mono text-neutral-muted mt-1">
          Track technical progress, review milestone specs, and submit proof artifacts
        </p>
      </div>

      {/* Progress Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Total Assigned</span>
            <CheckSquare className="w-5 h-5 text-violet" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-neutral-txt">{assignments.length}</span>
            <span className="text-xs font-mono text-neutral-muted">challenges</span>
          </div>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">In Progress</span>
            <Clock className="w-5 h-5 text-gold" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-gold">{ongoingCount}</span>
            <span className="text-xs font-mono text-neutral-muted">ongoing</span>
          </div>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-muted">Completed</span>
            <CheckCircle2 className="w-5 h-5 text-violet" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-violet">{completedCount}</span>
            <span className="text-xs font-mono text-neutral-muted">finished</span>
          </div>
        </Card>
      </div>

      {/* Data Table Section */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-border pb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-violet" />
            <h2 className="text-base font-mono font-bold uppercase text-neutral-txt">
              Assigned Tasks ({filtered.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" />
              <input
                type="text"
                placeholder="Search assigned tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-lowest border border-neutral-border rounded pl-9 pr-3 py-1.5 font-mono text-xs text-neutral-txt outline-none focus:border-violet"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-surface-lowest border border-neutral-border rounded p-0.5 font-mono text-xs">
              {['all', 'incomplete', 'ongoing', 'complete'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded uppercase tracking-wider transition-colors ${
                    statusFilter === st
                      ? 'bg-violet text-black font-semibold'
                      : 'text-neutral-muted hover:text-neutral-txt'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-muted">
            Loading assigned tasks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-muted">
            No assigned challenges match your current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-border/60 text-[11px] font-mono uppercase tracking-wider text-neutral-muted">
                  <th className="pb-3 px-3">Challenge Title</th>
                  <th className="pb-3 px-3">Difficulty</th>
                  <th className="pb-3 px-3">Progress Status</th>
                  <th className="pb-3 px-3">Proofs</th>
                  <th className="pb-3 px-3 text-right">View Spec</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/30 font-mono text-xs">
                {filtered.map((asgn) => (
                  <tr key={asgn.id} className="hover:bg-surface-high/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-txt">
                      <div>
                        <p>{asgn.challenge?.title || 'Challenge'}</p>
                        {asgn.completed_at && (
                          <p className="text-[10px] text-neutral-muted font-normal mt-0.5">
                            Completed: {new Date(asgn.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {asgn.challenge && <DifficultyBadge level={asgn.challenge.difficulty_level} />}
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={asgn.progress_status} />
                    </td>

                    <td className="py-3 px-3 text-neutral-muted">
                      <div className="flex items-center gap-2">
                        {asgn.github_url && (
                          <a
                            href={asgn.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet hover:underline inline-flex items-center gap-1"
                          >
                            GitHub <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {asgn.linkedin_url && (
                          <a
                            href={asgn.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gold hover:underline inline-flex items-center gap-1"
                          >
                            LinkedIn <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {!asgn.github_url && !asgn.linkedin_url && <span className="text-neutral-muted/50">-</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Link to={`/my-challenges/${asgn.id}`}>
                        <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Open
                        </Button>
                      </Link>
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
