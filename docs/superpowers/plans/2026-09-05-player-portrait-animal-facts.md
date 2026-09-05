# Player Portrait and Animal Facts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic animal facts to each guest reveal and clickable full-screen player portraits to the TV lobby.

**Architecture:** Enrich the shared identity catalog, project the fields through the existing game and TV views, then render them in two isolated UI components. Keep the TV lightbox client-local so it never mutates game state.

**Tech Stack:** React 19, TypeScript, Vitest, shadcn/ui, Tailwind CSS, Express.

---

### Task 1: Identity metadata and API projections

**Files:**
- Modify: `shared/player-identities.ts`
- Modify: `shared/player-identities.test.ts`
- Modify: `shared/game.ts`
- Modify: `shared/tv.ts`
- Modify: `server/game-service.ts`
- Modify: `server/game-service.test.ts`
- Modify: `server/tv-app.test.ts`

- [x] Add failing assertions that every identity has a non-empty animal name and fact, including Nixon's whale fact.
- [x] Run `npm test -- shared/player-identities.test.ts server/game-service.test.ts server/tv-app.test.ts` and confirm the new fields fail.
- [x] Add `animalName` and `animalFact` to the catalog, game view, and safe TV projection.
- [x] Re-run the targeted tests and confirm they pass.

### Task 2: Mobile reveal fact card

**Files:**
- Modify: `src/components/totem-scan.tsx`
- Modify: `src/components/totem-scan.test.tsx`
- Modify: `src/App.tsx`

- [x] Add a failing rendering test for the animal title and fact.
- [x] Run `npm test -- src/components/totem-scan.test.tsx` and confirm it fails.
- [x] Extend `PlayerReveal` and render a compact shadcn Alert card above the team information.
- [x] Re-run the component test and confirm it passes.

### Task 3: TV portrait lightbox

**Files:**
- Modify: `src/projector/projector-screen.tsx`
- Modify: `src/projector/projector-screen.css`
- Modify: `src/projector/projector-screen.test.tsx`

- [x] Add failing assertions for accessible portrait buttons and the standalone lightbox markup.
- [x] Run `npm test -- src/projector/projector-screen.test.tsx` and confirm it fails.
- [x] Add local selection state, Escape/backdrop/close handling, and a large ocean-themed portrait overlay.
- [x] Re-run the projector tests and confirm they pass.

### Task 4: Regression and runtime verification

**Files:**
- No production file changes expected.

- [x] Run `npm test` and confirm the full suite passes.
- [x] Run `npm run build` and confirm TypeScript and Vite succeed.
- [x] Rebuild the Docker service and confirm `/api/health` is healthy.
- [x] Open a lobby TV route, click a portrait, and verify the lightbox visually.
- [ ] Commit and push the implementation without staging the untracked `public/` directory.
