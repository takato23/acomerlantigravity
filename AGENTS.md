# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains Next.js App Router routes and API handlers.
- `src/features/` holds feature modules (components, hooks, services, types, utils).
- `src/services/` includes domain services (meal planning, pantry, shopping, profile, scanner).
- `src/components/` is the shared UI layer; `src/lib/` hosts integrations (AI, Supabase, utils).
- `docs/` stores architecture and feature documentation; `tests/` and `e2e/` contain unit/integration and Playwright specs.
- `public/` is for static assets; `supabase/` and root `*.sql` files cover database setup/migrations.

## Build, Test, and Development Commands
- `npm run dev` запуска la app localmente en `http://localhost:3010`.
- `npm run dev:https` inicia HTTPS local via `server.js`.
- `npm run build` / `npm run start` generan y sirven el build de producción.
- `npm run lint` y `npm run type-check` validan ESLint y TypeScript (strict).
- `npm run test` / `npm run test:watch` ejecutan Jest; `npm run test:e2e` corre Playwright.
- `npm run db:reset` / `npm run db:migrate` / `npm run db:generate` operan Supabase (requieren envs).
- `npm run storybook` levanta Storybook para UI.

## Coding Style & Naming Conventions
- TypeScript estricto; ESLint con `next/core-web-vitals` y `@typescript-eslint`.
- UI con Tailwind; variantes con `class-variance-authority` cuando aplica.
- Componentes en PascalCase (`RecipeCard.tsx`), funciones camelCase, constantes UPPER_SNAKE_CASE.
- Import order: React → terceros → internos absolutos → relativos → types → estilos.

## Testing Guidelines
- Unit/integration: Jest + Testing Library (`*.test.ts`, `*.test.tsx`) en `tests/` o junto a la feature.
- E2E: Playwright en `e2e/` con `*.spec.ts`.
- No se detectó umbral de coverage fijo; agregá tests para flujos críticos.

## Commit & Pull Request Guidelines
- Convención única: `<type>(scope): <subject>` (scope requerido).
- `subject` en imperativo, minúsculas, sin punto final, máximo 72 caracteres.
- Sin emojis.
- Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`, `style`, `revert`.
- PRs: descripción clara, pruebas ejecutadas, links a issues y screenshots si hay cambios UI.

## Configuration & Secrets
- Usa `.env`/`.env.local`; solo variables públicas con `NEXT_PUBLIC_*`.
- Claves privadas (Supabase, AI) deben mantenerse server-side.

## Documentation & Architecture
- Actualizá `docs/SYSTEM_ARCHITECTURE.md`, `docs/FEATURES_DOCUMENTATION.md` y `docs/DEVELOPMENT_GUIDELINES.md` cuando cambies flujos.
- Nuevas features deben vivir en `src/features/<feature>` y exponer servicios en `src/services/`.
