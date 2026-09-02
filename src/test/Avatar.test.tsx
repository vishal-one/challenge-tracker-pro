import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { getInitials, Avatar, AvatarRoot, AvatarImage, AvatarFallback } from '../components/ui/Avatar';

describe('Avatar & getInitials utilities', () => {
  describe('getInitials', () => {
    it('extracts first letters of first and last name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Ada Lovelace')).toBe('AL');
      expect(getInitials('Sarah Connor Smith')).toBe('SS');
    });

    it('handles single word names', () => {
      expect(getInitials('Alex')).toBe('A');
      expect(getInitials('Z')).toBe('Z');
    });

    it('handles email addresses without domain', () => {
      expect(getInitials('john.doe@example.com')).toBe('JD');
      expect(getInitials('admin_user@test.org')).toBe('AU');
    });

    it('gracefully handles empty, whitespace, and null inputs', () => {
      expect(getInitials('')).toBe('?');
      expect(getInitials('   ')).toBe('?');
      expect(getInitials(null)).toBe('?');
      expect(getInitials(undefined)).toBe('?');
    });
  });

  describe('Avatar Component & Primitives', () => {
    it('renders Avatar.Fallback with user initials when avatar_url is missing', async () => {
      render(
        <Avatar name="Jane Doe" />
      );

      const fallback = await screen.findByText('JD');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveClass('bg-[#211E26]');
      expect(fallback).toHaveClass('text-[#A78BF9]');
    });

    it('renders utilizing @radix-ui/react-avatar primitives directly with Soft Violet fallback', async () => {
      render(
        <AvatarRoot className="w-8 h-8 rounded border border-neutral-border bg-[#211E26]">
          <AvatarImage src="" alt="Bob Marley" />
          <AvatarFallback delayMs={0} className="w-full h-full bg-[#211E26] text-[#A78BF9] font-mono font-bold">
            {getInitials('Bob Marley')}
          </AvatarFallback>
        </AvatarRoot>
      );

      const fallback = await screen.findByText('BM');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveClass('bg-[#211E26]');
      expect(fallback).toHaveClass('text-[#A78BF9]');
    });
  });
});
