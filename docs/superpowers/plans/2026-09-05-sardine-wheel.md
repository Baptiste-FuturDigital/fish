# Sardine Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the top player after Le juste poisson launch a colorful, server-synchronized prize wheel that always awards a sardine on the phone and TV.

**Architecture:** Persist a small authoritative state machine in SQLite and distribute timestamps through the existing polling views. Keep mutations in dedicated host/player endpoints, render a shared deterministic animation on clients, and preserve the existing comeback bonus for other challenges.

**Tech Stack:** TypeScript, SQLite/better-sqlite3, Express, React, CSS animations, Web Audio API, Vitest, Playwright.

---

### Task 1: Define and migrate the persisted wheel state

**Files:**
- Modify: `shared/game.ts`
- Create: `shared/player-ranking.ts`
- Create: `shared/player-ranking.test.ts`
- Modify: `server/db.ts`
- Modify: `server/db.test.ts`

- [ ] **Step 1: Write the failing migration test**

Assert `PRAGMA table_info(sardine_wheels)` contains `game_id`, `challenge_index`, `winner_player_id`, `status`, `offered_at`, `started_at`, `duration_ms`, and `completed_at`.

- [ ] **Step 2: Verify RED**

Run `npx vitest run server/db.test.ts`. Expect no `sardine_wheels` table.

- [ ] **Step 3: Add the shared contract and table**

```ts
export type SardineWheelStatus = "offered" | "spinning" | "won"
export interface SardineWheelView {
  challengeIndex: number
  winnerPlayerId: string
  winnerPlayerName: string
  status: SardineWheelStatus
  offeredAt: string
  startedAt: string | null
  durationMs: number
  completedAt: string | null
}
```

Add `sardineWheel: SardineWheelView | null` to `TournamentView`. Create the table with a primary key `(game_id, challenge_index)`, FKs to game/player, and a status check.

Extract the ranking comparator into `shared/player-ranking.ts` and use it from both `PlayerLeaderboard` and the service. The ordering is score descending, French name ascending, then stable player ID ascending, preventing the displayed winner from diverging from the authorized spinner.

- [ ] **Step 4: Verify GREEN and commit**

Run the DB test and TypeScript build. Commit `feat: persist sardine wheel state`.

### Task 2: Implement authoritative offer, spin, and completion

**Files:**
- Modify: `server/game-service.test.ts`
- Modify: `server/game-service.ts`
- Modify: `src/components/player-leaderboard.tsx`

- [ ] **Step 1: Write failing service tests**

Cover: offer only by host on the Le juste poisson leaderboard; deterministic top player; no team bonus mutation; spin only by winner; idempotent repeated calls; `spinning → won` after `duration_ms`; advancing blocked while offered/spinning and allowed when won.

- [ ] **Step 2: Verify RED**

Run the focused tests and expect missing `offerSardineWheel` / `spinSardineWheel` methods.

- [ ] **Step 3: Implement offer**

Use one transaction. Assert current challenge ID is `le-juste-poisson` and phase is `leaderboard`. Select non-host players using the same score/name/id ordering as the visible leaderboard and insert `offered` with a fixed `6_000` ms duration. Return the current game view.

Make `applyPoseithonBonus` explicitly reject the Le juste poisson intermission so a direct API call cannot also award the comeback bonus.

- [ ] **Step 4: Implement spin and completion**

Authenticate the player, compare `winner_player_id`, and atomically update `offered → spinning` with server time. Before building a view, convert elapsed `spinning` rows to `won`, recording `completed_at`. Repeated spin calls return the current state.

- [ ] **Step 5: Guard tournament advance**

In the `leaderboard` branch, reject advance with `La sardine doit d’abord trouver son champion.` while the persisted state is `offered` or `spinning`.

- [ ] **Step 6: Expose state in the view and verify GREEN**

Load the row and winner name in `buildTournamentView`; set `sardineWheel` or `null`. Run service tests and commit `feat: add sardine wheel state machine`.

### Task 3: Expose dedicated HTTP and client commands

**Files:**
- Modify: `server/app.test.ts`
- Modify: `server/app.ts`
- Modify: `server/tv-app.test.ts`
- Modify: `shared/tv.ts`
- Modify: `src/api.ts`
- Modify: `src/hooks/use-game.ts`

- [ ] **Step 1: Write failing HTTP tests**

Test `POST /api/games/:code/sardine-wheel/offer` with `{ hostToken }` and `POST /api/games/:code/sardine-wheel/spin` with `{ playerId, playerToken }`; assert permission and state responses.

- [ ] **Step 2: Verify RED**

Run `npx vitest run server/app.test.ts`. Expect `404` for both endpoints.

- [ ] **Step 3: Add routes, API methods, and hooks**

Use existing `hostSchema` and `playerSchema`. Add `offerSardineWheel` and `spinSardineWheel` methods to `gameApi` and callbacks to `useGame`; every successful mutation replaces local game state.

Project a dedicated TV-safe wheel shape in `shared/tv.ts`, omitting the winner's internal player ID and all authentication data. Cover it in `server/tv-app.test.ts`.

- [ ] **Step 4: Verify GREEN and commit**

Run app tests and TypeScript build. Commit `feat: expose sardine wheel commands`.

