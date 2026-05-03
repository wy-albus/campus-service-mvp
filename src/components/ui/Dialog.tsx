import type { ReactNode } from 'react';
import { GripHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

export function Dialog({ open, title, description, children, onClose }: DialogProps) {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 md:pt-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/12 bg-emerald-950/50 shadow-[0_24px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0.08}
            dragConstraints={{ left: -520, right: 520, top: -120, bottom: 520 }}
          >
            <div
              className="flex cursor-move items-start justify-between gap-4 border-b border-white/10 bg-white/[0.06] px-6 py-5"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div>
                <h2 className="text-2xl font-semibold text-ink">{title}</h2>
                {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/40">
                  <GripHorizontal size={14} />
                  拖动标题栏可以移动窗口
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭">
                <X size={18} />
              </Button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
