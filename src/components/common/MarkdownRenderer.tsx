import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Parse markdown to raw HTML
  const rawHtml = marked.parse(content || '', { async: false }) as string;
  
  // Sanitize the HTML to prevent XSS attacks
  const safeHtml = DOMPurify.sanitize(rawHtml);

  return (
    <div
      className={`prose prose-invert max-w-none 
        prose-headings:font-mono prose-headings:text-violet prose-headings:font-bold prose-headings:uppercase
        prose-p:text-neutral-txt prose-p:leading-relaxed prose-p:font-sans
        prose-code:font-mono prose-code:text-violet prose-code:bg-surface-lowest prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-surface-lowest prose-pre:border prose-pre:border-neutral-border prose-pre:p-4 prose-pre:rounded-lg
        prose-a:text-violet prose-a:underline hover:prose-a:text-violet-dim
        prose-li:text-neutral-txt
        ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};
