import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, Lock, Mail, MessageSquare, RotateCcw, Save, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';

type AboutContent = {
  intro: string;
  contact: string;
  feedback: string;
};

const STORAGE_KEY = 'about-page-content';

const defaultAboutContent: AboutContent = {
  intro:
    '本站是一个面向学生的校园学习服务页面，整合高考倒计时、学习资源、校园图库、更新日志和信息说明等内容，帮助同学们更高效地获取学习与校园相关信息。',
  contact:
    '如需联系站点维护者，可以通过学校社群、班级群或页面预留的联系方式进行反馈。后续可在此处补充邮箱、QQ 群、微信群或其他联系方式。',
  feedback:
    '如果你在使用过程中发现页面显示异常、资源链接失效、内容需要补充，欢迎提交反馈。我们会根据同学们的建议持续优化本站内容。',
};

// Demo only: front-end hardcoded credentials are not secure.
// A real production site should verify admins through a backend API, database, and token/session system.
const adminUsername = 'admin';
const adminPassword = '123456';

const sections = [
  { id: 'intro', label: '介绍', icon: Info, key: 'intro' },
  { id: 'contact', label: '联系', icon: Mail, key: 'contact' },
  { id: 'feedback', label: '反馈', icon: MessageSquare, key: 'feedback' },
] as const;

function readStoredContent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultAboutContent;
    }

    const parsed = JSON.parse(raw) as Partial<AboutContent>;
    return {
      intro: parsed.intro || defaultAboutContent.intro,
      contact: parsed.contact || defaultAboutContent.contact,
      feedback: parsed.feedback || defaultAboutContent.feedback,
    };
  } catch {
    return defaultAboutContent;
  }
}

