import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3" aria-label={`考试进度 ${value}%`}>
      <div className="h-3 overflow-hidden rounded-full bg-white/[0.1]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-campus-300 via-[#b6ddbd] to-amberSoft"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="w-12 text-right text-sm font-semibold text-ink/80">{value}%</span>
    </div>
  );
}
