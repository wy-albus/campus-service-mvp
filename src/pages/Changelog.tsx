import { GitCommitHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/Badge';
import { SectionHeader } from '../components/ui/SectionHeader';
import changelog from '../data/changelog.json';

export function Changelog() {
  return (
    <motion.div className="mx-auto max-w-5xl space-y-8" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <SectionHeader eyebrow="Changelog" title="更新日志" description="这里记录站点每一次重要变化。更新内容来自 src/data/changelog.json。" />

      <section className="relative space-y-6 pl-8 md:pl-12">
        <div className="absolute bottom-0 left-3 top-0 w-px bg-white/20 md:left-5" />
        {changelog.map((item, index) => (
          <motion.article
            className="relative"
            key={`${item.date}-${index}`}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.04 }}
          >
            <div className="absolute -left-[31px] top-6 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-[#10231f]/82 shadow-[0_8px_20px_rgba(0,0,0,0.18)] backdrop-blur-md md:-left-[43px]">
              <GitCommitHorizontal size={15} className={index === 0 ? 'text-campus-300' : 'text-white/80'} />
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div className="flex flex-wrap items-center gap-3">
                <time className="rounded-full bg-white/[0.08] px-3 py-1 text-sm font-semibold text-white/55 backdrop-blur-sm">{item.date}</time>
                {index === 0 && <Badge tone="green">最新</Badge>}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white/95">{item.lead}</h2>
              <p className="mt-3 rounded-2xl bg-black/12 px-4 py-3 text-base font-medium leading-7 text-white/75 backdrop-blur-sm">{item.text}</p>
            </div>
          </motion.article>
        ))}
      </section>
    </motion.div>
  );
}
