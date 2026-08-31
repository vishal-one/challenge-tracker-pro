import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverGlow = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface border border-neutral-border rounded-lg p-5 backdrop-blur-sm transition-all',
          hoverGlow && 'hover:border-violet/40 hover:shadow-violet-glow/20',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
