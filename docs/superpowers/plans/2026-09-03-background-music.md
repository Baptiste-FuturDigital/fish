# Background Music Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play the requested YouTube track on the Fish Party home flow and expose an accessible bottom-right sound toggle.

**Architecture:** Add one self-contained React component inside the existing SPA. It owns the YouTube iframe, sends typed IFrame API commands through `postMessage`, and listens once for the first non-control pointer interaction to satisfy browser autoplay rules. No package or backend change is needed.

**Tech Stack:** React, TypeScript, shadcn Button, Lucide icons, YouTube IFrame Player API, Playwright, Docker Compose

---

### Task 1: Specify the music behavior in the mobile journey

**Files:**
- Modify: `e2e/game.spec.ts`

- [x] **Step 1: Add failing expectations**

After loading `/`, assert that the privacy-enhanced iframe targets video `8g8Utx0gvv8`, that the initial control reads « Activer la musique », that a click on « Créer une partie » changes it to « Couper la musique », and that clicking the control changes it back.

```ts
const musicPlayer = host.getByTestId("background-music-player")
await expect(musicPlayer).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/8g8Utx0gvv8/)
await expect(host.getByRole("button", { name: "Activer la musique" })).toBeVisible()
await host.getByRole("button", { name: "Créer une partie" }).click()
await expect(host.getByRole("button", { name: "Couper la musique" })).toBeVisible()
await host.getByRole("button", { name: "Couper la musique" }).click()
await expect(host.getByRole("button", { name: "Activer la musique" })).toBeVisible()
```

- [x] **Step 2: Run the test and observe the expected failure**

Run: `npm run test:e2e -- --reporter=line`

Expected: FAIL because `background-music-player` does not exist.

### Task 2: Implement the YouTube player and sound control

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [x] **Step 1: Add the player component**

Define constants for the video ID and player origin, a typed `YouTubeCommand`, and a `BackgroundMusic` component. The component must build an embed URL containing `autoplay=1`, `mute=1`, `loop=1`, `playlist=8g8Utx0gvv8`, `playsinline=1`, `enablejsapi=1`, and the current page origin. Commands are posted only to `https://www.youtube-nocookie.com`.

- [x] **Step 2: Add interaction unlocking and the toggle**

Register a `pointerdown` listener in `useEffect`. Ignore `[data-music-control]`, otherwise send `playVideo` and `unMute`, set the muted state to false, and remove the listener. Render the existing shadcn `Button` with `size="icon-lg"`, `variant="secondary"`, `aria-pressed`, a dynamic accessible label, and `Volume2`/`VolumeX` icons carrying `data-icon="inline-start"`.

- [x] **Step 3: Keep the player scoped to the home flow**

Render `<BackgroundMusic />` inside `HomeScreen`; React unmounting stops playback when the application switches to the game screen.

- [x] **Step 4: Isolate the iframe and position the control**

In `src/index.css`, keep the iframe out of visual layout and pointer interaction. Place the control at the bottom-right safe area with a semantic shadcn color, circular shape, shadow, and focus behavior inherited from `Button`.

- [x] **Step 5: Run all checks**

Run: `npm run test:e2e -- --reporter=line && npm test && npm run build`

Expected: one Playwright scenario, seven unit tests, and the production build all PASS.

### Task 3: Publish and verify the Docker build

**Files:**
- No source changes

- [x] **Step 1: Rebuild Docker**

Run: `docker compose up --build -d`

Expected: `fish-tournament` is recreated from the new bundle.

- [x] **Step 2: Verify runtime and bundle**

Run the health endpoint and confirm that the built assets include `8g8Utx0gvv8` and « Couper la musique ».

```bash
curl -fsS http://127.0.0.1:8787/api/health
docker exec fish-tournament sh -c "grep -R -q '8g8Utx0gvv8' /app/dist/assets"
```

Expected: `{"status":"ok"}` and exit status 0.

- [x] **Step 3: Commit**

```bash
git add src/App.tsx src/index.css e2e/game.spec.ts docs/superpowers/plans/2026-09-03-background-music.md
git commit -m "feat: add home background music"
```
