# Salmon Round Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 30-second Salmon rounds, persistent host music control, bottom-up image reveals, and player-specific result bursts.

**Architecture:** The existing host-only `SalmonRoundAudio` owns a local mute state across round changes. `ChallengeScreen` passes the authoritative player result into `WhosThatSalmonStage`, which renders a presentation-only animation.

**Tech Stack:** React 19, TypeScript, YouTube iframe API, CSS animations, Vitest, Playwright

---

### Task 1: Extend every Salmon round to 30 seconds

**Files:**
- Modify: `shared/challenges/whos-dat-salmon.ts`
- Modify: `shared/challenges/whos-dat-salmon.test.ts`

- [ ] **Step 1: Write the failing duration assertion**

```ts
expect(whosDatSalmon.rounds.map((round) => round.durationSeconds)).toEqual([30, 30, 30, 30])
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- shared/challenges/whos-dat-salmon.test.ts`

Expected: FAIL with current values `[20, 20, 20, 20]`.

- [ ] **Step 3: Change each duration to 30 and verify GREEN**

Run: `npm test -- shared/challenges/whos-dat-salmon.test.ts`

Expected: PASS.

### Task 2: Add persistent host control for background music

**Files:**
- Modify: `src/components/salmon-round-audio.tsx`
- Modify: `src/components/salmon-round-audio.test.tsx`
- Modify: `src/components/challenge-audio-control.ts`
- Modify: `src/components/challenge-audio.test.ts`

- [ ] **Step 1: Write failing audio-control tests**

Render `SalmonRoundAudio`, click `Couper la musique Pokémon`, rerender with another `roundId`, and assert the control still says `Relancer la musique Pokémon`. Click again and assert the background controller receives `unMute` and `playVideo`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/components/salmon-round-audio.test.tsx src/components/challenge-audio.test.ts`

Expected: FAIL because Salmon audio currently renders only hidden iframes.

- [ ] **Step 3: Implement local persistent mute state**

Store `musicMuted` in `SalmonRoundAudio`, render an accessible host button next to the hidden iframes, and expose `muteBackground()` / `resumeBackground()` commands from the session controller. Round changes must not reset `musicMuted`; unmounting after the challenge may reset it.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/salmon-round-audio.test.tsx src/components/challenge-audio.test.ts`

Expected: PASS.

### Task 3: Animate the reveal and player result

**Files:**
- Modify: `src/components/whos-that-salmon-stage.tsx`
- Modify: `src/components/whos-that-salmon-stage.css`
- Modify: `src/components/whos-that-salmon-stage.test.tsx`
- Modify: `src/components/challenge-screen.tsx`
- Modify: `src/components/challenge-screen.test.tsx`
- Modify: `e2e/whos-that-salmon-game.spec.ts`

- [ ] **Step 1: Write failing verdict tests**

Test reveal markup for `{ isCorrect: true, points: 2 }` containing `+20 points`, and for `{ isCorrect: false, points: 0 }` containing `Réponse incorrecte`. Assert the master render contains neither personal feedback.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/components/whos-that-salmon-stage.test.tsx src/components/challenge-screen.test.tsx`

Expected: FAIL because the stage accepts no player result.

- [ ] **Step 3: Implement the non-modal feedback**

Add an optional `playerResult` prop with `isCorrect` and `points`. During reveal, render a `pointer-events: none` burst anchored near the lower image edge. Use `AnimatedScore` or `toDisplayPoints` so `2` displays as `20`. Add `role="status"`/`aria-live="polite"`, and render a red X for wrong or missing answers.

- [ ] **Step 4: Replace blur with bottom-up reveal motion**

Change `salmon-reveal-frame` to animate from `opacity: 0`, `transform: translateY(8%)` and `clip-path: inset(100% 0 0)` to the fully visible image. Do not use `filter: blur(...)`. Preserve reduced-motion behavior.

- [ ] **Step 5: Verify component and mobile E2E tests**

Run: `npm test -- src/components/whos-that-salmon-stage.test.tsx src/components/challenge-screen.test.tsx && npx playwright test e2e/whos-that-salmon-game.spec.ts --project=mobile-chrome`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add shared/challenges/whos-dat-salmon.ts shared/challenges/whos-dat-salmon.test.ts src/components/salmon-round-audio.tsx src/components/salmon-round-audio.test.tsx src/components/challenge-audio-control.ts src/components/challenge-audio.test.ts src/components/whos-that-salmon-stage.tsx src/components/whos-that-salmon-stage.css src/components/whos-that-salmon-stage.test.tsx src/components/challenge-screen.tsx src/components/challenge-screen.test.tsx e2e/whos-that-salmon-game.spec.ts
git commit -m "feat: polish salmon round experience"
```

