# Deployment Guide

This project is designed to deploy from one GitHub repository:

- Frontend: Netlify or GitHub Pages
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
CLIENT_ORIGINS="http://localhost:5173,http://localhost:5174,https://your-netlify-site.netlify.app,https://your-github-username.github.io"
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

To give an existing registered user administrator privileges, run this from Render Shell:

```bash
npm run prisma:promote-admin -- user@example.com
```

Free Render instances may not provide Shell access. In that case, set one of these environment variables in Render and redeploy:

```env
PROMOTE_ADMIN_EMAILS="user@example.com"
```

Multiple admin emails can be separated by commas. On server startup, existing users with those emails are promoted to `ADMIN`.

Admins can delete forum posts/comments and handle reports. Do not expose this command or database credentials to frontend users.

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
VITE_BASE_PATH="/"
```

Netlify can continue to use same-origin `/api` requests. Do not set `VITE_API_BASE_URL` unless you intentionally want to bypass the Netlify proxy.
For the production Netlify site, `netlify.toml` proxies same-origin API requests:

```text
/api/* -> https://campus-service-api.onrender.com/api/*
```

This avoids browser cross-origin failures for forum login/register requests.

## 5. GitHub Pages Frontend Deployment

GitHub Pages can host the same Vite frontend, but it cannot provide the Netlify `/api` proxy.

GitHub Pages build environment variables:

```env
VITE_BASE_PATH="/your-repository-name/"
VITE_API_BASE_URL="https://your-render-service.onrender.com/api"
```

If you deploy GitHub Pages at a custom root domain, use `VITE_BASE_PATH="/"` instead.

Render must include the GitHub Pages origin in `CLIENT_ORIGINS`, for example:

```env
CLIENT_ORIGINS="http://localhost:5173,http://localhost:5174,https://your-netlify-site.netlify.app,https://your-github-username.github.io"
```

For local development, the frontend defaults to `/api`, and Vite proxies `/api` to `http://localhost:4000`.

## 6. Local Development

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`, then use a local or cloud PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="dev-secret"
CLIENT_ORIGINS="http://localhost:5173,http://localhost:5174"
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

## 7. Deployment Test Checklist

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

- `https://your-netlify-site.netlify.app/api/health` returns `{ "ok": true }`
- Netlify keeps `netlify.toml` `/api` proxy enabled
- GitHub Pages sets `VITE_API_BASE_URL` to the Render backend URL, including `/api`
- Render `CLIENT_ORIGINS` includes every frontend origin that should call the backend
- Render backend `/api/health` returns `{ "ok": true }`
- PostgreSQL `DATABASE_URL` is correct
- Prisma migrations completed during Render build
