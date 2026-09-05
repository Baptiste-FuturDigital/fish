# Projector View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a read-only, full-screen 16:9 display that follows one Fish Tournament from lobby to final verdict.

**Architecture:** `main.tsx` selects `ProjectorApp` only for `/tv/CODE` (with `/tv?code=CODE` compatibility); normal application state remains untouched. `ProjectorApp` reads `code` from the URL and polls the sanitized read-only `/api/games/:code/tv` endpoint. Pure presentation components map each `TvGameView` status and tournament phase to a projector scene, with no mutation callback, technical player identifier, or player session.

**Tech Stack:** React, TypeScript, existing Game API, CSS, qrcode.react, Vitest.

---

### Task 1: Route and state projection

**Files:**
- Create: `src/projector/projector-route.ts`
- Test: `src/projector/projector-route.test.ts`

- [ ] Write tests proving `/tv/fish` resolves to `FISH`, `/tv?code=fish` remains compatible, and ordinary routes do not activate projector mode.
- [ ] Run `npm test -- --run src/projector/projector-route.test.ts` and observe the missing-module failure.
- [ ] Implement route detection, code normalization, join URL construction, and display-state selection as pure functions.
- [ ] Re-run the focused test and expect PASS.

### Task 2: Projector scenes

**Files:**
- Create: `src/projector/projector-screen.tsx`
- Create: `src/projector/projector-screen.css`
- Test: `src/projector/projector-screen.test.tsx`

- [ ] Write render tests covering lobby, challenge intro, answering, reveal, individual leaderboard, and finished team winner.
- [ ] Run `npm test -- --run src/projector/projector-screen.test.tsx` and observe the missing-module failure.
- [ ] Implement semantic, read-only scenes using existing `GameView` data and local QR rendering.
- [ ] Implement a centered 16:9 letterboxed stage with readable display typography, ocean atmosphere, and reduced-motion support.
- [ ] Re-run the focused test and expect PASS.

### Task 3: Polling shell and entry-point branch

**Files:**
- Create: `src/projector/projector-app.tsx`
- Modify: `src/main.tsx`

- [ ] Implement non-overlapping 1-second polling of `gameApi.get(code)`, retaining the last good frame on transient errors.
- [ ] Branch in `main.tsx` on `/tv` without importing projector code into the normal route bundle eagerly.
- [ ] Run focused unit tests, `npm test -- --run`, and `npm run build`.
- [ ] Verify `/tv/<code>` against the local API and confirm there are no buttons or mutation calls.

### Task 4: Integration handoff

**Files:**
- Modify: none.

- [ ] Run `git diff --check` and report only the projector files, dependency changes, focused test result, build result, and the minimal `main.tsx` branch to the parent orchestrator.
- [ ] Do not stage or commit because the parent orchestrator owns the shared integration commit.
