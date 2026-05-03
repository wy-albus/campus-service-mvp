const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'forum-token';

export type ForumUser = {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function requestWithRetry(url: string, options: RequestInit) {
  try {
    return await fetch(url, options);
  } catch (error) {
    await wait(1400);
    try {
      return await fetch(url, options);
    } catch {
      throw new Error(
        '无法连接后端服务。Render 免费服务可能正在休眠或网络暂时阻断，请等待 30 秒后刷新重试。',
      );
    }
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await requestWithRetry(`${API_BASE}${path}`, {
    ...options,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }
  return data as T;
}
