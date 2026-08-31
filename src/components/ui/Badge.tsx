import React from 'react';
import { ProgressStatus, DifficultyLevel } from '../../types/database';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: ProgressStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-violet/40 bg-violet/10 text-violet uppercase tracking-wider">
        Complete
      </span>
    );
  }

  if (status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-gold/40 bg-gold/10 text-gold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        Ongoing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-neutral-border bg-surface-high/40 text-neutral-muted uppercase tracking-wider">
      Incomplete
    </span>
  );
};

interface DifficultyBadgeProps {
  level: DifficultyLevel;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ level }) => {
  const styles: Record<DifficultyLevel, string> = {
    Beginner: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    Intermediate: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    Advanced: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    Hardcore: 'border-red-500/40 text-red-400 bg-red-500/10',
  };

  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-semibold border uppercase tracking-wider', styles[level])}>
      {level}
    </span>
  );
};
