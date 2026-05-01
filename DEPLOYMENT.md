# Deployment Guide

This project is designed to deploy from one GitHub repository:

- Frontend: Netlify
- Backend: Render Web Service
- Database: PostgreSQL
- ORM: Prisma

## 1. Repository Safety

The repository should not include local secrets or local database files.

Ignored files include:

- `.env`
- `.env.*`
- `server/.env`
- `server/.env.*`
- `server/prisma/dev.db`
- `node_modules/`
- `dist/`
- `*.tsbuildinfo`

Template files are intentionally public:

- `.env.example`
- `server/.env.example`

## 2. PostgreSQL Database

Create a PostgreSQL database before deploying the backend.

Recommended options:

- Render PostgreSQL
- Neon
- Supabase
- Railway PostgreSQL

Copy the database connection string and set it as `DATABASE_URL`.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

The Prisma schema is configured for PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 3. Render Backend Deployment

Create a new Render Web Service from the GitHub repository.

Render settings:

```text
Root Directory: leave empty
Environment: Node
Build Command: npm install && npm run server:build
Start Command: npm run server:start
```

Environment variables:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="use-a-long-random-secret"
CLIENT_ORIGIN="https://your-netlify-site.netlify.app"
NODE_ENV="production"
ADMIN_EMAIL="your-admin-email@example.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="use-a-strong-password"
```

Render provides `PORT` automatically. The backend reads `process.env.PORT`, so do not hard-code it.

The Render build runs:

```bash
npm run prisma:generate
npm run prisma:deploy
```

`prisma migrate deploy` applies the checked-in migrations to the PostgreSQL database.

After the first successful backend deploy, create the admin account by running the seed command from Render Shell:

```bash
npm run prisma:seed
```

## 4. Netlify Frontend Deployment

Create a new Netlify site from the same GitHub repository.

Netlify settings:

```text
Base directory: leave empty
Build command: npm run build
Publish directory: dist
```

Environment variables:

```env
VITE_API_BASE_URL="https://your-render-service.onrender.com/api"
```

The frontend reads the backend address from `VITE_API_BASE_URL`.

For local development, the frontend defaults to `/api`, and Vite proxies `/api` to `http://localhost:4000`.

## 5. Local Development

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`, then use a local or cloud PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="dev-secret"
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
ADMIN_EMAIL="admin@example.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-this-password"
```

Apply migrations:

```bash
npm run prisma:migrate
```

Seed the admin account:

```bash
npm run prisma:seed
```

Start backend:

```bash
npm run server:dev
```

Start frontend in another terminal:

```bash
npm run dev
```

## 6. Deployment Test Checklist

After Render deploys, open:

```text
https://your-render-service.onrender.com/api/health
```

Expected response:

```json
{ "ok": true }
```

After Netlify deploys:

1. Open the Netlify site.
2. Enter the forum page.
3. Register a normal user.
4. Log in.
5. Create a post.
6. Open the post detail.
7. Add a comment.
8. Like and unlike the post.
9. Report the post or a comment.
10. Log in with the seeded admin account.
11. Confirm the admin can view reports and delete posts/comments.

If requests fail in the browser, check:

- Netlify `VITE_API_BASE_URL` includes `/api`
- Render `CLIENT_ORIGIN` exactly matches the Netlify site origin
- Render backend `/api/health` returns `{ "ok": true }`
- PostgreSQL `DATABASE_URL` is correct
- Prisma migrations completed during Render build
