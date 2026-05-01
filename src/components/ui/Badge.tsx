import type { ReactNode } from 'react';
import { cn } from './utils';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  tone?: 'green' | 'amber' | 'slate';
}

const tones = {
  green: 'border-emerald-200/20 bg-emerald-300/10 text-emerald-100 backdrop-blur-md',
  amber: 'border-amberSoft/25 bg-amberSoft/12 text-[#FFE7BA] backdrop-blur-md',
  slate: 'border-white/12 bg-white/[0.08] text-white/70 backdrop-blur-md',
};

export function Badge({ children, className, tone = 'slate' }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}
