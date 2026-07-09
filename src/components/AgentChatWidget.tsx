import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { API_BASE } from '../lib/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  usedTools?: string[];
};

const quickQuestions = [
  '这个网站有哪些功能？',
  '帮我找学习资源',
  '论坛里有没有关于比赛的帖子？',
  '我想发一个关于食堂排队太慢的帖子，帮我写得委婉一点',
];

const toolLabels: Record<string, string> = {
  get_site_guide: '已查询网站说明',
  search_posts: '已搜索论坛',
  search_resources: '已搜索学习资源',
  recommend_tags: '已推荐标签',
  draft_post: '已生成发帖草稿',
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AgentChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createMessageId(),
      role: 'assistant',
      content: '你好，我是小和。可以帮你找网站功能、学习资源、论坛帖子，也能帮你写发帖草稿。',
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const usedToolLabels = useMemo(() => {
    const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant' && message.usedTools?.length);
    return latestAssistant?.usedTools?.map((tool) => toolLabels[tool] || tool).filter(Boolean) || [];
  }, [messages]);

  async function sendMessage(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || loading) return;

    setOpen(true);
    setInput('');
    setLoading(true);
    setMessages((current) => [...current, { id: createMessageId(), role: 'user', content: trimmed }]);

    try {
      const response = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.reply || 'agent unavailable');
      }
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: data.reply || '我暂时没有生成回复。',
          usedTools: Array.isArray(data.usedTools) ? data.usedTools : [],
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: '小和暂时不可用，请稍后再试。',
          usedTools: [],
        },
      ]);
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className={open ? 'agent-widget is-open' : 'agent-widget'}>
      {open && (
        <section className="agent-panel" aria-label="小和校园智能导航助手">
          <header className="agent-header">
            <div className="agent-title">
              <span className="agent-icon">
                <Bot size={18} />
              </span>
              <div>
                <strong>小和</strong>
                <span>智能导航</span>
              </div>
            </div>
            <button className="agent-icon-button" type="button" onClick={() => setOpen(false)} aria-label="关闭小和">
              <X size={18} />
            </button>
          </header>

          <div className="agent-quick-actions" aria-label="快捷问题">
            {quickQuestions.map((question) => (
              <button key={question} type="button" onClick={() => void sendMessage(question)} disabled={loading}>
                {question}
              </button>
            ))}
          </div>

          <div className="agent-messages">
            {messages.map((message) => (
              <article key={message.id} className={`agent-message ${message.role}`}>
                <p>{message.content}</p>
                {message.role === 'assistant' && message.usedTools && message.usedTools.length > 0 && (
                  <div className="agent-tools">
                    {message.usedTools.map((tool) => (
                      <span key={tool}>{toolLabels[tool] || tool}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {loading && (
              <article className="agent-message assistant is-loading">
                <Loader2 size={15} />
                <p>正在思考...</p>
              </article>
            )}
          </div>

          {usedToolLabels.length > 0 && (
            <div className="agent-status">
              {usedToolLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          )}

          <form className="agent-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问问小和..."
              maxLength={1000}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="发送">
              {loading ? <Loader2 size={18} className="agent-spin" /> : <Send size={18} />}
            </button>
          </form>
        </section>
      )}

      <button className="agent-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <MessageCircle size={18} />
        <span>小和</span>
      </button>
    </div>
  );
}
