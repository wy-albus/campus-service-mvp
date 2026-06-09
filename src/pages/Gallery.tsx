import { ArrowLeft, Building2, GraduationCap, MapPin, MessageSquare, Plus, Send, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { apiRequest, type ForumUser } from '../lib/api';
import seedUniversities from '../data/universities.json';
import { publicAsset } from '../utils/assets';

type UniversityArea = {
  id: number | string;
  name: string;
  city: string;
  description: string;
  highlights?: string[];
  cover?: string;
  postCount: number;
};

type Post = {
  id: number;
  title: string;
  content: string;
  tag: string;
  imageUrl?: string | null;
  university?: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: { id: number; username: string; role: 'USER' | 'ADMIN' };
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; username: string; role: 'USER' | 'ADMIN' };
};

const seedAreas = seedUniversities as UniversityArea[];
const emptyAreaForm = { name: '', city: '', description: '' };
const emptyPostForm = { title: '', content: '', imageUrl: '' };

const universityLogos: Record<string, string> = {
  '\u7535\u5b50\u79d1\u6280\u5927\u5b66': publicAsset('/logos/universities/uestc.png'),
  '\u5b89\u5fbd\u5927\u5b66': publicAsset('/logos/universities/ahu.png'),
  '\u6e05\u534e\u5927\u5b66': publicAsset('/logos/universities/tsinghua.png'),
  '\u5317\u4eac\u5927\u5b66': publicAsset('/logos/universities/pku.png'),
  '\u897f\u5b89\u4ea4\u901a\u5927\u5b66': publicAsset('/logos/universities/xjtu.png'),
  '\u56db\u5ddd\u5927\u5b66': publicAsset('/logos/universities/scu.png'),
};

function getUniversityLogo(name: string) {
  const compactName = name.replace(/\s/g, '');
  return Object.entries(universityLogos).find(([key]) => compactName.includes(key))?.[1];
}

function panelClass(className = '') {
  return `rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl ${className}`;
}

