import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const baseStyles =
  'inline-flex items-center justify-center font-mono font-semibold rounded uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-violet disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-violet text-black hover:bg-violet-dim shadow-violet-glow active:scale-[0.99]',
  secondary: 'bg-lavender text-black hover:bg-lavender-dim active:scale-[0.99]',
  ghost: 'bg-surface-high/60 border border-neutral-border text-neutral-txt hover:bg-surface-highest hover:border-violet/50',
  danger: 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-xs px-4 py-2.5 gap-2',
  lg: 'text-sm px-6 py-3 gap-2.5',
};

export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} = {}) => {
  return cn(baseStyles, variants[variant], sizes[size], className);
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
