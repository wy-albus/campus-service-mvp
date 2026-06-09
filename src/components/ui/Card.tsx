import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ children, className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'noise-panel rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl',
        interactive && 'transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
