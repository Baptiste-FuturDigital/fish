# Demo Skip Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit Question pour un poisson to five rounds and add a safe demo-only jump to the next challenge.

**Architecture:** The server remains authoritative: it exposes `isDemo` in `GameView` and owns the skip transition behind host authentication. React only renders the control when the projected state proves it is valid.

**Tech Stack:** React, TypeScript, Express, SQLite, Vitest

---

### Task 1: Limit the question challenge

**Files:**
- Modify: `shared/challenges/question-pour-un-poisson.test.ts`
- Modify: `shared/challenges/question-pour-un-poisson.ts`

- [ ] Add an assertion that the challenge contains exactly five rounds.
- [ ] Run `npm test -- --run shared/challenges/question-pour-un-poisson.test.ts` and observe the eight-versus-five failure.
- [ ] Remove rounds six through eight and update the description to five animals.
- [ ] Re-run the targeted test and expect PASS.

### Task 2: Add the authoritative demo transition

**Files:**
- Modify: `shared/game.ts`
- Modify: `server/game-service.test.ts`
- Modify: `server/game-service.ts`
- Modify: `server/app.test.ts`
- Modify: `server/app.ts`

- [ ] Add failing tests proving a demo skips to the next challenge intro and a real game is rejected.
- [ ] Add `isDemo: boolean` to `GameView` and project the database flag.
- [ ] Implement `skipDemoChallenge(code, hostToken)` with host authentication, demo validation, next-challenge bounds checking, and round/buzzer reset.
- [ ] Expose `POST /api/games/:code/skip-challenge` using the existing host body schema.
- [ ] Run the service and API tests and expect PASS.

### Task 3: Add the host control

**Files:**
- Modify: `src/api.ts`
- Modify: `src/hooks/use-game.ts`
- Modify: `src/components/host-session-controls.test.tsx`
- Modify: `src/components/host-session-controls.tsx`
- Modify: `src/App.tsx`

- [ ] Add a failing render test for a running demo with another challenge.
- [ ] Add `gameApi.skipChallenge` and a `skipChallenge` hook callback.
- [ ] Render **Épreuve suivante** beside **Accueil · nouvelle partie** only when `isDemo && status === "running" && challengeIndex < challengeCount - 1`.
- [ ] Wire the callback through `App` and verify the component test passes.

### Task 4: Verify delivery

**Files:**
- Test: all existing unit tests

- [ ] Run `npm test -- --run` and expect all tests to pass.
- [ ] Run `npm run build` and expect a successful Vite production build.
- [ ] Run `docker compose up -d --build`.
- [ ] Verify `GET http://localhost:8787/api/health` returns `{"status":"ok"}`.
