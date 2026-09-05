# Gameplay Ranges and Host Timer Pause Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the requested `Le juste poisson` slider ranges and add a server-authoritative pause/resume control to the `Question pour un poisson` host clock.

**Architecture:** Keep numeric answers canonical in kilograms. Represent a manual buzzer-round pause with the existing database columns: `phase_ends_at = NULL`, `buzz_paused_ms > 0`, and no active buzz. Add one authenticated toggle endpoint and thread it through the existing API, hook, and screen props.

**Tech Stack:** TypeScript, React, Express, SQLite (`better-sqlite3`), Vitest, Playwright, Docker Compose on Raspberry Pi.

---

### Task 1: Configure the five weight ranges

**Files:**
- Modify: `shared/challenges/le-juste-poisson.test.ts`
- Modify: `shared/challenges/le-juste-poisson.ts`

- [ ] **Step 1: Write the failing range test**

Add a table assertion mapping each round ID to the requested `estimateRange`:

```ts
expect(Object.fromEntries(leJustePoisson.rounds.map((round) => [round.id, round.estimateRange]))).toEqual({
  hippocampe: { min: 0.001, max: 1, step: 0.0005, displayUnit: "g" },
  "crabe-araignee-japonais": { min: 0.5, max: 100, step: 0.5, displayUnit: "kg" },
  "poisson-lune-mole": { min: 10, max: 3_000, step: 10, displayUnit: "kg" },
  "tortue-luth": { min: 10, max: 1_200, step: 10, displayUnit: "kg" },
  "baleine-bleue": { min: 1, max: 150_000, step: 1_000, displayUnit: "kg" },
})
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- shared/challenges/le-juste-poisson.test.ts`

Expected: FAIL because the current min/max/display values differ.

- [ ] **Step 3: Apply the exact range table**

Replace only the five `estimateRange` objects in `shared/challenges/le-juste-poisson.ts` with the values asserted above.

- [ ] **Step 4: Verify the focused test passes**

Run: `npm test -- shared/challenges/le-juste-poisson.test.ts`

Expected: PASS.

### Task 2: Add the server-authoritative timer toggle

**Files:**
- Modify: `server/game-service.test.ts`
- Modify: `server/game-service.ts`

- [ ] **Step 1: Write failing service tests**

Add coverage that advances a game to the answering phase of `question-pour-un-poisson`, captures the positive remaining duration, calls:

```ts
const paused = service.toggleQuestionTimer(code, hostToken)
expect(paused.tournament?.endsAt).toBeNull()
expect(paused.tournament?.pausedRemainingMs).toBeGreaterThan(0)

const resumed = service.toggleQuestionTimer(code, hostToken)
expect(resumed.tournament?.endsAt).not.toBeNull()
expect(resumed.tournament?.pausedRemainingMs).toBeNull()
```

Also assert a `GameError` for an invalid host token and when `tournament.buzz` is already populated.

- [ ] **Step 2: Verify the service tests fail**

Run: `npm test -- server/game-service.test.ts`

Expected: FAIL because `toggleQuestionTimer` does not exist.

- [ ] **Step 3: Implement the toggle transaction**

Add `toggleQuestionTimer(codeInput, hostToken)` to `GameService`. Authenticate with `assertHost`, require an active answering-phase buzzer round, reject an unresolved buzz, then atomically execute one of:

```sql
UPDATE games SET phase_ends_at = NULL, buzz_paused_ms = ? WHERE id = ?
```

or:

```sql
UPDATE games SET phase_ends_at = ?, buzz_paused_ms = NULL WHERE id = ?
```

When pausing, compute `Math.max(1, Date.parse(game.phase_ends_at) - Date.now())`. When resuming, compute `new Date(Date.now() + game.buzz_paused_ms).toISOString()`. Return the refreshed `GameView`.

- [ ] **Step 4: Verify the service tests pass**

Run: `npm test -- server/game-service.test.ts`

Expected: PASS.

### Task 3: Expose and wire the host action

**Files:**
- Modify: `server/app.test.ts`
- Modify: `server/app.ts`
- Modify: `src/api.ts`
- Modify: `src/hooks/use-game.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/challenge-screen.tsx`

- [ ] **Step 1: Write the failing API test**

Post to the new endpoint with the host token and assert the projected pause state:

```ts
const paused = await request(app)
  .post(`/api/games/${code}/buzz/timer`)
  .send({ hostToken })
  .expect(200)
expect(paused.body.tournament.endsAt).toBeNull()
expect(paused.body.tournament.pausedRemainingMs).toBeGreaterThan(0)
```

