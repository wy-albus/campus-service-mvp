import { BookOpen, Eye, EyeOff, GraduationCap, History, Home, Info, Menu, MessagesSquare, X } from 'lucide-react';
import { useState } from 'react';
import type { PageId } from '../App';
import { Button } from './ui/Button';
import { cn } from './ui/utils';

const navItems: Array<{ id: PageId; label: string; icon: typeof Home }> = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'resources', label: '学习资源', icon: BookOpen },
  { id: 'gallery', label: '大学经验馆', icon: GraduationCap },
  { id: 'forum', label: '论坛', icon: MessagesSquare },
  { id: 'changelog', label: '更新日志', icon: History },
  { id: 'about', label: '关于本站', icon: Info },
];

interface NavbarProps {
  activePage: PageId;
  contentHidden: boolean;
  onNavigate: (page: PageId) => void;
  onToggleContent: () => void;
}

export function Navbar({ activePage, contentHidden, onNavigate, onToggleContent }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="nav-shell">
      <button
        className="flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-white/[0.08]"
        onClick={() => handleNavigate('home')}
        aria-label="返回首页"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-campus-300 text-base font-black text-campus-900 shadow-hairline">
          学
        </span>
        <span className="hidden min-w-0 sm:block">
          <strong className="block truncate text-sm font-semibold text-ink">XX 学校</strong>
          <small className="block text-xs text-muted">Study Service</small>
        </span>
      </button>

      <Button className="ml-auto lg:hidden" variant="secondary" size="icon" onClick={() => setOpen((value) => !value)}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </Button>

      <nav
        className={cn(
          'absolute left-3 right-3 top-[72px] hidden flex-col gap-1 rounded-3xl border border-white/10 bg-campus-900/55 p-2 shadow-soft backdrop-blur-xl lg:static lg:flex lg:flex-row lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none',
          open && 'flex',
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-semibold text-muted transition hover:bg-white/[0.08] hover:text-ink',
                active && 'bg-white/[0.12] text-ink',
              )}
              onClick={() => handleNavigate(item.id)}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
        <button
          className="inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-semibold text-muted transition hover:bg-white/[0.08] hover:text-ink"
          onClick={onToggleContent}
        >
          {contentHidden ? <Eye size={17} /> : <EyeOff size={17} />}
          {contentHidden ? '显示内容' : '隐藏内容'}
        </button>
      </nav>
    </header>
  );
}
