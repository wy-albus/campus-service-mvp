import { Image, Palette } from 'lucide-react';
import { cn } from './ui/utils';

export const clockBackgrounds = [
  {
    id: 'morning',
    name: '晨光校园',
    value: 'linear-gradient(135deg, rgba(219, 234, 254, 0.92) 0%, rgba(254, 243, 199, 0.88) 45%, rgba(220, 252, 231, 0.9) 100%)',
  },
  {
    id: 'library',
    name: '静谧图书馆',
    value: 'linear-gradient(135deg, rgba(248, 250, 252, 0.94) 0%, rgba(191, 219, 254, 0.86) 48%, rgba(134, 239, 172, 0.78) 100%)',
  },
  {
    id: 'sunset',
    name: '校园晚霞',
    value: 'linear-gradient(135deg, rgba(254, 215, 170, 0.88) 0%, rgba(254, 249, 195, 0.84) 48%, rgba(186, 230, 253, 0.82) 100%)',
  },
];

interface BackgroundSwitcherProps {
  activeId: string;
  onChange: (id: string) => void;
}

export function BackgroundSwitcher({ activeId, onChange }: BackgroundSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.08] px-3 py-2 text-muted">
      <Palette size={16} />
      {clockBackgrounds.map((item) => (
        <button
          className={cn(
            'h-7 w-7 rounded-full border-2 border-white/70 shadow-sm transition hover:scale-105',
            activeId === item.id && 'ring-2 ring-campus-300/70 ring-offset-2 ring-offset-campus-900',
          )}
          key={item.id}
          onClick={() => onChange(item.id)}
          title={item.name}
          aria-label={`切换到${item.name}背景`}
          style={{ background: item.value }}
        />
      ))}
      <Image size={16} />
    </div>
  );
}
