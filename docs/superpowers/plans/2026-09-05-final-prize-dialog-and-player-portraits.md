# Final Prize Dialog And Player Portraits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatic prize-email dialog and clickable player portraits to the final leaderboard.

**Architecture:** Reuse one shared portrait lightbox in both projector and final views. Keep prize eligibility in the existing prize module and let the final scoreboard own modal open/close state.

**Tech Stack:** React, TypeScript, shadcn/ui Base UI Dialog, Vitest, Tailwind/CSS.

---

### Task 1: Lock final-screen behavior with tests

**Files:**
- Modify: `src/components/final-scoreboard.test.tsx`
- Modify: `src/components/prize-claims.test.tsx`
- Create: `src/components/player-portrait-lightbox.test.tsx`

- [ ] Assert the ranking switch says `Poissons`, each player has an enlarge action, and the shared portrait displays the selected player.
- [ ] Assert eligible guest sessions get a prize dialog and host/non-eligible sessions do not.
- [ ] Run `npm test -- src/components/final-scoreboard.test.tsx src/components/prize-claims.test.tsx src/components/player-portrait-lightbox.test.tsx` and confirm the new assertions fail.

### Task 2: Extract the shared portrait lightbox

**Files:**
- Create: `src/components/player-portrait-lightbox.tsx`
- Create: `src/components/player-portrait-lightbox.css`
- Modify: `src/projector/projector-screen.tsx`
- Modify: `src/projector/projector-screen.css`

- [ ] Move the existing accessible full-screen portrait UI and styling into the shared component.
- [ ] Replace the projector-local implementation without changing its lobby behavior.
- [ ] Run the projector and portrait component tests.

### Task 3: Add final leaderboard interaction and prize dialog

**Files:**
- Add: `src/components/ui/dialog.tsx`
- Modify: `src/components/final-scoreboard.tsx`
- Modify: `src/components/final-scoreboard.css`
- Modify: `src/components/prize-claims.tsx`

- [ ] Rename the individual tab and count to `Poissons`.
- [ ] Make player rows selectable and render the shared portrait lightbox.
- [ ] Open an accessible prize dialog automatically only when the authenticated player has eligible prizes.
- [ ] Preserve a reopen button after dialog dismissal and support multiple independent prize forms.
- [ ] Run the focused tests until green.

### Task 4: Verify and deliver

**Files:**
- Modify only files needed for discovered regressions.

- [ ] Run `npm test` and `npm run build`.
- [ ] Rebuild the Docker service and verify `/api/health`.
- [ ] Smoke-test the final screen in a browser at mobile width.
- [ ] Commit only tracked source/docs files and push `main`; keep `public/` untracked.
