import type { ReactNode } from 'react';
import { Badge } from './Badge';
import { cn } from './utils';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-[30px] border border-white/10 bg-[linear-gradient(115deg,rgba(6,24,21,0.54),rgba(0,0,0,0.28)_58%,rgba(255,255,255,0.04))] p-6 shadow-[0_18px_56px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-8',
        'flex flex-col gap-5 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow && <Badge tone="green">{eyebrow}</Badge>}
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl rounded-2xl bg-black/18 px-4 py-3 text-base font-medium leading-7 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md md:text-lg">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
