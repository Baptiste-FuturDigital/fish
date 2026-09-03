# Demo, Leaderboard et Finale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a server-backed demo, pressure-building inter-challenge leaderboard and animated Poseithon victory finale.

**Architecture:** Extend the authoritative tournament state machine with a leaderboard phase and a persisted demo flag. Keep demo seeding server-side; render leaderboard and finale as isolated React components.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Express, SQLite, Vitest, Playwright, Docker

---

### Task 1: State-machine leaderboard

**Files:** `shared/game.ts`, `server/game-service.ts`, `server/game-service.test.ts`, `src/components/leaderboard-screen.tsx`.

- [x] Add a failing service test for `reveal → leaderboard → next challenge intro`.
- [x] Add `leaderboard` to the tournament phase contract.
- [x] Persist the leaderboard phase between the first three challenges.
- [x] Render ranked teams and give the host one next-challenge action.

### Task 2: Server-backed demo

**Files:** `server/db.ts`, `server/game-service.ts`, `server/app.ts`, `src/api.ts`, tests.

- [x] Add failing service and API tests for a ready-to-play eight-player demo.
- [x] Persist an `is_demo` flag and create four balanced two-player teams.
- [x] Fill missing demo-team answers deterministically before reveal.
- [x] Expose `POST /api/demo` and the `/?demo=1` launcher.

### Task 3: Easter egg and finale

**Files:** `src/App.tsx`, `src/components/final-scoreboard.tsx`, component CSS, Playwright test.

- [x] Add failing browser assertions for the Fish Party link and finale decorations.
- [x] Open the YouTube Short in a safe new tab.
- [x] Add Poséithon, winner treatment, confetti, bubbles and fish motion.
- [x] Respect reduced-motion preferences.

### Task 4: Delivery

- [x] Run unit tests, build and the mobile Playwright journey.
- [x] Rebuild Docker and verify `/api/health`.
- [x] Commit project-owned changes and push `main`.
