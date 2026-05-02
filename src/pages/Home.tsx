import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { PageId } from '../App';
import { formatClock } from '../utils/time';
import { Badge } from '../components/ui/Badge';

interface HomeProps {
  onNavigate: (page: PageId) => void;
}

type Grade = '高一' | '高二' | '高三';

const gradeOffset: Record<Grade, number> = {
  高三: 0,
  高二: 1,
  高一: 2,
};

function getGaokaoTarget(now: Date, grade: Grade) {
  const currentYearGaokao = new Date(now.getFullYear(), 5, 7, 9, 0, 0);
  const baseYear = now.getTime() <= currentYearGaokao.getTime() ? now.getFullYear() : now.getFullYear() + 1;
  return new Date(baseYear + gradeOffset[grade], 5, 7, 9, 0, 0);
}

export function Home({ onNavigate: _onNavigate }: HomeProps) {
  const [now, setNow] = useState(new Date());
  const [note, setNote] = useState('');
  const [grade, setGrade] = useState<Grade>('高三');
  const [gradeMenuOpen, setGradeMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const gaokaoDate = useMemo(() => getGaokaoTarget(now, grade), [grade, now]);
  const daysLeft = Math.max(0, Math.ceil((gaokaoDate.getTime() - now.getTime()) / 86400000));
  const isSeniorThree = grade === '高三';
  const heroTitle = isSeniorThree ? '距离高考' : '以梦为马，不负韶华';

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <section className="relative overflow-visible px-2 py-4 md:px-4 md:py-6 lg:px-6">
        <div className="relative z-10 grid gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-5xl">
              <Badge tone="green">Gaokao Countdown</Badge>
              <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
                <h1 className="text-4xl font-semibold leading-none text-ink md:text-6xl lg:text-7xl">{heroTitle}</h1>
                {isSeniorThree && (
                  <div className="pb-1 text-2xl font-semibold text-white/90 drop-shadow-[0_2px_16px_rgba(0,0,0,0.32)] md:text-4xl lg:text-5xl">
                    约 {daysLeft} 天
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-fit">
              <button
                className="inline-flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-ink shadow-[0_10px_26px_rgba(0,0,0,0.12)] backdrop-blur-lg transition hover:bg-white/[0.1]"
                onClick={() => setGradeMenuOpen((value) => !value)}
              >
                {grade}
                <ChevronDown className={gradeMenuOpen ? 'rotate-180 transition' : 'transition'} size={17} />
              </button>
              <AnimatePresence>
                {gradeMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-14 z-30 grid w-32 gap-1 rounded-2xl border border-white/10 bg-campus-900/62 p-2 shadow-soft backdrop-blur-xl"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                  >
                    {(['高一', '高二', '高三'] as Grade[]).map((item) => (
                      <button
                        key={item}
                        className={`h-10 rounded-xl px-3 text-left text-sm font-semibold transition ${
                          grade === item ? 'bg-campus-300 text-campus-900' : 'text-muted hover:bg-white/[0.08] hover:text-ink'
                        }`}
                        onClick={() => {
                          setGrade(item);
                          setGradeMenuOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid place-items-center">
            <motion.div
              className="w-full max-w-4xl rounded-[38px] border border-white/14 bg-white/[0.08] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_16px_44px_rgba(0,0,0,0.16)] backdrop-blur-lg md:p-10"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="text-[clamp(4.5rem,14vw,11rem)] font-black leading-none tracking-[-0.04em] text-ink tabular-nums">
                {formatClock(now)}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-muted">
                <span>{grade}</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>预计 {gaokaoDate.getFullYear()}年6月7日 09:00</span>
              </div>
            </motion.div>
          </div>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_12px_34px_rgba(0,0,0,0.1)] backdrop-blur-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted">临时记事本</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">写下今天想提醒自己的事</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-muted">
                仅当前页面显示，不会储存
              </div>
            </div>
            <textarea
              className="max-h-[220px] min-h-[150px] w-full resize-y overflow-y-auto rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-base leading-7 text-ink outline-none transition placeholder:text-white/[0.35] focus:border-campus-300/50 focus:bg-white/[0.075] focus:ring-4 focus:ring-campus-300/10"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：晚自习先整理错题；英语听力做 20 分钟；明早带实验报告。"
            />
          </section>
        </div>
      </section>
    </motion.div>
  );
}
