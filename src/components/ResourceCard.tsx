import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface ResourceCardProps {
  title: string;
  description: string;
  url: string;
  tags: string[];
  category?: string;
}

export function ResourceCard({ title, description, url, tags, category }: ResourceCardProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4 }}
    >
      <Card interactive className="flex min-h-[260px] flex-col p-5">
        {category && <Badge tone="green">{category}</Badge>}
        <h3 className="mt-5 text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <a
          className="mt-5 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl bg-campus-300 px-4 text-sm font-semibold text-campus-900 shadow-card transition hover:-translate-y-0.5 hover:bg-[#a7dbc5]"
          href={url}
          target={url === '#' ? undefined : '_blank'}
          rel="noreferrer"
        >
          打开资源
          <ExternalLink size={16} />
        </a>
      </Card>
    </motion.div>
  );
}
