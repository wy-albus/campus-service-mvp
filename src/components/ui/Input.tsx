import type { InputHTMLAttributes } from 'react';
import { cn } from './utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field-input', className)} {...props} />;
}
