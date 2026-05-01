import { AlertTriangle, Heart, MessageSquare, Plus, Search, Shield, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { SectionHeader } from '../components/ui/SectionHeader';
import { apiRequest, clearToken, getToken, setToken, type ForumUser } from '../lib/api';

type Author = { id: number; username: string; role: 'USER' | 'ADMIN' };
type Post = {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
  reportCount: number;
  createdAt: string;
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

const emptyAuth = { username: '', email: '', password: '' };

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Forum() {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<(Post & { comments: Comment[] }) | null>(null);
  const [liked, setLiked] = useState(false);
  const [q, setQ] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState(emptyAuth);
  const [editorOpen, setEditorOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [commentText, setCommentText] = useState('');
  const [reportTarget, setReportTarget] = useState<{ targetType: 'POST' | 'COMMENT'; targetId: number } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const filteredPosts = useMemo(() => posts, [posts]);

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
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    const data = await apiRequest<{ items: Post[] }>(`/posts${params}`);
    setPosts(data.items);
  };

  const loadPost = async (id: number) => {
    const data = await apiRequest<{ post: Post & { comments: Comment[] }; liked: boolean }>(`/posts/${id}`);
    setSelectedPost(data.post);
    setLiked(data.liked);
  };

  useEffect(() => {
    void loadMe();
    void loadPosts();
  }, []);

  const submitAuth = async () => {
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
      setMessage(error instanceof Error ? error.message : '登录失败');
    }
  };

  const createPost = async () => {
    try {
      await apiRequest('/posts', { method: 'POST', body: JSON.stringify(postForm) });
      setPostForm({ title: '', content: '' });
      setEditorOpen(false);
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布失败');
    }
  };

  const createComment = async () => {
    if (!selectedPost) return;
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

  const deletePost = async (id: number) => {
    await apiRequest(`/posts/${id}`, { method: 'DELETE' });
    setSelectedPost(null);
    await loadPosts();
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

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <SectionHeader
        eyebrow="Forum"
        title="校内论坛"
        description="分享学习经验、校园生活和实用信息。"
        action={
          <div className="flex flex-wrap gap-3">
            {user ? (
              <>
                <Badge tone="green">{user.username} · {user.role}</Badge>
                <Button variant="secondary" onClick={() => setEditorOpen(true)}>
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
        }
      />

      {message && (
        <div className="rounded-2xl border border-white/10 bg-emerald-950/35 px-4 py-3 text-sm text-white/75 backdrop-blur-xl">
          {message}
        </div>
      )}

      <section className="rounded-[28px] border border-white/10 bg-emerald-950/35 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" size={18} />
            <Input className="w-full pl-11" value={q} onChange={(event) => setQ(event.target.value)} placeholder="搜索标题或内容" />
          </label>
          <Button variant="secondary" onClick={loadPosts}>搜索</Button>
        </div>
      </section>

      {selectedPost ? (
        <section className="rounded-[28px] border border-white/10 bg-emerald-950/35 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <Button variant="subtle" onClick={() => setSelectedPost(null)}>返回列表</Button>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-white/95">{selectedPost.title}</h2>
              <p className="mt-2 text-sm text-white/55">{selectedPost.author.username} · {formatTime(selectedPost.createdAt)}</p>
            </div>
            {isAdmin && (
              <Button variant="subtle" onClick={() => deletePost(selectedPost.id)}>
                <Trash2 size={17} />
                删除帖子
              </Button>
            )}
          </div>
          <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-white/75">{selectedPost.content}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant={liked ? 'primary' : 'secondary'} onClick={toggleLike} disabled={!user}>
              <Heart size={17} />
              {liked ? '已点赞' : '点赞'} {selectedPost.likeCount}
            </Button>
            <Button variant="subtle" onClick={() => setReportTarget({ targetType: 'POST', targetId: selectedPost.id })} disabled={!user}>
              <AlertTriangle size={17} />
              举报
            </Button>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold text-white/95">评论</h3>
            {user && (
              <div className="grid gap-3">
                <textarea
                  className="min-h-[110px] rounded-[22px] border border-white/10 bg-black/[0.18] p-4 text-sm leading-7 text-white/85 outline-none placeholder:text-white/35 focus:border-emerald-200/40"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="写下你的评论"
                />
                <Button className="w-fit" onClick={createComment}>发表评论</Button>
              </div>
            )}
            {selectedPost.comments.map((comment) => (
              <article className="rounded-2xl border border-white/10 bg-black/[0.14] p-4" key={comment.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white/55">{comment.author.username} · {formatTime(comment.createdAt)}</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setReportTarget({ targetType: 'COMMENT', targetId: comment.id })} disabled={!user}>举报</Button>
                    {isAdmin && <Button variant="ghost" size="sm" onClick={() => deleteComment(comment.id)}>删除</Button>}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">{comment.content}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="grid gap-4">
          {filteredPosts.map((post) => (
            <button
              className="rounded-[24px] border border-white/10 bg-emerald-950/35 p-5 text-left shadow-[0_16px_48px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-emerald-950/45"
              key={post.id}
              onClick={() => loadPost(post.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white/95">{post.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/65">{post.content}</p>
                </div>
                <Badge tone="slate">{post.author.username}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/55">
                <span>{formatTime(post.createdAt)}</span>
                <span><Heart className="mr-1 inline" size={14} />{post.likeCount}</span>
                <span><MessageSquare className="mr-1 inline" size={14} />{post.commentCount}</span>
              </div>
            </button>
          ))}
        </section>
      )}

      <Dialog open={Boolean(authMode)} title={authMode === 'register' ? '注册账号' : '登录论坛'} onClose={() => setAuthMode(null)}>
        <div className="space-y-4">
          {authMode === 'register' && <Input value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} placeholder="用户名" />}
          <Input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="邮箱" />
          <Input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="密码" />
          <Button onClick={submitAuth}>{authMode === 'register' ? '注册并登录' : '登录'}</Button>
        </div>
      </Dialog>

      <Dialog open={editorOpen} title="发布帖子" onClose={() => setEditorOpen(false)}>
        <div className="space-y-4">
          <Input value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="帖子标题" />
          <textarea
            className="min-h-[220px] w-full rounded-[22px] border border-white/10 bg-black/[0.18] p-4 text-sm leading-7 text-white/85 outline-none placeholder:text-white/35"
            value={postForm.content}
            onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
            placeholder="正文内容"
          />
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
