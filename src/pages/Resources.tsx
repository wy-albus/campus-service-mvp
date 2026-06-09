import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  ExternalLink,
  Eye,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Square,
  Timer,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';
import dailyQuestions from '../data/dailyQuestions.json';
import words from '../data/words.json';
import { publicAsset } from '../utils/assets';

type DailyQuestion = (typeof dailyQuestions)[number];
type WordItem = (typeof words)[number];
type ToolId = 'daily-question' | 'vocabulary' | 'rollcall' | 'countdown' | 'official';

const rollcallKey = 'study-toolbox-rollcall-names';
const wordProgressKey = 'study-toolbox-words-progress';
const alarmSoundPath = publicAsset('/audio/alarm.wav');

const tools: Array<{
  id: ToolId;
  title: string;
  description: string;
  icon: LucideIcon;
  meta: string;
  featured?: boolean;
}> = [
  { id: 'daily-question', title: '每日一题', description: '每天先做一道短题，快速进入复习状态。', icon: BookOpenCheck, meta: '题库练习', featured: true },
  { id: 'vocabulary', title: '背单词', description: '短时间刷词卡，适合课间和晚自习前。', icon: BookOpenCheck, meta: '英语记忆', featured: true },
  { id: 'rollcall', title: '随机点名', description: '输入名单后随机抽取，适合课堂互动。', icon: Users, meta: '课堂互动' },
  { id: 'countdown', title: '倒计时', description: '像手机计时器一样设置时间，到点后响铃。', icon: Timer, meta: '计时器' },
  { id: 'official', title: '官方资源', description: '保留国家智慧教育平台，作为可靠公开入口。', icon: ExternalLink, meta: '备用入口' },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function randomIndex(length: number, current?: number) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  while (next === current) next = Math.floor(Math.random() * length);
  return next;
}

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((item) => String(item).padStart(2, '0')).join(':');
}

function useAlarmSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAlarm = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(alarmSoundPath);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.85;
    }
    audioRef.current.currentTime = 0;
    void audioRef.current.play().catch(() => {
      // Browser autoplay policy may block sound before user interaction.
      // The page still enters ringing state and can be stopped manually.
    });
  };

  const stopAlarm = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  };

  useEffect(() => stopAlarm, []);
  return { playAlarm, stopAlarm };
}

function ToolPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.article
      className={`rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-6 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      {children}
    </motion.article>
  );
}

function ToolTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-emerald-300/10 text-emerald-200">
        <Icon size={22} />
      </span>
      <div>
        <h2 className="text-xl font-semibold text-white/95">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/60">{description}</p>
      </div>
    </div>
  );
}

function ModuleCard({ tool, onOpen }: { tool: (typeof tools)[number]; onOpen: (id: ToolId) => void }) {
  const Icon = tool.icon;
  return (
    <button
      className={`group min-h-[220px] rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-left shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/[0.08] ${
        tool.featured ? 'lg:col-span-6' : 'lg:col-span-4'
      }`}
      onClick={() => onOpen(tool.id)}
      aria-label={`打开${tool.title}`}
    >
      <div className="flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-emerald-300/10 text-emerald-200">
            <Icon size={23} />
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/55">{tool.meta}</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white/95">{tool.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{tool.description}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
            进入工具
            <ExternalLink className="transition group-hover:translate-x-1" size={16} />
          </span>
        </div>
      </div>
    </button>
  );
}

function DailyQuestionTool() {
  const [questionIndex, setQuestionIndex] = useState(() => randomIndex(dailyQuestions.length));
  const [showAnswer, setShowAnswer] = useState(false);
  const question = dailyQuestions[questionIndex] as DailyQuestion;

  return (
    <ToolPanel>
      <ToolTitle icon={BookOpenCheck} title="每日一题" description="先做一道短题，快速进入学习状态。" />
      <div className="flex flex-wrap gap-2">
        <Badge tone="green">{question.subject}</Badge>
        <Badge tone="slate">{question.grade}</Badge>
        <Badge tone="amber">{question.difficulty}</Badge>
      </div>
      <p className="mt-6 text-xl font-semibold leading-9 text-white/90">{question.question}</p>
      {question.options && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <div className="rounded-2xl border border-white/10 bg-black/[0.15] px-4 py-3 text-sm text-white/75" key={option}>
              {option}
            </div>
          ))}
        </div>
      )}
      {showAnswer && (
        <motion.div className="mt-5 rounded-2xl border border-emerald-200/15 bg-emerald-300/10 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-semibold text-emerald-100">答案：{question.answer}</p>
          <p className="mt-2 text-sm leading-6 text-white/75">{question.analysis}</p>
        </motion.div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setShowAnswer((value) => !value)} aria-label="查看每日一题答案">
          <Eye size={17} />
          {showAnswer ? '收起答案' : '查看答案'}
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            setQuestionIndex((current) => randomIndex(dailyQuestions.length, current));
            setShowAnswer(false);
          }}
          aria-label="随机换一道每日一题"
        >
          <RefreshCw size={17} />
          换一题
        </Button>
      </div>
    </ToolPanel>
  );
}

function VocabularyTool() {
  const [wordIndex, setWordIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(() => readJson(wordProgressKey, { known: 0, unknown: 0 }));
  const [markedWordId, setMarkedWordId] = useState<string | null>(null);
  const word = words[wordIndex] as WordItem;

  useEffect(() => {
    window.localStorage.setItem(wordProgressKey, JSON.stringify(progress));
  }, [progress]);

  const nextWord = () => {
    setWordIndex((current) => (current + 1) % words.length);
    setRevealed(false);
    setMarkedWordId(null);
  };

  const mark = (type: 'known' | 'unknown') => {
    if (markedWordId !== word.id) {
      setProgress((value) => ({ ...value, [type]: value[type] + 1 }));
      setMarkedWordId(word.id);
    }
    setRevealed(true);
  };

  return (
    <ToolPanel>
      <ToolTitle icon={BookOpenCheck} title="背单词" description="短时间刷一张词卡，适合课间和晚自习前。" />
      <div className="rounded-[24px] border border-white/10 bg-black/[0.16] p-6">
        <div className="text-5xl font-semibold tracking-tight text-white/95">{word.word}</div>
        <p className="mt-3 text-sm text-emerald-100/80">{word.phonetic}</p>
        {revealed ? (
          <div className="mt-6 space-y-3">
            <p className="text-base font-semibold text-white/85">{word.meaning}</p>
            <p className="text-sm leading-6 text-white/75">{word.example}</p>
            <p className="text-sm leading-6 text-white/55">{word.translation}</p>
          </div>
        ) : (
          <Button className="mt-6" variant="secondary" onClick={() => setRevealed(true)} aria-label="显示单词释义">
            显示释义
          </Button>
        )}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => mark('known')} aria-label="标记认识这个单词并显示释义">
          <Check size={17} />
          认识
        </Button>
        <Button variant="subtle" onClick={() => mark('unknown')} aria-label="标记不认识这个单词并显示释义">
          <X size={17} />
          不认识
        </Button>
        <Button variant="ghost" onClick={nextWord} aria-label="切换到下一个单词">
          下一个
        </Button>
      </div>
      <p className="mt-4 text-xs text-white/50">已记录：认识 {progress.known} 个，不认识 {progress.unknown} 个。</p>
    </ToolPanel>
  );
}

function RollCallTool() {
  const [nameText, setNameText] = useState(() => readJson<string[]>(rollcallKey, []).join('\n'));
  const [picked, setPicked] = useState('');
  const [saved, setSaved] = useState(false);
  const names = useMemo(() => nameText.split(/[\s,，、;；]+/).map((name) => name.trim()).filter(Boolean), [nameText]);

  const saveNames = () => {
    window.localStorage.setItem(rollcallKey, JSON.stringify(names));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <ToolPanel>
      <ToolTitle icon={Users} title="随机点名" description="输入名单后随机抽取，适合课堂互动。" />
      <textarea
        className="min-h-[220px] w-full resize-y rounded-[22px] border border-white/10 bg-black/[0.18] p-4 text-sm leading-7 text-white/85 outline-none placeholder:text-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md focus:border-emerald-200/40 focus:bg-black/[0.24] focus:ring-4 focus:ring-emerald-200/10"
        value={nameText}
        onChange={(event) => {
          setNameText(event.target.value);
          setPicked('');
        }}
        placeholder="一行一个名字，也可以用逗号或空格分隔"
        aria-label="随机点名学生名单"
      />
      {picked && (
        <motion.div className="mt-4 rounded-3xl border border-emerald-200/20 bg-emerald-300/10 p-5 text-center" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <p className="text-sm text-white/55">本次抽到</p>
          <p className="mt-1 text-4xl font-semibold text-emerald-100">{picked}</p>
        </motion.div>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={saveNames} aria-label="保存随机点名名单">
          {saved ? '已保存' : '保存名单'}
        </Button>
        <Button disabled={names.length === 0} onClick={() => names.length > 0 && setPicked(names[Math.floor(Math.random() * names.length)])} aria-label="开始随机点名">
          <Shuffle size={17} />
          开始随机
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            setNameText('');
            setPicked('');
            window.localStorage.removeItem(rollcallKey);
          }}
          aria-label="清空随机点名名单"
        >
          清空名单
        </Button>
      </div>
      <p className="mt-4 text-xs text-white/50">
        当前名单：{names.length} 人{names.length === 0 ? '。请先输入姓名。' : '。'}
      </p>
    </ToolPanel>
  );
}

function CountdownTool() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(50);
  const [duration, setDuration] = useState(50);
  const [remaining, setRemaining] = useState(50);
  const [running, setRunning] = useState(false);
  const [ringing, setRinging] = useState(false);
  const { playAlarm, stopAlarm } = useAlarmSound();

  const selectedSeconds = Math.max(0, hours * 3600 + minutes * 60 + seconds);
  const progress = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;
  const circumference = 2 * Math.PI * 118;

  useEffect(() => {
    if (!running || ringing) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setRinging(true);
          playAlarm();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playAlarm, ringing, running]);

  const applyDuration = (nextSeconds: number) => {
    const safe = Math.max(0, nextSeconds);
    setDuration(safe);
    setRemaining(safe);
    setRunning(false);
    setRinging(false);
    stopAlarm();
  };

  const startTimer = () => {
    const nextDuration = remaining > 0 ? remaining : selectedSeconds;
    if (nextDuration <= 0) return;
    setDuration((value) => (remaining > 0 && value > 0 ? value : nextDuration));
    setRemaining(nextDuration);
    setRinging(false);
    setRunning(true);
  };

  const stopRinging = () => {
    stopAlarm();
    setRinging(false);
    setRunning(false);
    setRemaining(duration || selectedSeconds);
  };

  return (
    <ToolPanel className={ringing ? 'ring-2 ring-amberSoft/60' : ''}>
      <ToolTitle icon={Timer} title="倒计时" description="设置一段学习时间，到点后会响铃，像手机计时器一样手动关闭。" />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:items-center">
        <div className="grid place-items-center">
          <div className="relative h-[300px] w-[300px]">
            <svg className="-rotate-90" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="118" stroke="rgba(255,255,255,0.12)" strokeWidth="18" fill="rgba(0,0,0,0.18)" />
              <circle
                cx="150"
                cy="150"
                r="118"
                stroke={ringing ? '#E7B56B' : '#8BC9B0'}
                strokeWidth="18"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-sm font-semibold text-white/50">{ringing ? '时间到' : running ? '正在倒计时' : '准备开始'}</p>
                <p className="mt-2 text-5xl font-semibold tabular-nums text-white/95">{formatDuration(remaining)}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          {ringing ? (
            <motion.div className="rounded-[28px] border border-amberSoft/30 bg-amberSoft/15 p-6 text-center" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p className="text-lg font-semibold text-white/95">倒计时结束，铃声正在响起。</p>
              <Button className="mt-5" onClick={stopRinging} aria-label="关闭倒计时响铃">
                <Square size={17} />
                关闭倒计时
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">小时</span>
                  <Input type="number" min={0} value={hours} onChange={(event) => setHours(Number(event.target.value))} aria-label="倒计时小时" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">分钟</span>
                  <Input type="number" min={0} max={59} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} aria-label="倒计时分钟" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-white/55">秒</span>
                  <Input type="number" min={0} max={59} value={seconds} onChange={(event) => setSeconds(Number(event.target.value))} aria-label="倒计时秒数" />
                </label>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[0, 3, 5, 10, 15, 30].map((item) => (
                  <button
                    key={item}
                    className="rounded-full border border-white/10 bg-black/[0.20] px-4 py-4 text-center font-semibold text-white/85 transition hover:bg-white/[0.12]"
                    onClick={() => {
                      setHours(0);
                      setMinutes(item);
                      setSeconds(0);
                      applyDuration(item * 60);
                    }}
                    aria-label={`设置${item}分钟倒计时`}
                  >
                    <span className="block text-xl">{item}</span>
                    <span className="text-xs text-white/55">分钟</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Button onClick={running ? () => setRunning(false) : startTimer} aria-label={running ? '暂停倒计时' : '开始倒计时'} size="lg">
                  {running ? <Pause size={18} /> : <Play size={18} />}
                  {running ? '暂停' : '开始'}
                </Button>
                <Button variant="secondary" onClick={() => applyDuration(selectedSeconds || duration)} aria-label="重置倒计时" size="lg">
                  <RotateCcw size={18} />
                  重置
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolPanel>
  );
}

function OfficialResourceTool() {
  return (
    <ToolPanel>
      <ToolTitle icon={ExternalLink} title="官方资源" description="低频但可靠的公开学习入口，放在这里备用。" />
      <div className="rounded-[24px] border border-white/10 bg-black/[0.14] p-5">
        <h3 className="text-xl font-semibold text-white/95">国家智慧教育平台</h3>
        <p className="mt-3 text-sm leading-6 text-white/70">提供课程学习、专题教育、数字教材等公开学习资源。</p>
        <a href="https://www.smartedu.cn/" target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-campus-300 px-4 text-sm font-semibold text-campus-900 transition hover:-translate-y-0.5 hover:bg-[#a7dbc5]">
          打开平台
          <ExternalLink size={16} />
        </a>
      </div>
    </ToolPanel>
  );
}

function renderTool(id: ToolId) {
  switch (id) {
    case 'daily-question':
      return <DailyQuestionTool />;
    case 'vocabulary':
      return <VocabularyTool />;
    case 'rollcall':
      return <RollCallTool />;
    case 'countdown':
      return <CountdownTool />;
    case 'official':
      return <OfficialResourceTool />;
    default:
      return null;
  }
}

export function Resources() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const activeMeta = tools.find((tool) => tool.id === activeTool);

  if (activeTool && activeMeta) {
    const Icon = activeMeta.icon;
    return (
      <motion.div className="mx-auto max-w-5xl space-y-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-6">
          <Button variant="subtle" onClick={() => setActiveTool(null)} aria-label="返回学习工具箱">
            <ArrowLeft size={17} />
            返回工具箱
          </Button>
          <div className="mt-5 flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-emerald-300/10 text-emerald-200">
              <Icon size={24} />
            </span>
            <div>
              <Badge tone="green">{activeMeta.meta}</Badge>
              <h1 className="mt-3 text-3xl font-semibold text-white/95 md:text-5xl">{activeMeta.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{activeMeta.description}</p>
            </div>
          </div>
        </div>
        {renderTool(activeTool)}
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <SectionHeader eyebrow="Study Toolbox" title="学习工具箱" description="把常用学习工具集中在这里，点击模块进入对应页面使用。" />

      <section className="grid gap-5 lg:grid-cols-12">
        {tools.map((tool) => (
          <ModuleCard key={tool.id} tool={tool} onOpen={setActiveTool} />
        ))}
      </section>
    </motion.div>
  );
}
