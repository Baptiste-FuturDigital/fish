# Player Identity and TV Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add catalog-based guest onboarding with portrait reveals and a synchronized, read-only television presentation.

**Architecture:** Persist a stable guest catalog key on each player, keep the existing team allocator, and project the selected portrait through `GameView`. Add a pure TV scene adapter and a dedicated React route that polls the existing public game endpoint without creating a session.

**Tech Stack:** React, TypeScript, Express, SQLite, Vite, shadcn/ui, Vitest, Testing Library, Playwright.

---

## File Structure

- `server/player-catalog.ts`: invited-player metadata and asset mapping.
- `server/player-catalog.test.ts`: catalog inclusion/exclusion and anonymous behavior.
- `server/db.ts`: persist `catalog_player_id` with backwards-compatible migration.
- `server/game-service.ts`: validate catalog selection and project portrait URLs.
- `server/game-service.test.ts`: uniqueness and anonymous integration tests.
- `server/app.ts`: catalog endpoint and extended join request.
- `server/app.test.ts`: HTTP contract tests.
- `shared/game.ts`: shared catalog and session types.
- `src/api.ts`: catalog fetch and join payload.
- `src/components/player-join-form.tsx`: identity dropdown and anonymous nickname.
- `src/components/player-join-form.test.tsx`: onboarding behavior tests.
- `src/components/totem-scan.tsx`: portrait/team reveal copy and rendering.
- `src/components/tv-display.tsx`: read-only 16:9 presentation.
- `src/components/tv-display.test.tsx`: scene rendering tests.
- `src/components/tv-display-state.ts`: pure `GameView` to TV scene mapping.
- `src/components/tv-display-state.test.ts`: phase mapping tests.
- `src/App.tsx`: route TV URLs before session-driven application flow.
- `src/index.css`: television presentation styles.
- `e2e/tv-display.spec.ts`: synchronized host/guest/TV smoke test.

### Task 1: Define the player catalog

**Files:**
- Create: `server/player-catalog.ts`
- Create: `server/player-catalog.test.ts`
- Modify: `shared/game.ts`

- [ ] **Step 1: Write failing catalog tests**

```ts
it("excludes the game master and exposes the reusable anonymous identity", () => {
  expect(PLAYER_CATALOG.some((player) => player.id === "baptiste-poseidon")).toBe(false)
  expect(PLAYER_CATALOG.find((player) => player.id === "anonymous")?.reusable).toBe(true)
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- server/player-catalog.test.ts`
Expected: FAIL because `PLAYER_CATALOG` does not exist.

- [ ] **Step 3: Implement stable catalog entries**

```ts
export interface CatalogPlayerView {
  id: string
  displayName: string
  imageUrl: string
  reusable: boolean
  available: boolean
}
```

