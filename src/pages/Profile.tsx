import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  User,
  CheckCircle2,
  Sparkles,
  Github,
  Linkedin,
  Building2,
  FileText,
} from 'lucide-react';

// --- Validation helpers ---
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
const LINKEDIN_PROFILE_REGEX = /^https:\/\/(www\.)?linkedin\.com\/(in|posts|feed\/update|company)\/.*$/;

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Identity fields
  const [displayName, setDisplayName] = useState(user?.display_name || '');

  // Student detail fields
  const [bio, setBio] = useState(user?.bio || '');
  const [githubUsername, setGithubUsername] = useState(user?.github_username || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [institution, setInstitution] = useState(user?.institution || '');

  // UI state
  const [isSaved, setIsSaved] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setGithubUsername(user.github_username || '');
      setLinkedinUrl(user.linkedin_url || '');
      setInstitution(user.institution || '');
    }
  }, [user]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!displayName.trim()) {
      errors.displayName = 'Display name is required.';
    }
    if (githubUsername && !GITHUB_USERNAME_REGEX.test(githubUsername)) {
      errors.githubUsername =
        'Enter a GitHub username only (e.g. "octocat"), not a full URL.';
    }
    if (linkedinUrl && !LINKEDIN_PROFILE_REGEX.test(linkedinUrl)) {
      errors.linkedinUrl =
        'Invalid LinkedIn URL. Expected: https://linkedin.com/in/username';
    }
    if (bio.length > 280) {
      errors.bio = `Bio must be 280 characters or fewer (currently ${bio.length}).`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsUpdating(true);
    setIsSaved(false);

    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        github_username: githubUsername.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        institution: institution.trim() || undefined,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(
        err.message || 'Failed to update profile settings. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-border pb-6">
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wider text-neutral-txt flex items-center gap-2">
          USER <span className="text-violet">PROFILE SETTINGS</span>
        </h1>
        <p className="text-xs font-mono text-neutral-muted mt-1">
          Customize your identity, bio, and student details visible across the platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* ── Card 1: Identity & Avatar ── */}
        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-border pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-violet" />
              <h2 className="font-mono text-base font-bold uppercase text-neutral-txt">
                Identity &amp; Avatar
              </h2>
            </div>
            {isSaved && (
              <span className="text-xs font-mono text-violet bg-violet/10 px-3 py-1 rounded border border-violet/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          {/* Live Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded bg-surface-lowest border border-neutral-border/60">
            <img
              src={
                user?.avatar_url ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id || 'default'}`
              }
              alt="Avatar Preview"
              className="w-20 h-20 rounded-lg border-2 border-violet/40 object-cover bg-surface shadow-violet-glow/20"
            />
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-mono text-sm font-bold text-neutral-txt">
                {displayName || 'User Name'}
              </h3>
              {institution && (
                <p className="text-[11px] font-mono text-neutral-muted flex items-center gap-1">
                  <Building2 className="w-3 h-3 inline" /> {institution}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="text-[10px] font-mono uppercase text-violet bg-violet/10 px-2 py-0.5 rounded border border-violet/30">
                  {user?.role || 'user'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  ● {user?.account_status || 'active'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-muted pt-0.5">
                Member ID: {user?.id}
              </p>
            </div>
          </div>

          <Input
            label="Display Name *"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.displayName}
            required
          />
        </Card>

        {/* ── Card 2: Student Details ── */}
        <Card className="space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-border pb-4">
            <FileText className="w-5 h-5 text-violet" />
            <h2 className="font-mono text-base font-bold uppercase text-neutral-txt">
              Student Details
            </h2>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block font-mono text-xs font-medium uppercase tracking-wider text-neutral-muted">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="A short intro about yourself, your skills, or what you're working on…"
              className={`w-full bg-surface-lowest border rounded text-neutral-txt font-mono text-sm px-3.5 py-2.5 outline-none transition-all placeholder:text-neutral-muted/60 focus:border-violet focus:ring-1 focus:ring-violet/50 resize-none ${
                fieldErrors.bio
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/50'
                  : 'border-neutral-border'
              }`}
            />
            <div className="flex justify-between items-center">
              {fieldErrors.bio ? (
                <p className="text-xs text-red-400 font-mono">{fieldErrors.bio}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-[10px] font-mono tabular-nums ${
                  bio.length > 260 ? 'text-gold' : 'text-neutral-muted'
                }`}
              >
                {bio.length} / 280
              </span>
            </div>
          </div>

          {/* GitHub username + Institution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GitHub Username"
              placeholder="octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              leftIcon={<Github className="w-4 h-4" />}
              error={fieldErrors.githubUsername}
            />
            <Input
              label="Institution (University / Company)"
              placeholder="MIT, Google, …"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              leftIcon={<Building2 className="w-4 h-4" />}
              error={fieldErrors.institution}
            />
          </div>

          {/* LinkedIn URL */}
          <Input
            label="LinkedIn Profile URL"
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            leftIcon={<Linkedin className="w-4 h-4" />}
            error={fieldErrors.linkedinUrl}
          />
        </Card>

        {/* ── Global error + Submit ── */}
        {errorMessage && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {errorMessage}
          </div>
        )}

        <div className="pb-2">
          <Button
            type="submit"
            isLoading={isUpdating}
            rightIcon={<Sparkles className="w-4 h-4" />}
          >
            Save Profile Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
