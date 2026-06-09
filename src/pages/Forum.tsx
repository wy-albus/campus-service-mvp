import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Plus,
  Search,
  Send,
  Shield,
  Tags,
  Trash2,
  UserRound,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { apiRequest, clearToken, getToken, setToken, type ForumUser } from '../lib/api';

type Author = { id: number; username: string; role: 'USER' | 'ADMIN' };
type Post = {
  id: number;
  title: string;
  content: string;
  tag: ForumTag;
  imageUrl?: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
};
type Comment = { id: number; content: string; createdAt: string; author: Author };
type Report = {
  id: number;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  reason: string;
  handled: boolean;
  createdAt: string;
  reporter: { username: string; email: string };
};
type UserProfile = {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  bio: string;
  createdAt: string;
  postCount: number;
  replyCount: number;
  recentPosts: Array<Omit<Post, 'author' | 'reportCount'>>;
};
type SortMode = 'latest' | 'latest_reply' | 'views';
type ForumTag =
  | '学习'
  | '吐槽'
  | '活动'
  | '比赛'
  | '旅游'
  | '情感'
  | '美食'
  | '求助'
  | '失物招领'
  | '校园生活'
  | '经验分享'
  | '闲聊';

const forumTags: ForumTag[] = ['学习', '吐槽', '活动', '比赛', '旅游', '情感', '美食', '求助', '失物招领', '校园生活', '经验分享', '闲聊'];
const tagFilters: Array<'全部' | ForumTag> = ['全部', ...forumTags];
const emojiOptions = ['😊', '😂', '👍', '🎉', '🔥', '❤️', '😭', '🤔', '🙏', '📚', '🌟', '🍜'];
const emptyAuth = { username: '', email: '', password: '' };
const emptyPostForm = { title: '', content: '', tag: '' as '' | ForumTag, imageUrl: '' };

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function excerpt(content: string) {
  const compact = content.replace(/\s+/g, ' ').trim();
  return compact.length > 92 ? `${compact.slice(0, 92)}...` : compact;
}

function forumCard(className = '') {
  return `rounded-[24px] border border-white/70 bg-white/[0.92] text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-md ${className}`;
}

function lightButtonClass(className = '') {
  return `inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:text-emerald-800 ${className}`;
}

function tagPillClass(active = false) {
  return active
    ? 'rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(5,150,105,0.24)] transition'
    : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-800';
}

function forumTagBadge(tag: string) {
  return (
    <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-[0_4px_14px_rgba(15,118,110,0.08)]">
      {tag}
    </span>
  );
}

