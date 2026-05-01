import { CalendarDays, Clock3 } from 'lucide-react';

interface ClockCardProps {
  title: string;
  date: string;
  time: string;
}

export function ClockCard({ title, date, time }: ClockCardProps) {
  return (
    <section className="clock-card">
      <div>
        <p className="eyebrow">{title}</p>
        <h2>{time}</h2>
      </div>
      <div className="clock-meta">
        <span>
          <CalendarDays size={17} />
          {date}
        </span>
        <span>
          <Clock3 size={17} />
          实时更新
        </span>
      </div>
    </section>
  );
}