### Task 4: Build deterministic wheel timing and original audio

**Files:**
- Create: `src/components/sardine-wheel-timeline.ts`
- Create: `src/components/sardine-wheel-timeline.test.ts`
- Create: `src/components/sardine-wheel-audio.ts`
- Create: `src/components/sardine-wheel-audio.test.ts`

- [ ] **Step 1: Write failing pure-function tests**

Test that `wheelProgress(startedAt, durationMs, now)` clamps to `[0,1]`, that `wheelRotation(progress)` always ends on the sardine angle after seven turns, and that the audio score contains a spinning ostinato followed by a victory fanfare.

- [ ] **Step 2: Verify RED**

Run the two new test files and expect unresolved modules.

- [ ] **Step 3: Implement pure timeline helpers**

Use an ease-out-quint curve and a fixed final angle. Expose a motion-reduced result that jumps to the final state while preserving status text.

- [ ] **Step 4: Implement local Web Audio score**

Build a short original sequence from oscillators and gain envelopes. `playSardineWheelAudio(progressMs)` must return a cleanup function, start only from a user gesture where required, and no-op safely without `AudioContext`.

- [ ] **Step 5: Verify GREEN and commit**

Run both tests and commit `feat: add deterministic sardine wheel timeline`.

### Task 5: Build the phone/host prize experience

**Files:**
- Create: `src/components/sardine-wheel.tsx`
- Create: `src/components/sardine-wheel.css`
- Create: `src/components/sardine-wheel.test.tsx`
- Modify: `src/components/leaderboard-screen.tsx`
- Modify: `src/components/leaderboard-screen.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing component tests**

Assert: host sees `Déchaîner la faveur`; winner alone sees `Déchaîner la roue`; other players see waiting text; spinning displays the wheel; won displays `Sardine légendaire remportée`; host advance is disabled only while offered/spinning.

- [ ] **Step 2: Verify RED**

Run the new component and leaderboard tests. Expect missing wheel UI.

- [ ] **Step 3: Implement the responsive component**

Reproduce the validated mockup using semantic markup and CSS custom properties. Render eight fish segments, highlight the sardine result, and expose `aria-live` status. Add `prefers-reduced-motion` rules.

- [ ] **Step 4: Integrate the intermission**

For `le-juste-poisson`, render `SardineWheel` instead of `PoseithonBonus`. Keep `PoseithonBonus` unchanged elsewhere. Wire host offer and winner spin callbacks through `App`.

- [ ] **Step 5: Add victory animation**

At `won`, trigger a gold flash, marine confetti, a sardine jump, pulsating title, and final fanfare. Animation layers use `pointer-events: none` and do not hide the result.

- [ ] **Step 6: Verify GREEN and commit**

Run targeted UI tests and build. Commit `feat: add sardine prize wheel experience`.

### Task 6: Add the synchronized TV scene

**Files:**
- Modify: `src/projector/projector-route.ts`
- Modify: `src/projector/projector-route.test.ts`
- Modify: `src/projector/projector-screen.tsx`
- Modify: `src/projector/projector-screen.test.tsx`
- Modify: `src/projector/projector-screen.css`

- [ ] **Step 1: Write failing projector tests**

Make the wheel scene override the normal leaderboard whenever `sardineWheel` exists. Assert winner name, offered state, spinning wheel, sardine victory, and absence of player secrets.

- [ ] **Step 2: Verify RED**

Run projector tests. Expect `leaderboard` instead of `sardine-wheel`.

- [ ] **Step 3: Add scene routing and display**

Extend `ProjectorSceneKind` with `sardine-wheel`. Render the same timestamp-derived angle and the validated full-screen layout. Offered waits for the winner; spinning animates; won renders the victory layers and result.

- [ ] **Step 4: Verify GREEN and commit**

Run projector tests and commit `feat: synchronize sardine wheel on projector`.

### Task 7: Regression, E2E, and Raspberry Pi deployment

**Files:**
- Modify: `e2e/mobile.spec.ts` or the existing tournament E2E file
- Remote: `/opt/fish-tournament`

- [ ] **Step 1: Add the E2E path**

Drive the demo to the Le juste poisson leaderboard, offer the wheel, launch from the selected player, assert the TV enters the wheel scene and reaches `Sardine légendaire remportée`, then advance.

- [ ] **Step 2: Run local quality gates**

Run `npm test`, `npm run build`, and `npm run test:e2e`. Expect zero failures.

- [ ] **Step 3: Push the integrated main branch**

Confirm `git status --short --branch`, push `main`, and verify local and remote HEAD match.

- [ ] **Step 4: Deploy with rollback protection**

Transfer tracked files to `baptiste@192.168.1.15:/opt/fish-tournament` without deleting runtime data, then execute `sudo ./scripts/pi/deploy.sh`. The script backs up SQLite and rolls back a failed image.

- [ ] **Step 5: Verify local and public delivery**

Run Pi verification, check `http://192.168.1.15:8787/api/health`, `/`, `/tv`, and the active Cloudflare URL. Compare frontend asset names on LAN and public HTML, then smoke-test host, winner phone, TV, animation, audio fallback, and next-game navigation.
