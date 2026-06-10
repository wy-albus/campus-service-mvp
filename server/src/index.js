import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { postsRouter } from './routes/posts.js';
import { commentsRouter } from './routes/comments.js';
import { reportsRouter } from './routes/reports.js';
import { feedbackRouter } from './routes/feedback.js';
import { adminRouter } from './routes/admin.js';
import { agentRouter } from './routes/agent.js';
import { usersRouter } from './routes/users.js';
import { universitiesRouter } from './routes/universities.js';
import { bootstrapAdmins } from './utils/bootstrapAdmins.js';

const app = express();
const port = Number(process.env.PORT || 4000);

function parseClientOrigins() {
  const configured = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const clientOrigins = parseClientOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/universities', universitiesRouter);
app.use('/api/agent', agentRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error.' });
});

bootstrapAdmins()
  .catch((error) => {
    console.error('Admin bootstrap failed:', error);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Forum API listening on http://localhost:${port}`);
    });
  });
