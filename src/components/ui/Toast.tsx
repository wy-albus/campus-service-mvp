import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/12 bg-white/[0.12] px-5 py-3 text-sm font-semibold text-ink shadow-card backdrop-blur-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
