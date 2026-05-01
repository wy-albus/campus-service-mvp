import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <motion.div
      className={cn('grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12', className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DashboardCard({ children, className, onClick }: DashboardCardProps) {
  const Tag = onClick ? 'button' : 'article';
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Tag
        onClick={onClick}
        className={cn(
          'noise-panel h-full w-full rounded-[28px] border border-white/12 bg-white/[0.08] p-5 text-left shadow-card backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.11]',
          onClick && 'cursor-pointer',
        )}
      >
        {children}
      </Tag>
    </motion.div>
  );
}
