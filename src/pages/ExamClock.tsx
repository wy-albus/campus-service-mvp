import { Expand, Play, RotateCcw, Settings2, TimerReset } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BackgroundSwitcher, clockBackgrounds } from '../components/BackgroundSwitcher';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { GlassPanel } from '../components/ui/GlassPanel';
import { Input } from '../components/ui/Input';
import examsData from '../data/exams.json';
import type { Exam, ExamSubject } from '../utils/time';
import {
  formatClock,
  formatDate,
  formatDuration,
  getCurrentSubject,
  getProgress,
  parseExamDateTime,
} from '../utils/time';

const exams = examsData as Exam[];

interface PracticeForm {
  name: string;
  date: string;
  start: string;
  end: string;
}

const today = new Date().toISOString().slice(0, 10);

export function ExamClock() {
  const [now, setNow] = useState(new Date());
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id ?? '');
  const [backgroundId, setBackgroundId] = useState(clockBackgrounds[0].id);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practice, setPractice] = useState<PracticeForm>(() => {
    const saved = window.localStorage.getItem('campus-practice');
    return saved ? JSON.parse(saved) : { name: '临时限时训练', date: today, start: '19:00', end: '21:00' };
  });
  const [practiceSubject, setPracticeSubject] = useState<ExamSubject | null>(() => {
    const saved = window.localStorage.getItem('campus-practice-subject');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('campus-practice', JSON.stringify(practice));
  }, [practice]);

  const selectedExam = useMemo(() => exams.find((exam) => exam.id === selectedExamId) ?? null, [selectedExamId]);

  const activeExam: Exam | null = practiceSubject
    ? {
        id: 'practice',
        name: '临时限时训练',
        origin: '本地临时设置',
        notice: '临时训练仅保存在当前浏览器，不代表学校正式安排。',
        subjects: [practiceSubject],
      }
    : selectedExam;

  const current = getCurrentSubject(activeExam, now);
  const progress = getProgress(current.subject, now);
  const background = clockBackgrounds.find((item) => item.id === backgroundId) ?? clockBackgrounds[0];
  const statusText = getStatusText(current.subject, current.status, now);
  const nextSubject = getNextSubject(activeExam, current.subject, now);

  const handlePracticeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = {
      name: practice.name.trim() || '临时限时训练',
      date: practice.date,
      start: practice.start,
      end: practice.end,
    };
    setPracticeSubject(subject);
    window.localStorage.setItem('campus-practice-subject', JSON.stringify(subject));
    setPracticeOpen(false);
  };

  const clearPractice = () => {
    setPracticeSubject(null);
    window.localStorage.removeItem('campus-practice-subject');
  };

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen?.();
  };

  return (
    <motion.div
      className="overflow-hidden rounded-[36px] border border-white/12 shadow-soft"
      style={{
        background: `linear-gradient(135deg, rgba(8,21,19,0.88), rgba(8,21,19,0.62)), ${background.value}`,
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="grid min-h-[calc(100vh-150px)] grid-rows-[auto_1fr_auto] gap-5 p-4 md:p-6 lg:p-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="green">Exam Clock System</Badge>
            <h1 className="mt-4 text-4xl font-semibold text-ink md:text-6xl">考试时钟</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
              用于教室大屏、自习训练和考试倒计时。页面仅作学习服务参考，请以学校实际铃声和老师通知为准。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-white/12 bg-white/[0.07] p-3 backdrop-blur-2xl">
            <label className="grid gap-1 text-xs font-semibold text-muted">
              考试类型
              <select
                className="select-input min-w-[180px]"
                value={selectedExamId}
                onChange={(event) => {
                  setSelectedExamId(event.target.value);
                  clearPractice();
                }}
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </label>
            <BackgroundSwitcher activeId={backgroundId} onChange={setBackgroundId} />
            <Button variant="secondary" size="icon" onClick={() => setPracticeOpen(true)} title="临时训练">
              <Settings2 size={18} />
            </Button>
            <Button variant="secondary" size="icon" onClick={requestFullscreen} title="全屏显示">
              <Expand size={18} />
            </Button>
          </div>
        </section>

        <section className="grid place-items-center py-6">
          <GlassPanel as="article" className="w-full max-w-5xl p-6 text-center md:p-10 lg:p-12">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-muted">
              <TimerReset size={16} />
              {activeExam?.name ?? '当前无考试安排'}
            </div>
            <h2 className="text-5xl font-semibold text-ink md:text-7xl lg:text-8xl">{current.subject?.name ?? '当前无考试安排'}</h2>
            <p className="mt-5 text-lg font-semibold text-campus-300 md:text-2xl">{statusText}</p>
            <div className="mt-8 text-[clamp(4.8rem,14vw,12rem)] font-black leading-none tracking-[-0.05em] text-ink tabular-nums">
              {formatClock(now)}
            </div>
            <p className="mt-4 text-base text-muted">{formatDate(now)}</p>
            <div className="mx-auto mt-8 max-w-4xl">
              <ProgressBar value={progress} />
            </div>
          </GlassPanel>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <InfoCard label="开始时间" value={current.subject ? `${current.subject.date} ${current.subject.start}` : '--'} />
          <InfoCard label="结束时间" value={current.subject ? `${current.subject.date} ${current.subject.end}` : '--'} />
          <InfoCard label="数据来源" value={activeExam?.origin ?? '--'} />
          <InfoCard
            label="下一场"
            value={nextSubject ? `${nextSubject.name} · ${nextSubject.date} ${nextSubject.start}` : '暂无后续安排'}
          />
        </section>

        <div className="rounded-[24px] border border-white/12 bg-white/[0.06] px-5 py-4 text-sm leading-6 text-muted backdrop-blur-xl">
          {activeExam?.notice ?? '当前无考试安排。'} 请以学校实际铃声和老师通知为准。
        </div>
      </div>

      <Dialog
        open={practiceOpen}
        title="临时限时训练"
        description="临时训练只保存在当前浏览器，用于自习、模拟答题或限时练习。"
        onClose={() => setPracticeOpen(false)}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePracticeSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-muted md:col-span-2">
            科目名称
            <Input
              value={practice.name}
              onChange={(event) => setPractice({ ...practice, name: event.target.value })}
              placeholder="例如：数学限时训练"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-muted">
            日期
            <Input type="date" value={practice.date} onChange={(event) => setPractice({ ...practice, date: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-muted">
            开始时间
            <Input type="time" value={practice.start} onChange={(event) => setPractice({ ...practice, start: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-muted">
            结束时间
            <Input type="time" value={practice.end} onChange={(event) => setPractice({ ...practice, end: event.target.value })} />
          </label>
          <div className="flex flex-wrap items-end gap-3 md:col-span-2">
            <Button type="submit">
              <Play size={17} />
              开始临时计时
            </Button>
            <Button variant="secondary" type="button" onClick={clearPractice}>
              <RotateCcw size={17} />
              恢复考试安排
            </Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/[0.07] p-5 backdrop-blur-2xl">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function getStatusText(subject: ExamSubject | null, status: string, now: Date): string {
  if (!subject || status === 'none') {
    return '当前无考试安排';
  }

  const start = parseExamDateTime(subject.date, subject.start);
  const end = parseExamDateTime(subject.date, subject.end);

  if (status === 'before') {
    return `距离开始还有 ${formatDuration(start.getTime() - now.getTime())}`;
  }

  if (status === 'running') {
    return `距离结束还有 ${formatDuration(end.getTime() - now.getTime())}`;
  }

  return '本场考试已结束';
}

function getNextSubject(exam: Exam | null, current: ExamSubject | null, now: Date) {
  if (!exam) return null;
  const subjects = [...exam.subjects].sort(
    (a, b) => parseExamDateTime(a.date, a.start).getTime() - parseExamDateTime(b.date, b.start).getTime(),
  );
  return (
    subjects.find((subject) => {
      if (current && subject.name === current.name && subject.date === current.date && subject.start === current.start) {
        return false;
      }
      return parseExamDateTime(subject.date, subject.start).getTime() > now.getTime();
    }) ?? null
  );
}
