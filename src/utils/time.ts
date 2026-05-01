export type ExamStatus = 'before' | 'running' | 'ended';

export interface ExamSubject {
  name: string;
  date: string;
  start: string;
  end: string;
}

export interface Exam {
  id: string;
  name: string;
  origin: string;
  notice: string;
  subjects: ExamSubject[];
}

export interface SubjectResult {
  subject: ExamSubject | null;
  status: ExamStatus | 'none';
}

export function parseExamDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function getExamStatus(subject: ExamSubject, now = new Date()): ExamStatus {
  const start = parseExamDateTime(subject.date, subject.start).getTime();
  const end = parseExamDateTime(subject.date, subject.end).getTime();
  const current = now.getTime();

  if (current < start) return 'before';
  if (current <= end) return 'running';
  return 'ended';
}

export function getCurrentSubject(exam: Exam | null, now = new Date()): SubjectResult {
  if (!exam || exam.subjects.length === 0) {
    return { subject: null, status: 'none' };
  }

  const subjects = [...exam.subjects].sort(
    (a, b) => parseExamDateTime(a.date, a.start).getTime() - parseExamDateTime(b.date, b.start).getTime(),
  );

  const running = subjects.find((subject) => getExamStatus(subject, now) === 'running');
  if (running) {
    return { subject: running, status: 'running' };
  }

  const upcoming = subjects.find((subject) => parseExamDateTime(subject.date, subject.start).getTime() > now.getTime());
  if (upcoming) {
    return { subject: upcoming, status: 'before' };
  }

  return { subject: subjects[subjects.length - 1], status: 'ended' };
}

export function getProgress(subject: ExamSubject | null, now = new Date()): number {
  if (!subject) return 0;

  const start = parseExamDateTime(subject.date, subject.start).getTime();
  const end = parseExamDateTime(subject.date, subject.end).getTime();
  const current = now.getTime();

  if (current <= start) return 0;
  if (current >= end) return 100;

  return Math.min(100, Math.max(0, Math.round(((current - start) / (end - start)) * 100)));
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}小时 ${minutes}分钟 ${seconds}秒`;
}

export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}
