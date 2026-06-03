import { Router } from 'express';
import { runCampusAgent } from '../services/doubaoAgent.js';

export const agentRouter = Router();

agentRouter.post('/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();

  if (!message) {
    return res.status(400).json({
      reply: '请先输入你想问的问题。',
      usedTools: [],
      error: 'message is required',
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      reply: '这次问题有点长，请精简后再发给校园助手。',
      usedTools: [],
      error: 'message is too long',
    });
  }

  try {
    const result = await runCampusAgent(message);
    return res.json({
      reply: result.reply,
      usedTools: result.usedTools || [],
    });
  } catch (error) {
    console.error('[Agent] chat failed:', error.message);
    return res.status(error.status || 500).json({
      reply: '校园助手暂时不可用，请稍后再试。',
      usedTools: [],
      error: error.status === 503 ? error.message : 'agent request failed',
    });
  }
});
