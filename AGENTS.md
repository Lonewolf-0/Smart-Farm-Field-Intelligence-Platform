# AGENTS.md

## What this repo is
- Split app: `backend/` is a TypeScript Express REST API and `frontend/` is a Vite React SPA.
- The backend is the source of business rules; the frontend mostly composes routes, context providers, and UI pages.
- Core domains are weather, fields, analysis, authentication, and branch lookup.

## Architecture you should preserve
- Backend follows `controller -> service -> repository` throughout `backend/src/controllers`, `backend/src/services`, and `backend/src/repositories`.
- Routes are mounted in `backend/src/index.ts` under `/api/auth`, `/api/weather`, `/api/analysis`, `/api/fields`, and `/api/branches`.
- Repositories use raw PostgreSQL SQL, including spatial logic (see `backend/src/repositories/branchRepository.ts` for the nearest-branch Haversine query).
- Auth is JWT-based; `backend/src/middlewares/authMiddleware.ts` attaches the DB user to `req.user` and rejects missing/invalid tokens.

## Frontend structure
- App composition starts in `frontend/src/App.tsx`: `AuthProvider` + `FieldProvider` wrap `Layout`, and protected routes guard `/map`, `/analytics`, and `/branches`.
- Use the page/component/context split already present in `frontend/src/pages`, `frontend/src/components`, and `frontend/src/context`.
- The app includes Vercel analytics/speed-insights, React Router, and Leaflet-based mapping.

## Environment and integrations
- Backend env loading is centralized in `backend/src/config/env.ts`; required vars include `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `OPENWEATHER_API_KEY`, and `OPENWEATHER_BASE_URL`.
- Frontend expects `VITE_API_URL` and only exposes `VITE_`-prefixed env vars.
- External integrations currently include OpenWeather, Sentinel Hub, NASA POWER, PostgreSQL/PostGIS, and spatial queries.

## Developer workflow
- Backend commands: `npm run dev`, `npm run build`, `npm start`, `npm test`, `npm run test:coverage`, `npm run initdb`.
- Frontend commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run preview`.
- Run backend and frontend from their own directories; the repo root is documentation-first.

## Conventions to follow
- TypeScript is strict; avoid `any` unless a file already uses it and the change is localized.
- Use `sendResponse(...)` for API responses instead of ad hoc JSON shapes when editing backend controllers.
- Keep JSDoc/comments on complex heuristic or math-heavy logic, especially in services like `backend/src/services/weatherService.ts`.
- Preserve Conventional Commits and branch naming from `CONTRIBUTING.md` (`feature/<issue>-<desc>`, `bugfix/<issue>-<desc>`, etc.).

## When making changes
- If you touch backend behavior, check the paired route/controller/service/repository chain, not just one file.
- If you change data shape or API payloads, update `backend/API_DOCS.md` and the relevant frontend consumer.
- Prefer the existing domain data files in `backend/src/data` before introducing new constants or magic values.

