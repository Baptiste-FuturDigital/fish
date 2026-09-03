# Fish Tournament MVP Implementation Plan

> **For agentic workers:** Execute inline with strict red-green-refactor cycles; the user explicitly requested uninterrupted end-to-end delivery.

**Goal:** Deliver a locally persistent, phone-accessible multiplayer party game covering create, join, lobby, multiple rounds, and finish.

**Architecture:** A Vite React client and Express API run from one repository. SQLite owns game/player state, seeded TypeScript prompts define the content, and clients poll a single room-state endpoint.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Express, better-sqlite3, Vitest, Supertest, Playwright.

---

### Task 1: Project foundation

**Files:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `components.json`, `src/index.css`

- [x] Scaffold Vite React TypeScript and install runtime/test dependencies.
- [x] Initialize shadcn/ui and add Button, Card, Input, Badge, Alert, Skeleton, Separator, Avatar, Field, and Sonner.
- [x] Configure scripts for development, build, test, and production.

### Task 2: Persisted game lifecycle

**Files:** `server/db.ts`, `server/game-service.ts`, `server/content.ts`, `server/game-service.test.ts`

- [x] Write failing tests for create, join, duplicate-name rejection, start, advance, and finish.
- [x] Run tests and verify failures are caused by the missing game service.
- [x] Implement the minimal SQLite schema and game service.
- [x] Run tests and verify the lifecycle passes.

### Task 3: HTTP API

**Files:** `server/app.ts`, `server/index.ts`, `server/app.test.ts`, `shared/game.ts`

- [x] Write failing HTTP lifecycle and authorization tests.
- [x] Implement validated endpoints and production static-file serving.
- [x] Verify HTTP tests pass.

### Task 4: Mobile client

**Files:** `src/App.tsx`, `src/api.ts`, `src/hooks/use-game.ts`, `src/components/*.tsx`, `src/index.css`

- [x] Write a failing browser lifecycle test before client implementation.
- [x] Implement home, lobby, game, host controls, and end screen with persisted browser identity.
- [x] Apply the aquarium-party visual system using shadcn composition and semantic tokens.
- [x] Build and resolve TypeScript, accessibility, and console errors.

### Task 5: End-to-end delivery

**Files:** `README.md`, `playwright.config.ts`, `e2e/game.spec.ts`

- [x] Run unit and API tests.
- [x] Run the browser test with multiple isolated players and mobile viewport.
- [x] Launch the production build on all interfaces.
- [x] Expose it through a temporary Cloudflare tunnel and provide the test URL.
