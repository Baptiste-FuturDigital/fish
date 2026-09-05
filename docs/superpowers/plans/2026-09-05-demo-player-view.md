# Demo Player View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open a fully functional demo-player view in a second tab without replacing the host session, then publish all local `main` changes to the Raspberry Pi.

**Architecture:** Extend the demo response with one already-created player capability. Keep the host capability in `localStorage`, seed the new tab's player capability into `sessionStorage`, and let the existing polling/action code operate unchanged on the shared game.

**Tech Stack:** TypeScript, React, Express, SQLite, Vitest, Playwright, Docker Compose, Raspberry Pi 5.

---

### Task 1: Consolidate the working tree safely

**Files:**
- Preserve: `assets/prank/footer.png`
- Move to Trash: `public/footer.png`
- Preserve ignored: `public/.DS_Store`

- [ ] **Step 1: Verify the duplicate before removal**

Run:

```bash
shasum -a 256 public/footer.png assets/prank/footer.png
git ls-files assets/prank/footer.png public/footer.png
```

Expected: identical hashes; only `assets/prank/footer.png` is tracked.

- [ ] **Step 2: Move only the duplicate to macOS Trash**

```bash
mv public/footer.png /Users/bessard/.Trash/fish-footer-duplicate-20260905.png
```

Expected: `git status --short` contains no `public/footer.png`; the versioned original remains intact.

### Task 2: Expose a bounded demo-player capability

**Files:**
- Modify: `shared/game.ts`
- Modify: `server/game-service.ts`
- Modify: `server/game-service.test.ts`
- Modify: `server/app.test.ts`
- Modify: `src/api.ts`

- [ ] **Step 1: Write failing service and API tests**

Add assertions equivalent to:

```ts
const demo = service.createDemoGame()
expect(demo.demoPlayerSession.hostToken).toBeUndefined()
expect(demo.demoPlayerSession.gameCode).toBe(demo.game.code)
expect(demo.game.players.some((player) => player.id === demo.demoPlayerSession.playerId)).toBe(true)
```

Run:

```bash
npm test -- server/game-service.test.ts server/app.test.ts
```

Expected: FAIL because `demoPlayerSession` does not exist.

- [ ] **Step 2: Add the shared response contract**

```ts
export interface DemoSessionResponse extends SessionResponse {
  demoPlayerSession: PlayerSession
}
```

- [ ] **Step 3: Return the first pre-populated player session**

Change `createDemoGame()` to return `DemoSessionResponse`, keep the existing player creation and totem assignment, and return:

```ts
return {
  game: this.startGame(created.game.code, created.session.hostToken!),
  session: created.session,
  demoPlayerSession: sessions[0],
}
```

Type `gameApi.demo()` as `DemoSessionResponse` and rerun the focused tests. Expected: PASS.

- [ ] **Step 4: Commit the server contract**

```bash
git add shared/game.ts server/game-service.ts server/game-service.test.ts server/app.test.ts src/api.ts
git commit -m "feat: expose a player session for demos"
```

### Task 3: Isolate and open the player tab

**Files:**
- Create: `src/hooks/game-session-storage.ts`
- Create: `src/hooks/game-session-storage.test.ts`
- Modify: `src/hooks/use-game.ts`
- Modify: `src/components/host-session-controls.tsx`
- Modify: `src/components/host-session-controls.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing storage and component tests**

Cover these invariants:

```ts
expect(readGameSession("?demo-player=1")).toEqual(playerSession)
expect(readGameSession("")).toEqual(hostSession)
expect(openDemoPlayerTab(playerSession)).toBe(true)
expect(openedWindow.sessionStorage.setItem).toHaveBeenCalledWith(
  "fish-tournament-session",
  JSON.stringify(playerSession),
)
expect(openedWindow.location.assign).toHaveBeenCalledWith("/?demo-player=1")
```

Render `HostSessionControls` and assert `Ouvrir la vue joueur` appears only when `isDemo && canOpenDemoPlayer`.

Run:

```bash
npm test -- src/hooks/game-session-storage.test.ts src/components/host-session-controls.test.tsx
```

Expected: FAIL before the helper and new props exist.

- [ ] **Step 2: Implement storage ownership**

The helper must export:

```ts
export const GAME_SESSION_KEY = "fish-tournament-session"
export const DEMO_PLAYER_LAUNCH_KEY = "fish-tournament-demo-player-session"
export function isDemoPlayerView(search = window.location.search): boolean
export function readGameSession(): PlayerSession | null
export function writeHostSession(session: PlayerSession): void
export function writeDemoPlayerLaunchSession(session: PlayerSession): void
export function readDemoPlayerLaunchSession(): PlayerSession | null
export function clearCurrentGameSession(): void
export function clearDemoPlayerLaunchSession(): void
export function openDemoPlayerTab(session: PlayerSession): boolean
```

`openDemoPlayerTab` must synchronously create a same-origin blank tab, write `GAME_SESSION_KEY` into that tab's `sessionStorage`, and navigate to `/?demo-player=1`. It must return `false` without changing current-tab storage when popups are blocked.

- [ ] **Step 3: Wire the hook and host controls**

`useGame.enter()` persists `response.session` and, when the response is a `DemoSessionResponse`, retains `response.demoPlayerSession`. Expose `canOpenDemoPlayer` and `openDemoPlayerView`; throw a user-safe error when the capability or popup is unavailable.

Add the demo-only button:

```tsx
{isDemo && canOpenDemoPlayer ? (
  <Button size="sm" onClick={onOpenDemoPlayer}>
    <Smartphone data-icon="inline-start" /> Ouvrir la vue joueur
  </Button>
) : null}
```

Pass the hook state through `App` to `HostSessionControls`. Rerun the focused tests. Expected: PASS.

- [ ] **Step 4: Commit the browser integration**

```bash
git add src/hooks/game-session-storage.ts src/hooks/game-session-storage.test.ts src/hooks/use-game.ts src/components/host-session-controls.tsx src/components/host-session-controls.test.tsx src/App.tsx
git commit -m "feat: open an isolated demo player view"
```

### Task 4: Verify, publish, and deploy the consolidated branch

**Files:**
- Modify: `e2e/game.spec.ts`

- [ ] **Step 1: Write the failing browser test**

Extend the demo test to wait for the popup, assert that the host and player sessions share a game code, assert that the child session has no host token, launch the first round from the host, and confirm the player slider is usable. Run:

```bash
npx playwright test e2e/game.spec.ts --grep "demo launches"
```

Expected: FAIL before the button/browser integration is complete, then PASS after wiring.

- [ ] **Step 2: Run the full validation**

```bash
npm test
npm run build
npm run test:e2e
git diff --check
```

Expected: all tests and build pass with no whitespace errors.

- [ ] **Step 3: Commit and push `main`**

```bash
git add e2e/game.spec.ts docs/superpowers/plans/2026-09-05-demo-player-view.md
git commit -m "test: cover the demo player window"
git push origin main
```

Expected: local and `origin/main` have zero ahead/behind commits.

- [ ] **Step 4: Deploy to the Raspberry Pi**

```bash
scripts/pi/push.sh baptiste@192.168.1.15
```

Expected: image build, SQLite backup, service replacement, and `/api/health` success.

- [ ] **Step 5: Public smoke test**

Verify the Cloudflare URL serves the new asset hash, then run a real host/player popup flow and confirm the `Poissons` portrait rows open. Do not declare completion until the public URL, QR target, API health, and both browser roles pass.

