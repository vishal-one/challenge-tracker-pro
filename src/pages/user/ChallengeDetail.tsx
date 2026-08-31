import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAssignmentDetail, useUserAssignments } from '../../hooks/useAssignments';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DifficultyBadge } from '../../components/ui/Badge';
import { MarkdownRenderer } from '../../components/common/MarkdownRenderer';
import { CodeWorkspace } from '../../components/workspace/CodeWorkspace';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Linkedin,
  CheckCircle2,
  Sparkles,
  Bot,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const GITHUB_REGEX = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
const LINKEDIN_REGEX = /^https:\/\/(www\.)?linkedin\.com\/(in|posts|feed\/update)\/.*$/;

export const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: assignment, isLoading } = useAssignmentDetail(id || '');
  const { updateSubmission } = useUserAssignments();

  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);

  useEffect(() => {
    if (assignment) {
      setGithubUrl(assignment.github_url || '');
      setLinkedinUrl(assignment.linkedin_url || '');
    }
  }, [assignment]);

  if (isLoading) {
    return (
      <div className="p-12 text-center font-mono text-sm text-neutral-muted">
        Loading challenge details...
      </div>
    );
  }

  if (!assignment || !assignment.challenge) {
    return (
      <div className="space-y-4 text-center p-12">
        <p className="font-mono text-sm text-neutral-muted">Assignment or Challenge not found.</p>
        <Link to="/my-challenges">
          <Button variant="ghost">Return to My Challenges</Button>
        </Link>
      </div>
    );
  }

  const { challenge } = assignment;

  // ── Defensive JSON parsing for ai_feedback ─────────────────────────────
  // The DB may return a stringified JSON object instead of a plain markdown string.
  let displayFeedback = assignment?.ai_feedback || '';
  let displayScore = assignment?.ai_score || 0;

  if (typeof displayFeedback === 'string' && displayFeedback.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(displayFeedback);
      displayFeedback = parsed.feedback || displayFeedback;
      if (typeof parsed.score === 'number') {
        displayScore = parsed.score;
      }
    } catch (e) {
      console.error('Failed to parse AI feedback JSON string:', e);
    }
  }

  // Derived read-only status — DB truth takes priority over local interaction flag
  let displayStatus = 'INCOMPLETE';
  if (assignment.progress_status === 'complete') displayStatus = 'COMPLETE';
  else if (hasInteracted || assignment.progress_status === 'ongoing') displayStatus = 'ONGOING / IN PROGRESS';

  const requiresProof = assignment.progress_status === 'ongoing' || assignment.progress_status === 'complete' || hasInteracted;

  // ── Notify all admins on completion ───────────────────────────────────────
  const notifyAdminsOnCompletion = async (challengeTitle: string, score?: number | null) => {
    try {
      const studentName = user?.display_name || 'A student';
      const scoreText = typeof score === 'number' ? ` (AI Score: ${score}/100)` : '';

      // Fetch all admin user IDs
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          message: `${studentName} completed "${challengeTitle}"${scoreText}.`,
          type: 'system',
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (err) {
      console.error('Failed to notify admins:', err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (requiresProof) {
      if (githubUrl && !GITHUB_REGEX.test(githubUrl)) {
        setErrorMsg(
          'Invalid GitHub URL. Expected format: https://github.com/username/repository'
        );
        return;
      }
      if (linkedinUrl && !LINKEDIN_REGEX.test(linkedinUrl)) {
        setErrorMsg(
          'Invalid LinkedIn URL. Expected format: https://linkedin.com/in/username or /posts/… or /feed/update/…'
        );
        return;
      }
    }

    try {
      const nextStatus = (githubUrl || linkedinUrl) ? 'complete' : (hasInteracted ? 'ongoing' : assignment.progress_status);
      await updateSubmission.mutateAsync({
        assignmentId: assignment!.id,
        progress_status: nextStatus,
        github_url: requiresProof ? githubUrl : '',
        linkedin_url: requiresProof ? linkedinUrl : '',
      });

      // Notify admins when status transitions to complete
      if (nextStatus === 'complete') {
        await notifyAdminsOnCompletion(challenge.title);
      }

      setSavedSuccess(true);
      setHasInteracted(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMsg(err.message || 'Failed to update submission. Please try again.');
    }
  };

  // Helper to determine score color and label
  const getScoreBadgeProps = (score: number) => {
    if (score >= 85) {
      return {
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        bgColor: 'bg-emerald-500/10',
        label: 'Exceptional',
      };
    }
    if (score >= 70) {
      return {
        textColor: 'text-violet',
        borderColor: 'border-violet/40',
        bgColor: 'bg-violet/10',
        label: 'Proficient',
      };
    }
    if (score >= 50) {
      return {
        textColor: 'text-gold',
        borderColor: 'border-gold/40',
        bgColor: 'bg-gold/10',
        label: 'Needs Review',
      };
    }
    return {
      textColor: 'text-red-400',
      borderColor: 'border-red-500/40',
      bgColor: 'bg-red-500/10',
      label: 'Critical Gaps',
    };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Back Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-border pb-4">
        <Link
          to="/my-challenges"
          className="inline-flex items-center gap-2 font-mono text-xs text-neutral-muted hover:text-violet transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Challenges
        </Link>
        <div className="flex items-center gap-2">
          <DifficultyBadge level={challenge.difficulty_level} />
          <span className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${
            displayStatus === 'COMPLETE'
              ? 'border-violet/60 text-violet bg-violet/10'
              : displayStatus === 'ONGOING / IN PROGRESS'
                ? 'border-gold/60 text-gold bg-gold/10'
                : 'border-neutral-border text-neutral-muted'
          }`}>
            {displayStatus}
          </span>
        </div>
      </div>

      {/* Title & Metadata */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-border pb-4">
          <div>
            <h1 className="text-2xl font-mono font-bold text-neutral-txt">{challenge.title}</h1>
            <p className="text-xs font-mono text-neutral-muted mt-1">
              Published on: {new Date(challenge.created_at).toLocaleDateString()}
            </p>
          </div>

          {challenge.resource_url && (
            <a
              href={challenge.resource_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-semibold bg-surface-high border border-neutral-border text-violet hover:border-violet transition-colors"
            >
              External Specs <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Challenge Markdown Body */}
        <div className="p-4 rounded bg-surface-lowest border border-neutral-border/60">
          <MarkdownRenderer content={challenge.description} />
        </div>
      </Card>

      {/* Submission & Proof Form */}
      <Card className="space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-border pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet" />
            <h2 className="text-base font-mono font-bold uppercase text-neutral-txt">
              Submission Proof & Progress Update
            </h2>
          </div>
          {savedSuccess && (
            <span className="text-xs font-mono text-violet bg-violet/10 px-3 py-1 rounded border border-violet/30 animate-pulse">
              ✓ Submission Updated Successfully
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Read-only Status Badge */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-neutral-muted">
              Current Status:
            </span>
            <span className={`px-3 py-1.5 rounded border font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              displayStatus === 'COMPLETE'
                ? 'border-violet/60 text-violet bg-violet/10'
                : displayStatus === 'ONGOING / IN PROGRESS'
                  ? 'border-gold/60 text-gold bg-gold/10'
                  : 'border-neutral-border text-neutral-muted bg-surface-lowest'
            }`}>
              {displayStatus === 'COMPLETE' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {displayStatus}
            </span>
          </div>

          {/* Proof Links Inputs — only shown when a submission is in progress or complete AND not a coding challenge */}
          {requiresProof && !challenge.is_coding_challenge && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="GitHub Repository URL (Proof)"
                placeholder="https://github.com/username/repository"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                leftIcon={<Github className="w-4 h-4" />}
              />

              <Input
                label="LinkedIn Post / Profile URL (Proof)"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                leftIcon={<Linkedin className="w-4 h-4" />}
              />
            </div>
          )}

          {/* Code Editor — only shown for coding challenges */}
          {challenge.is_coding_challenge && (
            <CodeWorkspace
              assignmentId={assignment.id}
              initialCode={assignment.submitted_code}
              onSave={() => {
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 3000);
              }}
              onInteract={() => {
                setHasInteracted(true);
              }}
              onSubmit={async (code, language) => {
                // 1. Invoke the AI Code Evaluator Edge Function
                const { data: aiData, error: aiError } = await supabase.functions.invoke('evaluate-code', {
                  body: {
                    code,
                    language,
                    challengeTitle: challenge.title,
                    challengeDescription: challenge.description,
                    externalSourceLink: challenge.resource_url || null,
                  },
                });

                // Gate: abort submission if AI evaluation fails
                if (aiError) {
                  console.error('Edge Function Error:', aiError);
                  const msg = aiError.message || 'AI evaluation failed. Please try again.';
                  setErrorMsg(`❌ AI Evaluation Error: ${msg}`);
                  throw new Error(msg);
                }

                if (!aiData || typeof aiData.score !== 'number') {
                  const msg = 'AI evaluation returned an invalid response (missing score). Please try again.';
                  console.error('Edge Function Error: invalid response shape', aiData);
                  setErrorMsg(`❌ ${msg}`);
                  throw new Error(msg);
                }

                // 2. Extract AI results with explicit property mapping
                const aiScore: number = aiData.score;
                const aiFeedback: string | null = aiData.feedback || null;

                // 3. Write to Supabase assignments table
                const { error: dbError } = await supabase
                  .from('assignments')
                  .update({
                    submitted_code: code,
                    progress_status: 'complete',
                    ai_score: aiScore,
                    ai_feedback: aiFeedback,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', assignment.id);

                if (dbError) throw dbError;

                // 4. Invalidate TanStack Query caches so UI reflects DB truth
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ['assignment-detail', id] }),
                  queryClient.invalidateQueries({ queryKey: ['assignments'] }),
                  queryClient.invalidateQueries({ queryKey: ['admin-completed-submissions'] }),
                  queryClient.invalidateQueries({ queryKey: ['metrics'] }),
                ]);

                // 5. Reset local interaction flag so displayStatus evaluates from DB
                setHasInteracted(false);

                // 6. Notify all admins
                await notifyAdminsOnCompletion(challenge.title, aiScore);
              }}
            />
          )}

          {assignment.completed_at && (
            <p className="text-xs font-mono text-violet">
              ✓ Challenge marked complete on {new Date(assignment.completed_at).toLocaleString()}
            </p>
          )}

          {!challenge.is_coding_challenge && (
            <div className="pt-2">
              <Button
                type="submit"
                isLoading={updateSubmission.isPending}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Save & Submit Proof Artifacts
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* ── AI Evaluation & Mentor Feedback Report ── */}
      {assignment.progress_status === 'complete' && (displayFeedback || displayScore > 0) && (
        <div className="mt-6 border border-neutral-700 rounded-lg bg-neutral-900 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Bot className="text-violet-400" size={18} /> AI MENTOR CODE EVALUATION
            </h3>
            <div className="px-4 py-2 bg-neutral-800 rounded-md border border-neutral-700 text-white font-mono flex items-center gap-2">
              <Award className="text-violet-400" size={16} />
              <span className="text-lg font-bold">{displayScore}</span> / 100
            </div>
          </div>

          <div className="relative">
            {/* THIS DIV CONTROLS THE HEIGHT */}
            <div className={`text-neutral-300 text-sm leading-relaxed transition-all duration-300 ${isFeedbackExpanded ? '' : 'max-h-48 overflow-hidden'}`}>
              <MarkdownRenderer content={displayFeedback} />
            </div>

            {!isFeedbackExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none" />
            )}
          </div>

          <button
            onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
            className="w-full mt-4 pt-4 border-t border-neutral-800 text-violet-400 hover:text-violet-300 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {isFeedbackExpanded ? (
              <><ChevronUp size={16} /> Show Less</>
            ) : (
              <><ChevronDown size={16} /> Show Detailed Feedback</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
