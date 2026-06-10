# Project Map

## Frontend

- App entry: `src/App.tsx`, `src/main.tsx`
- Shared layout/navigation: `src/components/Layout.tsx`, `src/components/Navbar.tsx`
- Global styling and fixed widgets: `src/styles/global.css`
- API helper and auth token storage: `src/lib/api.ts`
- Main pages:
  - Home: `src/pages/Home.tsx`
  - Study tools: `src/pages/Resources.tsx`
  - University guide: `src/pages/Gallery.tsx`
  - Forum: `src/pages/Forum.tsx`
  - Changelog: `src/pages/Changelog.tsx`
  - About/feedback: `src/pages/About.tsx`

## Backend

- Server bootstrap and route mounting: `server/src/index.js`
- Auth and registration: `server/src/routes/auth.js`
- Posts and post deletion: `server/src/routes/posts.js`
- Comments and comment deletion: `server/src/routes/comments.js`
- User reports: `server/src/routes/reports.js`
- Admin reports/feedback moderation: `server/src/routes/admin.js`
- Site feedback submission: `server/src/routes/feedback.js`
- University areas API: `server/src/routes/universities.js`
- Request validation: `server/src/utils/validators.js`
- Registration abuse guard: `server/src/middleware/registerGuard.js`

## Database

- Prisma schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/`
- Core models: `User`, `Post`, `Comment`, `Like`, `Report`, `UniversityArea`, `Feedback`

When adding a persistent feature, update the Prisma model, add a migration, update validators, add or extend a route, mount it in `server/src/index.js`, then update the relevant frontend page.

## Deployment

- GitHub Pages workflow: `.github/workflows/deploy-pages.yml`
- GitHub Pages build env:
  - `VITE_BASE_PATH=/campus-service-mvp/`
  - `VITE_API_BASE_URL=https://campus-service-api.onrender.com/api`
- Render backend deploy runs Prisma generate and migration deploy through `npm run server:build`.

## Common Change Paths

- Add a forum moderation action: `src/pages/Forum.tsx` -> `server/src/routes/admin.js` -> related route/model.
- Add a public form: frontend page -> `server/src/utils/validators.js` -> route under `server/src/routes/` -> mount in `server/src/index.js`.
- Add a database table: `server/prisma/schema.prisma` + new folder in `server/prisma/migrations/`.
- Change visual glass/card styling: prefer shared UI files in `src/components/ui/` first, then page-specific classes.
