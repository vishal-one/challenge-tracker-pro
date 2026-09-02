import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChallenges } from '../../hooks/useChallenges';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { MarkdownRenderer } from '../../components/common/MarkdownRenderer';
import { DifficultyLevel } from '../../types/database';
import { ArrowLeft, PlusSquare, Eye, Edit3, Link2, Users, Check } from 'lucide-react';

const challengeSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  resource_url: z.string().url('Must be a valid URL (e.g. https://...)').or(z.literal('')),
  difficulty_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Hardcore']),
});

type ChallengeFormData = z.infer<typeof challengeSchema>;

export const CreateChallenge: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCodingChallenge, setIsCodingChallenge] = useState(false);
  const { createChallenge } = useChallenges();
  const { allUsers } = useAuth();
  const cohortMembers = allUsers.filter(u => u.role === 'user');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
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

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === cohortMembers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(cohortMembers.map((u) => u.id));
    }
  };

  const onSubmit = async (data: ChallengeFormData) => {
    try {
      await createChallenge.mutateAsync({
        ...data,
        difficulty_level: data.difficulty_level as DifficultyLevel,
        is_coding_challenge: isCodingChallenge,
        assigneeIds: selectedUserIds,
      });
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Submission failed:', error);
      setError('root', {
        type: 'manual',
        message: error.message || 'Failed to create challenge. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-border pb-4">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 font-mono text-xs text-neutral-muted hover:text-violet transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
          <PlusSquare className="w-5 h-5 text-violet" /> PUBLISH NEW CHALLENGE
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="space-y-5">
          {/* Challenge Title */}
          <Input
            label="Challenge Title *"
            placeholder="e.g. Implement Supabase Row Level Security & Triggers"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Difficulty Level & Resource URL */}
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

          {/* Markdown Description with Preview Tab */}
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
                placeholder="Write challenge specs using Markdown format (### Objective, - Requirements, ```code```)..."
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
                  Assign Cohort Members ({selectedUserIds.length} Selected)
                </h3>
                <p className="text-xs font-mono text-neutral-muted">
                  Assigned members will automatically receive a notification alert.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={selectAllUsers}
              className="font-mono text-xs text-violet hover:underline uppercase"
            >
              {selectedUserIds.length === cohortMembers.length ? 'Deselect All' : 'Select All Users'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cohortMembers.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`p-3 rounded border cursor-pointer flex items-center justify-between font-mono text-xs transition-all ${
                    isSelected
                      ? 'border-violet bg-violet/10 text-neutral-txt'
                      : 'border-neutral-border bg-surface-lowest text-neutral-muted hover:border-violet/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Avatar
                      src={u.avatar_url}
                      name={u.display_name}
                      className="w-7 h-7 rounded border border-neutral-border bg-surface shrink-0"
                    />
                    <span className="truncate font-semibold">{u.display_name}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-violet border-violet text-black' : 'border-neutral-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/admin/dashboard">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            isLoading={createChallenge.isPending}
          >
            Publish Challenge & Dispatch Alerts
          </Button>
        </div>
      </form>
    </div>
  );
};