Build explicit entries from `assets/players`; normalize the accented Poséidon filename to an ASCII public URL and reserve it for the host.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- server/player-catalog.test.ts`
Expected: PASS.

### Task 2: Persist and validate selected identities

**Files:**
- Modify: `server/db.ts`
- Modify: `server/game-service.ts`
- Modify: `server/game-service.test.ts`

- [ ] **Step 1: Write failing service tests**

```ts
it("rejects the same named invitation twice but accepts multiple anonymous guests", () => {
  service.joinGame(code, "Agathe", "agathe")
  expect(() => service.joinGame(code, "Agathe 2", "agathe")).toThrow(/déjà rejoint/i)
  expect(() => service.joinGame(code, "Invité A", "anonymous")).not.toThrow()
  expect(() => service.joinGame(code, "Invité B", "anonymous")).not.toThrow()
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- server/game-service.test.ts`
Expected: FAIL because join does not accept a catalog identity.

- [ ] **Step 3: Add migration and atomic validation**

Add nullable `catalog_player_id` to `players`. In the join transaction, reject reserved/unknown IDs and duplicate non-reusable IDs. Preserve the existing unique `(game_id, name)` constraint for nicknames.

- [ ] **Step 4: Project the portrait**

When the player claims their assignment, preserve the team/category allocator but return the catalog portrait in the public player view. Missing catalog assets fall back to the anonymous portrait.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- server/game-service.test.ts server/db.test.ts`
Expected: PASS.

### Task 3: Expose the catalog and join contract

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`
- Modify: `src/api.ts`

- [ ] **Step 1: Write failing API tests**

```ts
it("returns catalog availability per game", async () => {
  const response = await request(app).get(`/api/games/${code}/players/catalog`).expect(200)
  expect(response.body.players.find((entry: { id: string }) => entry.id === "agathe").available).toBe(true)
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- server/app.test.ts`
Expected: FAIL with 404.

- [ ] **Step 3: Implement endpoints and typed client**

Add the read-only catalog route and extend join with `{ name, catalogPlayerId }`. Return HTTP 409 for an occupied named identity and HTTP 400 for invalid IDs.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- server/app.test.ts`
Expected: PASS.

### Task 4: Build catalog-based onboarding

**Files:**
- Create: `src/components/player-join-form.tsx`
- Create: `src/components/player-join-form.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
it("asks for a nickname only for the anonymous identity", async () => {
  render(<PlayerJoinForm catalog={catalog} onSubmit={onSubmit} />)
  await user.selectOptions(screen.getByLabelText(/qui es-tu/i), "anonymous")
  expect(screen.getByLabelText(/pseudo libre/i)).toBeVisible()
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/player-join-form.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement with shadcn Select and Field**

Named entries submit their catalog display name. Anonymous submits the validated custom nickname. Occupied named entries remain visible but disabled so guests can understand why they cannot select them.

- [ ] **Step 4: Wire the home join mode**

Load the catalog after a valid code is entered, preserve the QR query-string flow, handle 409 by refreshing availability, and keep network errors actionable.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/components/player-join-form.test.tsx src/App.test.tsx`
Expected: PASS.

### Task 5: Replace totem presentation with portrait reveal

**Files:**
- Modify: `src/components/totem-scan.tsx`
- Modify: `src/components/team-board.tsx`
- Modify: corresponding component tests

- [ ] **Step 1: Write failing reveal tests**

```tsx
it("reveals the selected player portrait and assigned bank", async () => {
  render(<TotemScan playerName="Agathe" portraitUrl="/players/agathe.png" teamName="Les Abysses" />)
  expect(await screen.findByAltText("Agathe")).toHaveAttribute("src", "/players/agathe.png")
  expect(screen.queryByText(/animal totem/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/totem-scan.test.tsx`
Expected: FAIL on old animal-totem copy.

- [ ] **Step 3: Update reveal copy and image source**

Keep the existing scan and progressive pixelation durations. Present player name, portrait and team; do not expose filenames or internal category names.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/totem-scan.test.tsx src/components/team-board.test.tsx`
Expected: PASS.

### Task 6: Create the TV scene adapter

**Files:**
- Create: `src/components/tv-display-state.ts`
- Create: `src/components/tv-display-state.test.ts`

- [ ] **Step 1: Write a failing phase matrix test**

```ts
it.each([
  ["lobby", "lobby"],
  ["challenge-intro", "challenge-intro"],
  ["answering", "round"],
  ["reveal", "reveal"],
  ["leaderboard", "leaderboard"],
  ["finished", "final"],
])("maps %s to %s", (phase, expected) => {
  expect(toTvScene(buildGame({ phase }))).toMatchObject({ kind: expected })
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/tv-display-state.test.ts`
Expected: FAIL because `toTvScene` does not exist.

- [ ] **Step 3: Implement an exhaustive discriminated union**

The adapter derives only public display fields from `GameView`. Use an exhaustive `never` check for tournament phases so new phases cannot silently render the wrong scene.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/components/tv-display-state.test.ts`
Expected: PASS.

### Task 7: Build the television route and scenes

**Files:**
- Create: `src/components/tv-display.tsx`
- Create: `src/components/tv-display.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing route and read-only tests**

```tsx
it("renders the lobby code and exposes no game controls", () => {
  render(<TvDisplay game={lobbyGame} />)
  expect(screen.getByText(lobbyGame.code)).toBeVisible()
  expect(screen.queryByRole("button", { name: /démarrer|suivant|terminer/i })).toBeNull()
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/components/tv-display.test.tsx`
Expected: FAIL because the TV display does not exist.

- [ ] **Step 3: Implement 16:9 presentation scenes**

Use large Fraunces headings, high-contrast ocean colors, existing challenge artwork, score components and restrained scene transitions. Render QR/link, challenge intro, timer, reveal, leaderboard and final scene according to the adapter.

- [ ] **Step 4: Route before session hydration**

Parse `/tv/:code` synchronously at application startup, poll the public game route, and never write a player session or request host credentials.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/components/tv-display.test.tsx src/components/tv-display-state.test.ts`
Expected: PASS.

### Task 8: Host access and end-to-end verification

**Files:**
- Modify: host lobby component in `src/App.tsx`
- Create: `e2e/tv-display.spec.ts`

- [ ] **Step 1: Write the failing browser test**

```ts
test("host opens a synchronized TV display", async ({ browser }) => {
  const host = await browser.newPage()
  const tv = await browser.newPage()
  // Create the game, open its TV URL, join a guest, start, and assert the TV follows each phase.
})
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:e2e -- e2e/tv-display.spec.ts`
Expected: FAIL before the host TV link and route are complete.

- [ ] **Step 3: Add host action**

Add `Ouvrir l'écran TV` beside lobby sharing controls. Open `/tv/CODE` in a new browser tab; do not embed host credentials in the URL.

- [ ] **Step 4: Run complete verification**

Run: `npm test && npm run build && npm run test:e2e -- e2e/tv-display.spec.ts`
Expected: all tests pass, TypeScript and Vite build succeed, and the E2E flow follows host state.

- [ ] **Step 5: Rebuild Docker and smoke-test localhost**

Run: `docker compose up -d --build`
Expected: container is healthy and both `/` and `/tv/<active-code>` load through port 8787.
