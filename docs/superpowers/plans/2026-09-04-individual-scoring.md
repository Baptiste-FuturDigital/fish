# Individual Scoring Implementation Plan

**Goal:** Make every player answer and score individually while preserving fair team scoring, add player intermission leaderboards, a comeback bonus, and answer-confirmation audio.

**Architecture:** SQLite owns player answers, idempotent personal results, team aggregates and intermission bonuses. React projects the same authoritative tournament state into personal answer controls, a Mario-Kart-like player leaderboard and the existing final team reveal.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Express, SQLite, Vitest, Playwright, Docker

---

### Task 1: Individual answer persistence and scoring

- [x] Add failing database/service/engine tests for one locked answer and one result per player.
- [x] Score every player; aggregate numeric team score from its closest member and choice team score once when any member is correct.
- [x] Keep scoring idempotent across repeated deadline synchronization.
- [x] Expose typed individual answers, personal results and team aggregates.

### Task 2: Personal mobile gameplay

- [x] Key the current answer by player ID instead of team ID.
- [x] Trigger the validation sound only from the player's submit gesture.
- [x] Update progress and reveal copy for individual participation.
- [x] Add component tests for personal locking and audio behavior.

### Task 3: Intermission player leaderboard

- [x] Render all non-host players ordered by score with rank, totem and bank.
- [x] Show the personal leaderboard after every challenge except the final one.
- [x] Preserve host pacing controls and the final team leaderboard.

### Task 4: Marée de Poséithon

- [x] Add a failing API/service test for one idempotent last-place bonus per intermission.
- [x] Persist and expose the chosen target and `+20` displayed-point outcome.
- [x] Let only the host invoke it; show the outcome to every player.

### Task 5: Verification and delivery

- [x] Update the multi-user Playwright journey for one response per player and both leaderboard modes.
- [x] Run unit/API/component tests, TypeScript build and full Playwright suite.
- [x] Rebuild Docker, verify health and localhost.
- [x] Commit project-owned files and push `main` without staging user assets.
