import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-[28px] border border-dashed border-white/16 bg-white/[0.05] px-6 py-14 text-center">
      <SearchX className="mb-4 text-muted" size={34} />
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