- [ ] **Step 2: Verify the API test fails**

Run: `npm test -- server/app.test.ts`

Expected: FAIL with HTTP 404.

- [ ] **Step 3: Add the endpoint and client call**

Add `POST /api/games/:code/buzz/timer` using `hostSchema`, delegating to `service.toggleQuestionTimer`. Add:

```ts
toggleQuestionTimer(code: string, hostToken: string) {
  return request<GameView>(`/api/games/${code}/buzz/timer`, {
    method: "POST",
    body: JSON.stringify({ hostToken }),
  })
}
```

Expose a `toggleQuestionTimer` callback from `useGame`, require `session.hostToken`, update local game state from the response, and thread that callback through `App`, `GameScreen`, and `ChallengeScreen` to `QuestionBuzzerScreen`.

- [ ] **Step 4: Verify the API test passes**

Run: `npm test -- server/app.test.ts`

Expected: PASS.

### Task 4: Make the host clock accessible and stateful

**Files:**
- Modify: `src/components/question-buzzer-screen.test.tsx` or create it if absent
- Modify: `src/components/question-buzzer-screen.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing component tests**

Render the screen as host with no buzz and assert a button named `Mettre le chronomètre en pause`. Render with `endsAt: null`, positive `pausedRemainingMs`, and no buzz; assert a button named `Reprendre le chronomètre` and visible copy `PAUSE`. Render as player in the same state and assert no interactive timer plus a disabled team buzzer.

- [ ] **Step 2: Verify the component tests fail**

Run: `npm test -- src/components/question-buzzer-screen.test.tsx`

Expected: FAIL because the clock is currently a non-interactive `div`.

- [ ] **Step 3: Implement the clock states**

Add `onToggleTimer: () => Promise<GameView>` to the component props. Derive:

```ts
const isManualPause = !tournament.endsAt && !tournament.buzz && tournament.pausedRemainingMs !== null
const canBuzz = !isHost && isOwn && Boolean(tournament.endsAt) && !tournament.buzz && !isBlocked && seconds > 0
```

For the host with no active buzz, render the clock as a button that calls `onToggleTimer`, shows a loading state, and exposes the correct accessible label. Keep the existing non-interactive buzz pause while an answer is awaiting validation. Add focused hover, focus-visible, disabled, and manual-pause styling without changing the arena layout.

- [ ] **Step 4: Verify the component tests pass**

Run: `npm test -- src/components/question-buzzer-screen.test.tsx`

Expected: PASS.

### Task 5: End-to-end verification and Raspberry Pi deployment

**Files:**
- Modify: `e2e/question-buzzer.spec.ts`

- [ ] **Step 1: Extend the Playwright flow**

Before the first player buzzes, click the host clock, assert `PAUSE`, assert the player's buzzer is disabled, click `Reprendre le chronomètre`, assert `CHRONO`, and assert the player's buzzer becomes enabled again.

- [ ] **Step 2: Run focused and full verification**

Run:

```bash
npm test -- shared/challenges/le-juste-poisson.test.ts server/game-service.test.ts server/app.test.ts src/components/question-buzzer-screen.test.tsx
npm test
npm run build
npx playwright test e2e/question-buzzer.spec.ts
git diff --check
```

Expected: all tests and build PASS; `git diff --check` emits no output.

- [ ] **Step 3: Commit and push**

```bash
git add shared/challenges/le-juste-poisson.ts shared/challenges/le-juste-poisson.test.ts server/game-service.ts server/game-service.test.ts server/app.ts server/app.test.ts src/api.ts src/hooks/use-game.ts src/App.tsx src/components/challenge-screen.tsx src/components/question-buzzer-screen.tsx src/components/question-buzzer-screen.test.tsx src/index.css e2e/question-buzzer.spec.ts docs/superpowers/plans/2026-09-05-gameplay-ranges-and-host-timer-pause.md
git commit -m "feat: add host timer pause and weight ranges"
git push origin main
```

- [ ] **Step 4: Deploy the synchronized revision**

Run: `./scripts/pi/push.sh baptiste@192.168.1.15`

Expected: rsync targets only `/opt/fish-tournament`, Docker rebuild succeeds, and the application container becomes healthy.

- [ ] **Step 5: Verify both origins**

Run:

```bash
curl -fsS http://192.168.1.15:8787/api/health
curl -fsS https://acm-tooth-harris-medline.trycloudflare.com/api/health
```

Expected from both: `{"status":"ok"}`.
