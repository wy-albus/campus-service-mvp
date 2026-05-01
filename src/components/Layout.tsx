import { Eye, EyeOff } from 'lucide-react';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { PageId } from '../App';
import backgrounds from '../data/backgrounds.json';
import { AtmosphereBackground } from './AtmosphereBackground';
import { Navbar } from './Navbar';
import { Button } from './ui/Button';

interface LayoutProps {
  activePage: PageId;
  children: ReactNode;
  onNavigate: (page: PageId) => void;
}

export function Layout({ activePage, children, onNavigate }: LayoutProps) {
  const [contentHidden, setContentHidden] = useState(false);
  const backgroundImage = useMemo(() => {
    const candidates = backgrounds.filter((item) => item.path && !item.path.toLowerCase().endsWith('/badge.webp'));
    const fallback = '/photo/declan-sun-9WvJsfdqjSc-unsplash.jpg';
    if (candidates.length === 0) {
      return fallback;
    }

    return candidates[Math.floor(Math.random() * candidates.length)].path;
  }, []);

  const shellStyle = {
    '--app-background-image': `url("${backgroundImage}")`,
  } as CSSProperties;

  return (
    <div className={contentHidden ? 'app-shell content-hidden' : 'app-shell'} style={shellStyle}>
      <div className="app-background-stack" aria-hidden="true">
        <img className="app-background-image" src={backgroundImage} alt="" />
        <div className="app-background-tint" />
        <div className="app-background-light" />
        <div className="app-background-vignette" />
      </div>
      <AtmosphereBackground />
      <div className="content-layer pt-4">
        <Navbar
          activePage={activePage}
          contentHidden={contentHidden}
          onNavigate={onNavigate}
          onToggleContent={() => setContentHidden((value) => !value)}
        />
        {!contentHidden && <main className="page-container">{children}</main>}
        {!contentHidden && (
          <footer className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-3 px-4 pb-8 text-sm text-muted sm:px-6 lg:px-8">
            <span>校园学习服务 MVP</span>
            <span>高考倒计时和作息安排仅供参考，请以学校官方通知和老师通知为准。</span>
          </footer>
        )}
      </div>

      {contentHidden ? (
        <Button className="restore-content-button" variant="secondary" onClick={() => setContentHidden(false)}>
          <Eye size={18} />
          显示内容
        </Button>
      ) : (
        <Button className="hide-content-fab" variant="secondary" size="icon" onClick={() => setContentHidden(true)} title="隐藏内容">
          <EyeOff size={18} />
        </Button>
      )}
    </div>
  );
}
