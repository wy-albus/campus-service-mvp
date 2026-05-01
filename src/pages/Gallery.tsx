import { ImagePlus, Layers, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Toast } from '../components/ui/Toast';
import gallery from '../data/gallery.json';

export function Gallery() {
  const [toast, setToast] = useState(false);

  const handleSetBackground = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 1800);
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <SectionHeader
        eyebrow="Gallery"
        title="校园图库素材库"
        description="当前使用高级渐变占位，后续可替换为真实授权校园照片，用于图库展示和考试时钟背景。"
        action={
          <div className="hidden rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-muted backdrop-blur-xl md:flex md:items-center md:gap-2">
            <Layers size={16} />
            {gallery.length} 个素材
          </div>
        }
      />

      <motion.section
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {gallery.map((item) => (
          <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
            <Card interactive className="overflow-hidden">
              <div className="relative grid min-h-[230px] place-items-center" style={{ background: item.image }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.42),transparent_30%),linear-gradient(180deg,transparent,rgba(8,21,19,0.22))]" />
                <div className="relative grid h-16 w-16 place-items-center rounded-3xl border border-white/40 bg-white/25 text-campus-900 backdrop-blur-md">
                  <ImagePlus size={30} />
                </div>
              </div>
              <div className="p-5">
                <Badge tone="amber">{item.license}</Badge>
                <h2 className="mt-4 text-xl font-semibold text-ink">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
                <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted">
                  <span>{item.author}</span>
                  <Palette size={16} />
                </div>
                <Button className="mt-5 w-full" variant="secondary" onClick={handleSetBackground}>
                  设为时钟背景
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.section>
      <Toast visible={toast} message="已记录背景选择入口，后续可接入真实背景同步。" />
    </motion.div>
  );
}