function lightPanelClass(className = '') {
  return `rounded-[26px] border border-slate-200/80 bg-white/[0.92] text-slate-950 shadow-[0_18px_48px_rgba(0,0,0,0.16)] backdrop-blur-md ${className}`;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function excerpt(value: string, length = 92) {
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

export function Gallery() {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [areas, setAreas] = useState<UniversityArea[]>(seedAreas);
  const [selectedArea, setSelectedArea] = useState<UniversityArea | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<(Post & { comments: Comment[] }) | null>(null);
  const [commentText, setCommentText] = useState('');
  const [areaModalOpen, setAreaModalOpen] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [areaForm, setAreaForm] = useState(emptyAreaForm);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [feedback, setFeedback] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);

  const mergedAreas = useMemo(() => {
    const dynamicNames = new Set(areas.map((area) => area.name));
    const merged = [...areas];
    seedAreas.forEach((area) => {
      if (!dynamicNames.has(area.name)) merged.push(area);
    });
    return merged;
  }, [areas]);

  const loadUser = async () => {
    try {
      const data = await apiRequest<{ user: ForumUser }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  const loadAreas = async () => {
    try {
      const data = await apiRequest<{ items: UniversityArea[] }>('/universities');
      const remote = data.items.map((area, index) => ({
        ...area,
        cover: seedAreas[index % seedAreas.length]?.cover,
        highlights: ['大学生活', '专业体验', '报考建议'],
      }));
      if (remote.length) setAreas(remote);
    } catch {
      setAreas(seedAreas);
    }
  };

  const loadPosts = async (areaName: string) => {
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams({ tag: '经验分享', university: areaName, pageSize: '30', sort: 'latest_reply' });
      const data = await apiRequest<{ items: Post[] }>(`/posts?${params.toString()}`);
      setPosts(data.items);
    } finally {
      setLoadingPosts(false);
    }
  };

  const openArea = async (area: UniversityArea) => {
    setSelectedArea(area);
    setSelectedPost(null);
    await loadPosts(area.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadPost = async (id: number) => {
    const data = await apiRequest<{ post: Post & { comments: Comment[] } }>(`/posts/${id}`);
    setSelectedPost(data.post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createArea = async () => {
    setFeedback('');
    if (!user) {
      setFeedback('请先到论坛登录，再创建大学话题区。');
      return;
    }
    try {
      const data = await apiRequest<{ area: UniversityArea }>('/universities', {
        method: 'POST',
        body: JSON.stringify(areaForm),
      });
      const nextArea = {
        ...data.area,
        cover: seedAreas[areas.length % seedAreas.length]?.cover,
        highlights: ['大学生活', '专业体验', '报考建议'],
      };
      setAreas((current) => [nextArea, ...current]);
      setAreaForm(emptyAreaForm);
      setAreaModalOpen(false);
      await openArea(nextArea);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '创建失败');
    }
  };

  const createPost = async () => {
    if (!selectedArea) return;
    setFeedback('');
    if (!user) {
      setFeedback('请先到论坛登录，再发布大学经验。');
      return;
    }
    try {
      const data = await apiRequest<{ post: Post }>('/posts', {
        method: 'POST',
        body: JSON.stringify({
          ...postForm,
          tag: '经验分享',
          university: selectedArea.name,
        }),
      });
      setPostForm(emptyPostForm);
      setPostModalOpen(false);
      await loadPosts(selectedArea.name);
      await loadPost(data.post.id);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '发布失败');
    }
  };

  const createComment = async () => {
    if (!selectedPost) return;
    setFeedback('');
    if (!user) {
      setFeedback('请先到论坛登录，再参与回复。');
      return;
    }
    try {
      await apiRequest(`/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText }),
      });
      setCommentText('');
      await loadPost(selectedPost.id);
      if (selectedArea) await loadPosts(selectedArea.name);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '回复失败');
    }
  };

  useEffect(() => {
    void loadUser();
    void loadAreas();
  }, []);

  if (selectedPost && selectedArea) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/85 backdrop-blur-xl transition hover:bg-white/15" onClick={() => setSelectedPost(null)}>
          <ArrowLeft size={17} />
          返回 {selectedArea.name}
        </button>

        <section className={lightPanelClass('p-6 md:p-8')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">经验分享</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{selectedArea.name}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950 md:text-5xl">{selectedPost.title}</h1>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {selectedPost.author.username} · {formatTime(selectedPost.createdAt)} · {selectedPost.viewCount} 浏览 · {selectedPost.commentCount} 回复
          </p>
          <p className="mt-6 whitespace-pre-wrap rounded-[22px] border border-slate-200 bg-white/70 p-5 text-base font-medium leading-8 text-slate-800">
            {selectedPost.content}
          </p>
          {selectedPost.imageUrl && (
            <img className="mt-5 max-h-[420px] w-full rounded-[22px] object-cover" src={selectedPost.imageUrl} alt={selectedPost.title} />
          )}
        </section>

        <section className={lightPanelClass('p-6')}>
          <h2 className="text-2xl font-black text-slate-950">讨论</h2>
          <div className="mt-5 space-y-3">
            {selectedPost.comments.map((comment) => (
              <article className="rounded-2xl border border-slate-200 bg-white/75 p-4" key={comment.id}>
                <p className="text-sm font-bold text-slate-950">{comment.author.username}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{comment.content}</p>
              </article>
            ))}
            {!selectedPost.comments.length && <p className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-600">还没有回复，可以先抛出一个问题。</p>}
          </div>
          <div className="mt-5 grid gap-3">
            <textarea
              className="min-h-28 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500/45"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={user ? '写下你的追问或补充...' : '请先到论坛登录后再回复'}
            />
            <Button className="w-fit" onClick={createComment}>
              <Send size={17} />
              发布回复
            </Button>
          </div>
        </section>
      </motion.div>
    );
  }

  if (selectedArea) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/85 backdrop-blur-xl transition hover:bg-white/15" onClick={() => setSelectedArea(null)}>
          <ArrowLeft size={17} />
          返回大学经验馆
        </button>

        <section className={panelClass('overflow-hidden p-6 md:p-10')}>
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <Badge tone="green">University Space</Badge>
              <h1 className="mt-5 text-4xl font-black leading-tight text-white/95 md:text-6xl">{selectedArea.name}</h1>
              <p className="mt-4 max-w-3xl rounded-3xl bg-black/20 p-4 text-base font-medium leading-8 text-white/75">{selectedArea.description}</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[0.08] p-5 text-white/75 backdrop-blur-xl">
              <p className="flex items-center gap-2 text-sm font-semibold"><MapPin size={17} /> {selectedArea.city || '待补充城市'}</p>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><MessageSquare size={17} /> {posts.length} 条经验讨论</p>
              <Button className="mt-5 w-full" onClick={() => setPostModalOpen(true)}>
                <Plus size={17} />
                分享这所大学
              </Button>
            </div>
          </div>
        </section>

        {feedback && <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-50">{feedback}</div>}

        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className={lightPanelClass('h-fit p-6')}>
            <h2 className="text-2xl font-black text-slate-950">可以聊什么</h2>
            <div className="mt-5 space-y-3">
              {(selectedArea.highlights || ['大学生活', '专业体验', '报考建议']).map((item) => (
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700" key={item}>{item}</div>
              ))}
            </div>
            <p className="mt-5 text-sm font-medium leading-7 text-slate-600">
              这里更适合沉淀真实体验：课程强度、宿舍食堂、城市生活、转专业、保研考研、社团活动，以及给高中同学的报考建议。
            </p>
          </aside>

          <section className={lightPanelClass('p-6')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-slate-950">相关讨论</h2>
              <Button onClick={() => setPostModalOpen(true)}>
                <Plus size={17} />
                发起讨论
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {loadingPosts ? (
                <p className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-600">正在加载讨论...</p>
              ) : posts.length ? (
                posts.map((post) => (
                  <button className="block w-full rounded-[22px] border border-slate-200 bg-white/75 p-5 text-left transition hover:-translate-y-0.5 hover:bg-white" key={post.id} onClick={() => loadPost(post.id)}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">经验分享</span>
                      <span>{post.author.username}</span>
                      <span>{formatTime(post.createdAt)}</span>
                      <span>{post.commentCount} 回复</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{post.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{excerpt(post.content)}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/65 p-6 text-center">
                  <p className="text-base font-black text-slate-950">还没有同学分享这所大学。</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">可以先开一个话题，问问课程、住宿、城市或者专业体验。</p>
                </div>
              )}
            </div>
          </section>
        </section>

        <Dialog open={postModalOpen} title={`分享 ${selectedArea.name}`} description="内容会同步到论坛，并归入这所大学的话题区。" onClose={() => setPostModalOpen(false)}>
          <div className="grid gap-3">
            <Input value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} placeholder="标题，例如：大一这一年我对这所学校的真实感受" />
            <Input value={postForm.imageUrl} onChange={(event) => setPostForm({ ...postForm, imageUrl: event.target.value })} placeholder="图片 URL，可选" />
            <textarea
              className="min-h-44 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-white/90 outline-none placeholder:text-white/35 focus:border-emerald-200/35"
              value={postForm.content}
              onChange={(event) => setPostForm({ ...postForm, content: event.target.value })}
              placeholder="可以写学习节奏、专业体验、宿舍食堂、城市生活、给高中同学的建议..."
            />
            <Button onClick={createPost}>发布到大学经验馆</Button>
          </div>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <section className={panelClass('overflow-hidden p-6 md:p-10')}>
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Badge tone="green">Alumni Guide</Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white/95 md:text-6xl">大学经验馆</h1>
            <p className="mt-4 max-w-3xl rounded-3xl bg-black/20 p-4 text-base font-medium leading-8 text-white/75">
              让已经毕业的学长学姐把真实大学生活留下来：专业体验、校园节奏、城市感受、报考建议和踩坑提醒，都可以按大学沉淀成一个话题区。
            </p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/[0.08] p-5 text-white/75 backdrop-blur-xl">
            <p className="flex items-center gap-2 text-sm font-semibold"><Users size={17} /> 每所大学都是一个独立讨论区</p>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Sparkles size={17} /> 内容优先服务高中同学选校和了解大学</p>
            <Button className="mt-5 w-full" onClick={() => setAreaModalOpen(true)}>
              <Plus size={17} />
              创建大学话题区
            </Button>
          </div>
        </div>
      </section>

      {feedback && <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-50">{feedback}</div>}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {mergedAreas.map((area, index) => {
          const logo = getUniversityLogo(area.name);

          return (
          <motion.button
            className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.035))] text-left shadow-[0_18px_54px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.08]"
            key={`${area.name}-${area.id}`}
            onClick={() => openArea(area)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
          >
            <div className="relative grid min-h-[170px] place-items-center overflow-hidden border-b border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035)_46%,rgba(0,0,0,0.16))]">
              <div className="absolute inset-x-8 top-8 h-px bg-white/20" />
              <div className="absolute inset-x-12 bottom-8 h-px bg-white/10" />
              <div className="relative grid h-[96px] w-[196px] place-items-center rounded-[22px] border border-white/[0.14] bg-black/[0.26] px-6 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                {logo ? (
                    <img className="max-h-full max-w-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.28)]" src={logo} alt={`${area.name}\u6821\u5fbd`} loading="lazy" />
                ) : (
                  <GraduationCap size={34} className="text-white/80" />
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="green">{area.city || '城市待补充'}</Badge>
                <span className="text-xs font-semibold text-white/50">{area.postCount || 0} 条讨论</span>
              </div>
              <h2 className="mt-4 text-2xl font-black text-white/95">{area.name}</h2>
              <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-white/70">{area.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(area.highlights || ['大学生活', '专业体验', '报考建议']).slice(0, 3).map((item) => (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/65" key={item}>{item}</span>
                ))}
              </div>
            </div>
            </motion.button>
          );
        })}
      </section>

      <section className={lightPanelClass('p-6')}>
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950">这个页面会怎么用</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
              后续你可以把“大学经验馆”当作学长学姐分享区：先创建某所大学的话题区，再围绕这所大学发布经验帖和问答。内容会进入现有论坛数据库，不影响学习工具箱和普通论坛。
            </p>
          </div>
        </div>
      </section>

      <Dialog open={areaModalOpen} title="创建大学话题区" description="建议使用学校全称，方便同学搜索和归档。" onClose={() => setAreaModalOpen(false)}>
        <div className="grid gap-3">
          <Input value={areaForm.name} onChange={(event) => setAreaForm({ ...areaForm, name: event.target.value })} placeholder="大学名称，例如：武汉大学" />
          <Input value={areaForm.city} onChange={(event) => setAreaForm({ ...areaForm, city: event.target.value })} placeholder="所在城市，例如：武汉" />
          <textarea
            className="min-h-32 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold leading-6 text-white/90 outline-none placeholder:text-white/35 focus:border-emerald-200/35"
            value={areaForm.description}
            onChange={(event) => setAreaForm({ ...areaForm, description: event.target.value })}
            placeholder="一句话介绍这个话题区适合讨论什么，例如：专业体验、宿舍食堂、城市生活和报考建议。"
          />
          <Button onClick={createArea}>创建话题区</Button>
        </div>
      </Dialog>
    </motion.div>
  );
}
