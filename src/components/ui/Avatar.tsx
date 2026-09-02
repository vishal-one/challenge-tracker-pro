import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from './Button';

/**
 * Extracts the user's initials (e.g. first letter of first and last name)
 * from a display name or email address.
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';

  // If email format, strip domain
  const clean = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  // Split on spaces, dots, dashes, underscores
  const parts = clean.split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const AvatarRoot = AvatarPrimitive.Root;
export const AvatarImage = AvatarPrimitive.Image;
export const AvatarFallback = AvatarPrimitive.Fallback;

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string | null;
  alt?: string;
  name?: string | null;
  fallbackText?: string;
  fallbackClassName?: string;
  imageClassName?: string;
}

const AvatarBase = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ src, alt, name, fallbackText, fallbackClassName, imageClassName, className, ...props }, ref) => {
  const initials = fallbackText || getInitials(name || alt);

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden select-none shrink-0 rounded bg-surface border border-neutral-border',
        className
      )}
      {...props}
    >
      <AvatarPrimitive.Image
        src={src || undefined}
        alt={alt || name || 'Avatar'}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
      <AvatarPrimitive.Fallback
        delayMs={0}
        className={cn(
          'flex h-full w-full items-center justify-center font-mono font-bold uppercase tracking-wider bg-[#211E26] text-[#A78BF9] select-none text-xs',
          fallbackClassName
        )}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});

AvatarBase.displayName = 'Avatar';

export const Avatar = Object.assign(AvatarBase, {
  Root: AvatarPrimitive.Root,
  Image: AvatarPrimitive.Image,
  Fallback: AvatarPrimitive.Fallback,
});
