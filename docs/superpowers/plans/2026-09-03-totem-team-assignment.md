# Totem Team Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assign one unique marine totem and one balanced category-derived team to every lobby player through a five-second theatrical face scan.

**Architecture:** SQLite owns the uniqueness invariant. A player-authenticated API endpoint atomically reserves a totem from a server-only catalog; React only controls the camera preview and reveal delay. Optimized opaque image paths prevent category names from appearing in the UI.

**Tech Stack:** React, TypeScript, Express, SQLite, shadcn/ui, Playwright, Vitest, Docker

---

### Task 1: Server assignment model

**Files:** `shared/game.ts`, `server/totems.ts`, `server/db.ts`, `server/game-service.ts`, `server/game-service.test.ts`

- [ ] Add failing tests proving unique and idempotent assignment, twenty-player capacity, and start rejection while a player lacks a totem.
- [ ] Run `npm test`; expect failures because `claimTotem` and the view model do not exist.
- [ ] Add `TotemView`, a twenty-entry server catalog, the migrated `totem_id` column and unique index.
- [ ] Implement `claimTotem(code, playerId, playerToken)` as one SQLite transaction and expose totems through `PlayerView` without IDs/categories.
- [ ] Enforce the twenty-player limit and require all players to claim before start.
- [ ] Run `npm test`; expect all service tests to pass.

### Task 2: Player API

**Files:** `server/app.ts`, `server/app.test.ts`, `src/api.ts`, `src/hooks/use-game.ts`

- [ ] Add a failing API test for authenticated claim and stable repeated claim.
- [ ] Run `npm test`; expect 404 for the missing endpoint.
- [ ] Add `POST /api/games/:code/totem` with `playerId` and `playerToken` validation.
- [ ] Add `gameApi.claimTotem` and a `claimTotem` hook action that updates local game state.
- [ ] Run `npm test`; expect all API tests to pass.

### Task 3: Scan and reveal interface

**Files:** `src/components/totem-scan.tsx`, `src/App.tsx`, `src/index.css`, `e2e/game.spec.ts`

- [ ] Extend the mobile journey test to claim host and guest totems, assert distinct images and names, then start the game.
- [ ] Run the Playwright test; expect failure because the scan control does not exist.
- [ ] Build `TotemScan`: camera preview with local-only `getUserMedia`, fallback face, five-second progress, cleanup, and reveal card.
- [ ] Render it above the lobby code, show totem thumbnails in player chips, and explain incomplete scans beside the disabled start action.
- [ ] Run `npm run test:e2e -- --reporter=line && npm test && npm run build`; expect all checks to pass.

### Task 4: Assets and delivery

**Files:** `public/totems/*`, `public/favicon.svg`, Docker image

- [ ] Generate opaque JPEG derivatives at 1,200 px maximum without modifying source images.
- [ ] Replace the favicon glyph with `🐡`.
- [ ] Rebuild using `docker compose up --build -d`.
- [ ] Verify `/api/health`, all twenty optimized images, and the complete two-player journey.
- [ ] Commit only project changes; preserve unrelated user files.
