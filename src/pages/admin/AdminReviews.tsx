import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { DifficultyBadge } from '../../components/ui/Badge';
import { MarkdownRenderer } from '../../components/common/MarkdownRenderer';
import { Avatar } from '../../components/ui/Avatar';
import {
  Search,
  AlertCircle,
  Code2,
  FileText,
  Github,
  Linkedin,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Bot,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedFeedbackIds, setExpandedFeedbackIds] = useState<string[]>([]);

  const toggleFeedback = (id: string) => {
    setExpandedFeedbackIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ── TanStack Query: fetch all completed submissions ───────────────────────
  const {
    data: rawSubmissions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-completed-submissions'],
    queryFn: async () => {
      const { data, error: supabaseError } = await supabase
        .from('assignments')
        .select(`
          *,
          profiles:user_id (id, display_name, avatar_url, institution),
          challenges:challenge_id (id, title, difficulty_level, is_coding_challenge, description)
        `)
        .eq('progress_status', 'complete')
        .order('completed_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      return data || [];
    },
  });

  // ── Group submissions by challenge ───────────────────────────────────────
  const groupedSubmissions = useMemo(() => {
    const map = (rawSubmissions as any[]).reduce((acc: any, curr: any) => {
      const cId = curr.challenge_id;
      if (!cId || !curr.challenges) return acc;
      if (!acc[cId]) {
        acc[cId] = { challenge: curr.challenges, submissions: [] };
      }
      acc[cId].submissions.push(curr);
      return acc;
    }, {});

    return Object.values(map) as {
      challenge: {
        id: string;
        title: string;
        difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Hardcore';
        is_coding_challenge: boolean;
        description?: string;
      };
      submissions: any[];
    }[];
  }, [rawSubmissions]);

  // ── Filter grouped challenges and submissions based on search input ───────
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedSubmissions;

    return groupedSubmissions
      .map((group) => {
        const titleMatch = group.challenge.title.toLowerCase().includes(q);
        const filteredSubs = group.submissions.filter((sub) => {
          const name = (sub.profiles?.display_name || '').toLowerCase();
          const inst = (sub.profiles?.institution || '').toLowerCase();
          return name.includes(q) || inst.includes(q);
        });

        if (titleMatch) {
          return group;
        }

        if (filteredSubs.length > 0) {
          return {
            ...group,
            submissions: filteredSubs,
          };
        }

        return null;
      })
      .filter(Boolean) as typeof groupedSubmissions;
  }, [groupedSubmissions, search]);

  const totalCompletions = rawSubmissions.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
              COMPLETED <span className="text-violet">SUBMISSIONS</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" />
              <input
                type="text"
                placeholder="Search question or student…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-lowest border border-neutral-border rounded pl-9 pr-3 py-1.5 font-mono text-xs text-neutral-txt outline-none focus:border-violet w-64 placeholder:text-neutral-muted"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs font-mono text-neutral-muted">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-violet" />
            <strong className="text-neutral-txt">{groupedSubmissions.length}</strong> Challenges with completions
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-neutral-txt">{totalCompletions}</strong> Total submissions
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center font-mono text-xs text-neutral-muted flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet border-t-transparent rounded-full animate-spin mb-4" />
          Loading submissions directory…
        </div>
      ) : error ? (
        <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs rounded-lg flex justify-between items-center">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Failed to load submissions.
          </span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded font-bold transition-colors"
          >
            RETRY
          </button>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center font-mono text-xs text-neutral-muted border border-neutral-border border-dashed rounded-lg bg-surface-lowest/40">
          {search ? 'No submissions match your search.' : 'No completed submissions yet.'}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredGroups.map((group) => {
            const isCoding = Boolean(group.challenge.is_coding_challenge);

            return (
              <div
                key={group.challenge.id}
                className="bg-surface-lowest border border-neutral-border rounded-lg overflow-hidden shadow-sm"
              >
                {/* Question Header */}
                <div className="bg-surface px-5 py-4 border-b border-neutral-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-violet uppercase tracking-wider">
                        Challenge
                      </span>
                      <DifficultyBadge level={group.challenge.difficulty_level} />
                      {isCoding && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          Coding Challenge
                        </span>
                      )}
                    </div>
                    <h2 className="font-mono font-bold text-neutral-txt text-base">
                      {group.challenge.title}
                    </h2>
                  </div>

                  <span className="shrink-0 text-xs font-mono text-violet px-3 py-1 rounded-full border border-violet/30 bg-violet/10 self-start sm:self-center font-semibold">
                    {group.submissions.length} {group.submissions.length === 1 ? 'Submission' : 'Submissions'}
                  </span>
                </div>

                {/* Student Submissions List */}
                <div className="divide-y divide-neutral-border/40">
                  {group.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-5 flex flex-col gap-4 hover:bg-surface-high/10 transition-colors"
                    >
                      {/* Student Info Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={sub.profiles?.avatar_url}
                            name={sub.profiles?.display_name || 'Student'}
                            className="w-9 h-9 rounded-lg bg-surface border border-neutral-border shrink-0"
                          />
                          <div>
                            <p className="font-mono text-sm font-bold text-neutral-txt">
                              {sub.profiles?.display_name || 'Unknown Student'}
                            </p>
                            {sub.profiles?.institution && (
                              <p className="text-[11px] font-mono text-neutral-muted flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> {sub.profiles.institution}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-center flex-wrap">
                          {typeof sub.ai_score === 'number' && (
                            <span
                              className={`px-2.5 py-1 rounded border font-mono text-[11px] font-bold flex items-center gap-1.5 ${
                                sub.ai_score >= 85
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                  : sub.ai_score >= 70
                                    ? 'border-violet/40 bg-violet/10 text-violet'
                                    : sub.ai_score >= 50
                                      ? 'border-gold/40 bg-gold/10 text-gold'
                                      : 'border-red-500/40 bg-red-500/10 text-red-400'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              AI Score: {sub.ai_score}/100
                            </span>
                          )}

                          <div className="text-[11px] font-mono text-neutral-muted flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-violet" />
                            <span>
                              Completed:{' '}
                              {new Date(sub.completed_at || sub.updated_at || sub.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submission Content */}
                      <div className="rounded-lg bg-[#0F0D14] border border-neutral-border/60 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 border-b border-neutral-border/30 pb-2">
                          <div className="flex items-center gap-2">
                            {isCoding ? (
                              <Code2 className="w-3.5 h-3.5 text-violet" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-violet" />
                            )}
                            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-muted font-semibold">
                              {isCoding ? 'Submitted Code Solution' : 'Submission Proof Artifacts'}
                            </span>
                          </div>

                          {sub.ai_feedback && (
                            <button
                              onClick={() => toggleFeedback(sub.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-violet hover:underline bg-violet/10 px-2 py-0.5 rounded border border-violet/30 transition-colors"
                            >
                              <Bot className="w-3 h-3" />
                              {expandedFeedbackIds.includes(sub.id) ? 'Hide AI Feedback' : 'View AI Feedback'}
                              {expandedFeedbackIds.includes(sub.id) ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Collapsible AI Feedback */}
                        {sub.ai_feedback && expandedFeedbackIds.includes(sub.id) && (
                          <div className="p-3.5 rounded bg-[#16131F] border border-violet/30 space-y-2 text-xs font-mono">
                            <div className="flex items-center gap-2 text-violet font-semibold text-[11px]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Gemini AI Mentor Evaluation Report</span>
                            </div>
                            <div className="p-3 rounded bg-surface-lowest/80 border border-neutral-border/40 text-neutral-txt">
                              <MarkdownRenderer content={sub.ai_feedback} />
                            </div>
                          </div>
                        )}

                        {isCoding ? (
                          <div className="space-y-1">
                            {sub.submitted_code ? (
                              <pre className="p-3.5 rounded bg-[#141219] border border-neutral-border/40 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto overflow-y-auto max-h-60 select-text">
                                <code>{sub.submitted_code}</code>
                              </pre>
                            ) : (
                              <p className="text-xs font-mono text-neutral-muted italic py-1">
                                No code submitted.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="py-1">
                            {sub.github_url || sub.linkedin_url ? (
                              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                {sub.github_url && (
                                  <a
                                    href={sub.github_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#141219] border border-neutral-border/60 text-xs font-mono text-violet hover:text-neutral-txt hover:border-violet/50 transition-colors"
                                  >
                                    <Github className="w-4 h-4 text-violet shrink-0" />
                                    <span className="truncate max-w-[260px]">{sub.github_url}</span>
                                    <ExternalLink className="w-3 h-3 text-neutral-muted ml-auto shrink-0" />
                                  </a>
                                )}
                                {sub.linkedin_url && (
                                  <a
                                    href={sub.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#141219] border border-neutral-border/60 text-xs font-mono text-violet hover:text-neutral-txt hover:border-violet/50 transition-colors"
                                  >
                                    <Linkedin className="w-4 h-4 text-violet shrink-0" />
                                    <span className="truncate max-w-[260px]">{sub.linkedin_url}</span>
                                    <ExternalLink className="w-3 h-3 text-neutral-muted ml-auto shrink-0" />
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
