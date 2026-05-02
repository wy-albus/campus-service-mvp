import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { postsRouter } from './routes/posts.js';
import { commentsRouter } from './routes/comments.js';
import { reportsRouter } from './routes/reports.js';
import { adminRouter } from './routes/admin.js';
import { usersRouter } from './routes/users.js';
import { universitiesRouter } from './routes/universities.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/universities', universitiesRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Forum API listening on http://localhost:${port}`);
});