function postImage(imageUrl?: string | null, compact = false) {
  if (!imageUrl) return null;
  return (
    <div className={compact ? 'mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100' : 'mt-5 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100'}>
      <img
        src={imageUrl}
        alt="帖子图片"
        className={compact ? 'h-48 w-full object-cover' : 'max-h-[520px] w-full object-cover'}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

export function Forum() {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<(Post & { comments: Comment[] }) | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [liked, setLiked] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<'全部' | ForumTag>('全部');
  const [sort, setSort] = useState<SortMode>('latest');
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [editorOpen, setEditorOpen] = useState(false);
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [postError, setPostError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [reportTarget, setReportTarget] = useState<{ targetType: 'POST' | 'COMMENT'; targetId: number } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [message, setMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const activePosts = useMemo(() => posts.slice(0, 5), [posts]);
  const tagStats = useMemo(
    () =>
      forumTags.map((tag) => ({
        tag,
        count: posts.filter((post) => post.tag === tag).length,
      })),
    [posts],
  );

  const loadMe = async () => {
    if (!getToken()) return;
    try {
      const data = await apiRequest<{ user: ForumUser }>('/auth/me');
      setUser(data.user);
    } catch {
      clearToken();
      setUser(null);
    }
  };

  const loadPosts = async () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (activeTag !== '全部') params.set('tag', activeTag);
    params.set('sort', sort);
    const data = await apiRequest<{ items: Post[] }>(`/posts?${params.toString()}`);
    setPosts(data.items);
  };

  const loadPost = async (id: number) => {
    const data = await apiRequest<{ post: Post & { comments: Comment[] }; liked: boolean }>(`/posts/${id}`);
    setSelectedPost(data.post);
    setSelectedProfile(null);
    setLiked(data.liked);
  };

  const loadProfile = async (id: number) => {
    const data = await apiRequest<{ user: UserProfile }>(`/users/${id}`);
    setSelectedProfile(data.user);
    setSelectedPost(null);
  };

  useEffect(() => {
    void loadMe();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [search, activeTag, sort]);

  const submitAuth = async () => {
    if (authLoading) return;
    setAuthError('');
    setMessage('');
    setAuthLoading(true);
    try {
      const path = authMode === 'register' ? '/auth/register' : '/auth/login';
      const body = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password };
      const data = await apiRequest<{ token: string; user: ForumUser }>(path, { method: 'POST', body: JSON.stringify(body) });
      setToken(data.token);
      setUser(data.user);
      setAuthMode(null);
      setAuthForm(emptyAuth);
      setMessage('登录成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      setAuthError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const createPost = async () => {
    setPostError('');
    try {
      const payload = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        tag: postForm.tag,
        ...(postForm.imageUrl.trim() ? { imageUrl: postForm.imageUrl.trim() } : {}),
      };
      const data = await apiRequest<{ post: Post }>('/posts', { method: 'POST', body: JSON.stringify(payload) });
      setPostForm(emptyPostForm);
      setEditorOpen(false);
      setMessage('发布成功');
      await loadPosts();
      await loadPost(data.post.id);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : '发布失败');
    }
  };

  const insertEmoji = (emoji: string) => {
    setPostForm((current) => ({ ...current, content: `${current.content}${emoji}` }));
  };

  const createComment = async () => {
    if (!selectedPost) return;
    if (!user) {
      setMessage('请先登录后再回复');
      setAuthMode('login');
      return;
    }
    try {
      await apiRequest(`/posts/${selectedPost.id}/comments`, { method: 'POST', body: JSON.stringify({ content: commentText }) });
      setCommentText('');
      await loadPost(selectedPost.id);
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '评论失败');
    }
  };

  const toggleLike = async () => {
    if (!selectedPost) return;
    if (!user) {
      setMessage('请先登录后再点赞');
      setAuthMode('login');
      return;
    }
    try {
      const data = await apiRequest<{ liked: boolean; likeCount: number }>(`/posts/${selectedPost.id}/like`, { method: 'POST' });
      setLiked(data.liked);
      setSelectedPost({ ...selectedPost, likeCount: data.likeCount });
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '点赞失败');
    }
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    try {
      await apiRequest('/reports', { method: 'POST', body: JSON.stringify({ ...reportTarget, reason: reportReason }) });
      setReportTarget(null);
      setReportReason('');
      setMessage('举报已提交');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '举报失败');
    }
  };

  const requestDeletePost = (post: Pick<Post, 'id' | 'title'>) => {
    setDeleteTarget({ id: post.id, title: post.title });
  };

  const confirmDeletePost = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/posts/${deleteTarget.id}`, { method: 'DELETE' });
      setSelectedPost(null);
      setDeleteTarget(null);
      setMessage('帖子已删除');
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  const deleteComment = async (id: number) => {
    if (!selectedPost) return;
    await apiRequest(`/comments/${id}`, { method: 'DELETE' });
    await loadPost(selectedPost.id);
  };

  const loadReports = async () => {
    const data = await apiRequest<{ reports: Report[] }>('/admin/reports');
    setReports(data.reports);
    setReportsOpen(true);
  };

  const handleReport = async (id: number) => {
    await apiRequest(`/admin/reports/${id}/handle`, { method: 'POST' });
    await loadReports();
  };

  const openReport = (targetType: 'POST' | 'COMMENT', targetId: number) => {
    if (!user) {
      setMessage('请先登录后再举报');
      setAuthMode('login');
      return;
    }
    setReportTarget({ targetType, targetId });
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <section className="rounded-[30px] border border-white/10 bg-black/30 p-6 shadow-[0_18px_56px_rgba(0,0,0,0.2)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge tone="green">Campus Forum</Badge>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">校内论坛</h1>
            <p className="mt-4 max-w-2xl rounded-2xl bg-black/20 px-4 py-3 text-base font-medium leading-7 text-white/72 backdrop-blur-md">
              分享学习经验、校园生活和实用信息。这里更像一个轻量校园讨论区，先把话题、回复和资料沉淀起来。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <button className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-sm font-semibold text-white/85" onClick={() => loadProfile(user.id)}>
                  {user.username} · {user.role}
                </button>
                <Button onClick={() => setEditorOpen(true)}>
                  <Plus size={17} />
                  发布帖子
                </Button>
                {isAdmin && (
                  <Button variant="subtle" onClick={loadReports}>
                    <Shield size={17} />
                    举报管理
                  </Button>
                )}
                <Button variant="ghost" onClick={() => { clearToken(); setUser(null); }}>退出</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setAuthMode('login')}>登录</Button>
                <Button onClick={() => setAuthMode('register')}>注册</Button>
              </>
            )}
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white/80 backdrop-blur-xl">
          {message}
        </div>
      )}

      <section className={forumCard('p-4')}>
        <div className="grid gap-3 md:grid-cols-[1fr_170px_130px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              className="w-full border-slate-200 bg-white/80 pl-11 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索标题、正文或作者"
            />
          </label>
          <select
            className="h-11 rounded-2xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500/50"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
          >
            <option value="latest">最新发布</option>
            <option value="latest_reply">最新回复</option>
            <option value="views">最多浏览</option>
          </select>
          <button className={lightButtonClass()} onClick={loadPosts}>搜索</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tagFilters.map((tag) => (
            <button
              key={tag}
              className={tagPillClass(activeTag === tag)}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {selectedProfile ? (
        <section className={forumCard('p-6')}>
          <button className={lightButtonClass()} onClick={() => setSelectedProfile(null)}>
            <ArrowLeft size={17} />
            返回论坛
          </button>
          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-[22px] border border-slate-200 bg-white/70 p-5">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-100 text-3xl font-black text-emerald-800">
                {selectedProfile.username.slice(0, 1)}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">{selectedProfile.username}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{selectedProfile.bio}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-2xl font-black text-slate-950">{selectedProfile.postCount}</p>
                  <p className="text-xs font-semibold text-slate-700">发帖</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-2xl font-black text-slate-950">{selectedProfile.replyCount}</p>
                  <p className="text-xs font-semibold text-slate-700">回复</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">注册于 {formatDate(selectedProfile.createdAt)}</p>
            </aside>
            <div>
              <h3 className="text-xl font-semibold text-slate-950">最近发布的帖子</h3>
              <div className="mt-4 grid gap-3">
                {selectedProfile.recentPosts.map((post) => (
                  <button className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-left transition hover:bg-white" key={post.id} onClick={() => loadPost(post.id)}>
                    {forumTagBadge(post.tag)}
                    <h4 className="mt-3 text-lg font-semibold text-slate-950">{post.title}</h4>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{excerpt(post.content)}</p>
                    {postImage(post.imageUrl, true)}
                  </button>
                ))}
                {!selectedProfile.recentPosts.length && <p className="rounded-2xl bg-slate-100 p-4 text-sm font-medium text-slate-700">暂时还没有发布帖子。</p>}
              </div>
            </div>
          </div>
        </section>
      ) : selectedPost ? (
        <section className={forumCard('p-6')}>
          <button className={lightButtonClass()} onClick={() => setSelectedPost(null)}>
            <ArrowLeft size={17} />
            返回列表
          </button>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              {forumTagBadge(selectedPost.tag)}
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">{selectedPost.title}</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                <button className="font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => loadProfile(selectedPost.author.id)}>
                  {selectedPost.author.username}
                </button>
                <span> · {formatTime(selectedPost.createdAt)}</span>
              </p>
            </div>
            {isAdmin && (
              <button className={lightButtonClass('text-red-700 hover:border-red-300 hover:text-red-800')} onClick={() => requestDeletePost(selectedPost)}>
                <Trash2 size={17} />
                删除帖子
              </button>
            )}
          </div>
          <p className="mt-6 whitespace-pre-wrap rounded-[22px] border border-slate-200 bg-white/70 p-5 text-base leading-8 text-slate-700">{selectedPost.content}</p>
          {postImage(selectedPost.imageUrl)}
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1"><Eye size={15} /> {selectedPost.viewCount}</span>
            <span className="inline-flex items-center gap-1"><MessageSquare size={15} /> {selectedPost.commentCount}</span>
            <span className="inline-flex items-center gap-1"><Heart size={15} /> {selectedPost.likeCount}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant={liked ? 'primary' : 'secondary'} onClick={toggleLike}>
              <Heart size={17} />
              {liked ? '已点赞' : '点赞'} {selectedPost.likeCount}
            </Button>
            <button className={lightButtonClass()} onClick={() => openReport('POST', selectedPost.id)}>
              <AlertTriangle size={17} />
              举报
            </button>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-slate-950">回复</h3>
            <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white/70 p-4">
              {user ? (
                <>
                  <textarea
                    className="min-h-[110px] rounded-[18px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500/50"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="写下你的回复"
                  />
                  <Button className="w-fit" onClick={createComment}>
                    <Send size={16} />
                    发表回复
                  </Button>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">登录后可以参与回复。</p>
                  <Button onClick={() => setAuthMode('login')}>登录后回复</Button>
                </div>
              )}
            </div>
            {selectedPost.comments.map((comment) => (
              <article className="rounded-2xl border border-slate-200 bg-white/75 p-4" key={comment.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-600">
                    <button className="font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => loadProfile(comment.author.id)}>
                      {comment.author.username}
                    </button>
                    <span> · {formatTime(comment.createdAt)}</span>
                  </p>
                  <div className="flex gap-2">
                    <button className={lightButtonClass('h-9 px-3 text-xs')} onClick={() => openReport('COMMENT', comment.id)}>举报</button>
                    {isAdmin && <button className={lightButtonClass('h-9 px-3 text-xs text-red-700 hover:border-red-300 hover:text-red-800')} onClick={() => deleteComment(comment.id)}>删除</button>}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{comment.content}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="grid gap-4">
            {posts.map((post) => (
              <article className={forumCard('p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.94]')} key={post.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    {forumTagBadge(post.tag)}
                    <button className="mt-3 block text-left text-2xl font-semibold text-slate-950 hover:text-emerald-800" onClick={() => loadPost(post.id)}>
                      {post.title}
                    </button>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{excerpt(post.content)}</p>
                    {postImage(post.imageUrl, true)}
                  </div>
                  {isAdmin && (
                    <button className={lightButtonClass('h-9 px-3 text-xs text-red-700 hover:border-red-300 hover:text-red-800')} onClick={() => requestDeletePost(post)}>
                      <Trash2 size={15} />
                      删除
                    </button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
                  <button className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900" onClick={() => loadProfile(post.author.id)}>
                    <UserRound size={15} />
                    {post.author.username}
                  </button>
                  <span className="inline-flex items-center gap-1"><Clock size={15} /> {formatTime(post.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Eye size={15} /> {post.viewCount}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare size={15} /> {post.commentCount}</span>
                  <span className="inline-flex items-center gap-1"><Heart size={15} /> {post.likeCount}</span>
                </div>
              </article>
            ))}
            {!posts.length && (
              <div className={forumCard('p-8 text-center')}>
                <p className="text-lg font-semibold text-slate-950">没有找到相关帖子</p>
                <p className="mt-2 text-sm font-medium text-slate-700">换个关键词或分类试试看。</p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className={forumCard('p-5')}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><MessageSquare size={18} /> 最新动态</h3>
              <div className="mt-4 grid gap-3">
                {activePosts.map((post) => (
                  <button className="rounded-2xl bg-slate-100/80 p-3 text-left transition hover:bg-white" key={post.id} onClick={() => loadPost(post.id)}>
                    <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{post.commentCount} 回复 · {post.viewCount} 浏览</p>
                  </button>
                ))}
              </div>
            </section>
            <section className={forumCard('p-5')}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Tags size={18} /> 热门 tag</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {tagStats.map(({ tag, count }) => (
                  <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.06)] hover:border-emerald-500/35 hover:text-emerald-800" key={tag} onClick={() => setActiveTag(tag)}>
                    {tag} {count ? count : ''}
                  </button>
                ))}
              </div>
            </section>
            <section className={forumCard('p-5')}>
              <h3 className="text-lg font-semibold text-slate-950">发帖须知</h3>
              <div className="mt-3 space-y-2 p-1 text-sm font-semibold leading-6">
                <p className="text-black">标题尽量具体，选择合适 tag，方便同学搜索。</p>
                <p className="text-black">不要公开他人隐私，不发布攻击性、违法或广告内容。</p>
                <p className="text-black">论坛内容仅供校内学习生活交流参考。</p>
              </div>
            </section>
          </aside>
        </div>
      )}

      <Dialog
        open={Boolean(authMode)}
        title={authMode === 'register' ? '注册账号' : '登录论坛'}
        onClose={() => {
          if (authLoading) return;
          setAuthMode(null);
          setAuthError('');
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitAuth();
          }}
        >
          {authMode === 'register' && <Input value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} placeholder="用户名" autoComplete="username" />}
          <Input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="邮箱" autoComplete="email" />
          <Input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="密码" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} />
          {authError && (
            <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
              {authError}
            </div>
          )}
          <Button type="submit" disabled={authLoading}>
            {authLoading ? '正在提交...' : authMode === 'register' ? '注册并登录' : '登录'}
          </Button>
        </form>
      </Dialog>

      <Dialog open={editorOpen} title="发布帖子" onClose={() => setEditorOpen(false)}>
        <div className="space-y-4">
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-black/[0.18] px-4 text-sm font-semibold text-white/85 outline-none focus:border-emerald-200/40"
            value={postForm.tag}
            onChange={(e) => setPostForm({ ...postForm, tag: e.target.value as ForumTag })}
          >
            <option value="">选择 tag</option>
            {forumTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="帖子标题" />
          <Input value={postForm.imageUrl} onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })} placeholder="图片链接，可选，例如 https://..." />
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/[0.12] p-2">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                className="grid h-9 w-9 place-items-center rounded-xl text-lg transition hover:bg-white/10"
                onClick={() => insertEmoji(emoji)}
                aria-label={`插入 ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <textarea
            className="min-h-[220px] w-full rounded-[22px] border border-white/10 bg-black/[0.18] p-4 text-sm leading-7 text-white/85 outline-none placeholder:text-white/35"
            value={postForm.content}
            onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
            placeholder="正文内容"
          />
          {postError && <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">{postError}</div>}
          <Button onClick={createPost}>发布</Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(reportTarget)} title="提交举报" onClose={() => setReportTarget(null)}>
        <div className="space-y-4">
          <textarea
            className="min-h-[130px] w-full rounded-[22px] border border-white/10 bg-black/[0.18] p-4 text-sm leading-7 text-white/85 outline-none placeholder:text-white/35"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="请说明举报原因"
          />
          <Button onClick={submitReport}>提交举报</Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} title="确认删除帖子" description="删除后帖子会从列表和详情页隐藏，请确认这确实是违规或不适合展示的内容。" onClose={() => setDeleteTarget(null)}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200/20 bg-red-400/10 px-4 py-3">
            <p className="text-sm font-semibold text-white/70">即将删除</p>
            <p className="mt-1 text-lg font-bold text-white/95">{deleteTarget?.title}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-red-200 text-red-950 hover:bg-red-100" onClick={confirmDeletePost}>
              <Trash2 size={17} />
              确认删除
            </Button>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={reportsOpen} title="举报管理" onClose={() => setReportsOpen(false)}>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {reports.map((report) => (
            <article className="rounded-2xl border border-white/10 bg-black/[0.14] p-4" key={report.id}>
              <div className="flex flex-wrap justify-between gap-3">
                <p className="text-sm font-semibold text-white/90">{report.targetType} #{report.targetId}</p>
                <Badge tone={report.handled ? 'slate' : 'amber'}>{report.handled ? '已处理' : '待处理'}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/70">{report.reason}</p>
              <p className="mt-2 text-xs text-white/50">举报人：{report.reporter.username} · {formatTime(report.createdAt)}</p>
              {!report.handled && <Button className="mt-3" variant="secondary" size="sm" onClick={() => handleReport(report.id)}>标记处理</Button>}
            </article>
          ))}
        </div>
      </Dialog>
    </motion.div>
  );
}
