import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: ReactNode;
}

const variants = {
  primary: 'bg-campus-300 text-campus-900 shadow-card hover:bg-[#a7dbc5]',
  secondary: 'border border-white/10 bg-white/[0.055] text-ink shadow-[0_10px_28px_rgba(0,0,0,0.1)] backdrop-blur-lg hover:bg-white/[0.1]',
  ghost: 'text-ink/80 hover:bg-white/[0.1] hover:text-ink',
  subtle: 'border border-white/10 bg-white/[0.04] text-ink/80 backdrop-blur-lg hover:bg-white/[0.085]',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-11 w-11 p-0',
};

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 ease-out hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
