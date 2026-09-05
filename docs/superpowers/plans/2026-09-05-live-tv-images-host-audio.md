# Live TV Images And Host Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Question pour un poisson animal visuals from the projector and make all game music manually controllable from the host phone.

**Architecture:** Keep challenge data unchanged and specialize projector layout by challenge id. Replace screen-scoped autoplay players with one host-only soundboard that selects tracks from the current `GameView` and embeds a user-controlled YouTube player.

**Tech Stack:** React, TypeScript, YouTube embeds, Vitest, Playwright, Vite

---

### Task 1: Hide Question pour un poisson visuals on TV

**Files:**
- Modify: `src/projector/projector-screen.tsx`
- Modify: `src/projector/projector-screen.css`
- Test: `src/projector/projector-screen.test.tsx`

- [ ] Add failing answering and reveal tests proving the round animal URL is absent for `question-pour-un-poisson`.
- [ ] Run the focused test and confirm it fails because the image is rendered.
- [ ] Skip `RoundVisual` for this challenge and switch both projector grids to a full-width layout.
- [ ] Verify the focused projector tests pass.

### Task 2: Add a persistent host soundboard

**Files:**
- Create: `src/components/host-audio-console.tsx`
- Create: `src/components/host-audio-console.css`
- Create: `src/components/host-audio-console.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/challenge-screen.tsx`
- Modify: `src/components/final-reveal.tsx`

- [ ] Add failing tests for track selection across lobby, intro, answering, timer-end, salmon, and final phases.
- [ ] Run the focused test and confirm the console does not exist yet.
- [ ] Implement a host-only collapsible console with large track buttons and a visible native YouTube player.
- [ ] Mount it once from `App` and remove the automatic screen-scoped music renderers.
- [ ] Verify host/player rendering and focused audio tests pass.

### Task 3: Ship the incident fix

**Files:**
- Modify only the files from Tasks 1 and 2.

- [ ] Run `npm test -- --run` and expect all tests to pass.
- [ ] Run `npm run build` and expect a successful production build.
- [ ] Run critical Playwright journeys and expect them to pass.
- [ ] Commit, push `main`, deploy with `./scripts/pi/push.sh baptiste@192.168.1.15`, then verify LAN/public health.
