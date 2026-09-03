# Four-Challenge Tournament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a mobile multiplayer tournament with balanced totem teams, four consecutive timed challenges, shared team answers, host pacing and a final scoreboard.

**Architecture:** Four isolated challenge definition modules feed one server-side state machine. SQLite owns team membership, answers, deadlines and scores; React renders generic intro, answering and reveal phases from a typed `GameView`.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Express, better-sqlite3, Vitest, Playwright, Docker

---

### Task 1: Typed challenge catalog

**Files:** `shared/challenges/types.ts`, `shared/challenges/catalog.ts`, four challenge modules and their tests.

- [ ] Define discriminated round types for numeric and choice answers, public round projection, score results and challenge metadata.
- [ ] Have four independent agents create one definition module each with deterministic IDs, timers, answers, reveal text, point values and music IDs.
- [ ] Test catalog uniqueness, expected round counts (`3 + 5 + 10 + 5`) and answer validity.
- [ ] Run `npm test`; all content tests must pass.

### Task 2: Balanced teams and editable names

**Files:** `server/db.ts`, `server/totems.ts`, `server/game-service.ts`, `shared/game.ts`, service/API tests.

- [ ] Add failing tests proving that the first four claims occupy four different teams and that twenty claims produce four teams of five.
- [ ] Add `game_teams` and migrate existing databases safely.
- [ ] Select a random unused totem inside a least-populated category.
- [ ] Expose team IDs, names, scores and members without exposing category labels.
- [ ] Add authenticated `renameTeam`; reject players renaming another team.

### Task 3: Authoritative tournament state machine

**Files:** `server/db.ts`, `server/tournament-engine.ts`, `server/game-service.ts`, `shared/game.ts`, tests.

- [ ] Add failing tests for `intro → answering → reveal → next round → next challenge → finished`.
- [ ] Persist `challenge_order`, challenge/round indexes, phase, deadline and scored marker.
- [ ] Add `advanceTournament`, `submitTeamAnswer` and idempotent deadline synchronization.
- [ ] Rank numeric answers by relative error; score choice answers and escalating final-game values.
- [ ] Return a projection that hides correct answers before reveal.

### Task 4: API and client data flow

**Files:** `server/app.ts`, `src/api.ts`, `src/hooks/use-game.ts`, API tests.

- [ ] Add authenticated routes for team rename and answer submit plus host advance.
- [ ] Extend client API and hook actions.
- [ ] Poll every second while running and avoid overlapping refresh requests.
- [ ] Verify invalid capability tokens and locked answers return actionable errors.

### Task 5: Mobile team lobby

**Files:** `src/components/team-board.tsx`, `src/App.tsx`, `src/index.css`, Playwright test.

- [ ] Add a failing four-player journey asserting four visible team cards and editable own-team name.
- [ ] Render each team’s name, score, totem thumbnails and members.
- [ ] Keep the scan reveal theatrical and show team assignment only after the reveal.
- [ ] Make host readiness and missing scans explicit.

### Task 6: Generic challenge UI and host controls

**Files:** `src/components/challenge-screen.tsx`, `src/components/challenge-audio.tsx`, `src/App.tsx`, `src/index.css`, Playwright test.

- [ ] Render challenge intro, rules and correct YouTube music.
- [ ] Render numeric or A/B/C/D controls from the round type, shared team selection, validation state and countdown.
- [ ] Render reveal image/fact, correct answer, per-team result and updated scoreboard.
- [ ] Add sticky host controls for start, early reveal, next round and finish.

### Task 7: Final scoreboard and complete delivery

**Files:** `src/components/final-scoreboard.tsx`, `src/App.tsx`, Docker image, tests.

- [ ] Rank teams with deterministic tie handling and crown the winning fish.
- [ ] Run `npm test`, `npm run build` and the full Playwright mobile journey.
- [ ] Rebuild Docker, verify `/api/health` and inspect mobile screenshots with no console errors.
- [ ] Commit project-owned changes, preserve unrelated user files and push `main`.

