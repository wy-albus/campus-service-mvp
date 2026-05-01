import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

interface GlassPanelProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: 'section' | 'article' | 'div';
}

export function GlassPanel({ children, className, as: Tag = 'section', ...props }: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        'noise-panel rounded-[32px] border border-white/10 bg-emerald-950/35 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