export function About() {
  const [showContent, setShowContent] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [aboutContent, setAboutContent] = useState<AboutContent>(defaultAboutContent);
  const [draftContent, setDraftContent] = useState<AboutContent>(defaultAboutContent);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const storedContent = readStoredContent();
    setAboutContent(storedContent);
    setDraftContent(storedContent);
  }, []);

  const scrollToSection = (id: string) => {
    if (!showContent) {
      setShowContent(true);
    }

    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, showContent ? 0 : 180);
  };

  const openAdmin = () => {
    setShowAdminModal(true);
    setAuthMessage('');
    setSaveMessage('');
  };

  const closeAdmin = () => {
    setShowAdminModal(false);
    setCredentials({ username: '', password: '' });
    setAuthMessage('');
    setSaveMessage('');
  };

  const verifyAdmin = () => {
    if (credentials.username === adminUsername && credentials.password === adminPassword) {
      setIsAdminVerified(true);
      setDraftContent(aboutContent);
      setAuthMessage('验证通过');
      return;
    }

    setAuthMessage('账号或密码不正确');
  };

  const saveContent = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftContent));
    setAboutContent(draftContent);
    setSaveMessage('修改已保存');
  };

  const resetContent = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAboutContent(defaultAboutContent);
    setDraftContent(defaultAboutContent);
    setSaveMessage('已恢复默认内容');
  };

  const exitAdmin = () => {
    setIsAdminVerified(false);
    closeAdmin();
  };

  return (
    <motion.div className="relative min-h-[calc(100vh-140px)]" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <aside className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-white/[0.045] p-2 shadow-[0_16px_46px_rgba(0,0,0,0.22)] backdrop-blur-xl md:bottom-auto md:left-5 md:top-1/2 md:-translate-x-0 md:-translate-y-1/2 md:flex-col">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="group flex h-11 w-11 items-center justify-start overflow-hidden rounded-full border border-white/10 bg-black/25 px-3 text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:w-24 hover:bg-white/[0.12] hover:text-white"
              onClick={() => scrollToSection(item.id)}
              aria-label={`跳转到${item.label}`}
            >
              <Icon className="shrink-0" size={18} />
              <span className="ml-2 whitespace-nowrap text-sm font-semibold text-white/90 opacity-0 transition duration-200 group-hover:opacity-100">{item.label}</span>
            </button>
          );
        })}
        <button
          className="group flex h-11 w-11 items-center justify-start overflow-hidden rounded-full border border-white/10 bg-black/25 px-3 text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:w-28 hover:bg-white/[0.12] hover:text-white"
          onClick={openAdmin}
          aria-label="打开管理员验证"
        >
          <Shield className="shrink-0" size={18} />
          <span className="ml-2 whitespace-nowrap text-sm font-semibold text-white/90 opacity-0 transition duration-200 group-hover:opacity-100">管理员</span>
        </button>
      </aside>

      <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-6xl flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          {!showContent ? (
            <motion.div
              key="hidden"
              className="grid min-h-[54vh] place-items-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <button
                className="rounded-full border border-white/10 bg-white/[0.045] px-7 py-4 text-base font-semibold text-white/90 shadow-[0_18px_54px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.12]"
                onClick={() => setShowContent(true)}
                aria-label="显示关于本站内容"
              >
                显示内容
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="space-y-6 pb-20 md:pb-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.28 }}
            >
              <div className="flex flex-wrap items-end justify-between gap-4 rounded-[32px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-8">
                <div>
                  <Badge tone="green">About</Badge>
                  <h1 className="mt-4 text-3xl font-semibold leading-tight text-white/95 md:text-5xl">关于本站</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                    这里集中说明本站的定位、联系入口和反馈方式。内容支持本地编辑保存，适合先作为静态 MVP 使用。
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setShowContent(false)} aria-label="隐藏关于本站内容">
                  <X size={17} />
                  隐藏内容
                </Button>
              </div>

              <section className="grid gap-5">
                {sections.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.article
                      id={item.id}
                      key={item.id}
                      className="scroll-mt-28 rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-7"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.32, delay: index * 0.04 }}
                    >
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-emerald-300/10 text-emerald-200 backdrop-blur-lg">
                            <Icon size={22} />
                          </span>
                          <h2 className="text-2xl font-semibold text-white/95">{item.label}</h2>
                        </div>
                        <span className="text-sm font-semibold text-emerald-200/45">0{index + 1}</span>
                      </div>
                      <p className="max-w-4xl whitespace-pre-wrap text-sm leading-7 text-white/75 md:text-base">{aboutContent[item.key]}</p>
                    </motion.article>
                  );
                })}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={showAdminModal}
        title={isAdminVerified ? '页面内容编辑面板' : '管理员验证'}
        description={
          isAdminVerified
            ? '修改会保存到当前浏览器的 localStorage 中，刷新页面后仍会保留。'
            : '当前项目是纯前端 demo，验证仅用于演示编辑流程。'
        }
        onClose={closeAdmin}
      >
        {!isAdminVerified ? (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/90">管理员账号</span>
              <Input
                value={credentials.username}
                onChange={(event) => setCredentials((value) => ({ ...value, username: event.target.value }))}
                placeholder="请输入管理员账号"
                aria-label="管理员账号"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/90">管理员密码</span>
              <Input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((value) => ({ ...value, password: event.target.value }))}
                placeholder="请输入管理员密码"
                aria-label="管理员密码"
              />
            </label>
            {authMessage && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white/90">
                {authMessage === '验证通过' ? <CheckCircle2 size={17} className="text-campus-300" /> : <Lock size={17} className="text-amberSoft" />}
                {authMessage}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={closeAdmin} aria-label="取消管理员验证">
                取消
              </Button>
              <Button onClick={verifyAdmin} aria-label="验证管理员账号密码">
                验证
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {sections.map((item) => (
              <label className="block" key={item.key}>
                <span className="mb-2 block text-sm font-semibold text-white/90">{item.label}内容</span>
                <textarea
                  className="min-h-[120px] w-full resize-y rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-white/90 outline-none transition placeholder:text-white/[0.35] focus:border-campus-300/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-campus-300/10"
                  value={draftContent[item.key]}
                  onChange={(event) => setDraftContent((value) => ({ ...value, [item.key]: event.target.value }))}
                  aria-label={`${item.label}内容`}
                />
              </label>
            ))}
            {saveMessage && <p className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-campus-300">{saveMessage}</p>}
            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="subtle" onClick={exitAdmin} aria-label="退出管理员模式">
                退出管理员模式
              </Button>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={resetContent} aria-label="重置默认内容">
                  <RotateCcw size={17} />
                  重置默认内容
                </Button>
                <Button onClick={saveContent} aria-label="保存关于本站内容修改">
                  <Save size={17} />
                  保存修改
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </motion.div>
  );
}
