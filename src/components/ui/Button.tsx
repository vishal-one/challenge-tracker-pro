import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono font-semibold rounded uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-violet disabled:opacity-50 disabled:cursor-not-allowed';
  
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

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        <>
          {leftIcon && <span className="flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
