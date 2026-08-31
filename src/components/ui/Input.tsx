import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block font-mono text-xs font-medium uppercase tracking-wider text-neutral-muted">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-neutral-muted flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-surface-lowest border border-neutral-border rounded text-neutral-txt font-mono text-sm px-3.5 py-2.5 outline-none transition-all placeholder:text-neutral-muted/60 focus:border-violet focus:ring-1 focus:ring-violet/50',
                leftIcon && 'pl-10',
                error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/50',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 font-mono mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
