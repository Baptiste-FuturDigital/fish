# Challenge Assets and Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair every local challenge image URL and enforce the requested four-game tournament order.

**Architecture:** Treat `assets` as the filesystem source of truth for Vite public URLs. Add a contract test that resolves every catalog image URL to a real file, then update challenge definitions and the canonical catalog order.

**Tech Stack:** TypeScript, Vitest, Node filesystem APIs, Vite public directory, Docker.

---

### Task 1: Asset contract test

**Files:**
- Create: `shared/challenges/assets.test.ts`

- [x] **Step 1: Write the failing test**

```ts
const imageUrls = challenges.flatMap((challenge) => [
  challenge.introImageUrl,
  ...challenge.rounds.flatMap((round) => [round.imageUrl, round.revealImageUrl]),
]).filter((value): value is string => Boolean(value))

for (const imageUrl of imageUrls) {
  expect(fs.existsSync(path.join(assetDirectory, decodeURIComponent(imageUrl.slice(1))))).toBe(true)
}
```

- [x] **Step 2: Run the test to verify RED**

Run: `npm test -- shared/challenges/assets.test.ts`
Expected: FAIL for `/poids-*` and the deleted Salmon intro template.

- [x] **Step 3: Keep the test as the regression boundary**

The test remains independent from the production path constants so it detects stale catalog URLs after future file moves.

### Task 2: Repair challenge image paths

**Files:**
- Modify: `shared/challenges/le-juste-poisson.ts`
- Modify: `shared/challenges/le-juste-poisson.test.ts`
- Modify: `shared/challenges/question-pour-un-poisson.ts`
- Modify: `shared/challenges/whos-dat-salmon.ts`
- Modify: `shared/challenges/whos-dat-salmon.test.ts`
- Modify: `shared/challenges/catalog.test.ts`

- [x] **Step 1: Update failing expectations to the real structure**

```ts
expect(leJustePoisson.rounds[0].imageUrl).toBe(
  "/game/Le juste poisson/poids-hippocampe.avif",
)
expect(whosDatSalmon.introImageUrl).toBe(
  "/game/Who's that salmon/1-guess-whale.png",
)
```

- [x] **Step 2: Update the production definitions**

Use `const ASSET_ROOT = "/game/Le juste poisson"` for all five weight images and reuse those URLs from Question pour un poisson. Point the Salmon introduction to its existing first guess image.

- [x] **Step 3: Run focused tests**

Run: `npm test -- shared/challenges/assets.test.ts shared/challenges/le-juste-poisson.test.ts shared/challenges/whos-dat-salmon.test.ts shared/challenges/catalog.test.ts`
Expected: PASS.

### Task 3: Canonical tournament order

**Files:**
- Modify: `shared/challenges/catalog.ts`
- Modify: `shared/challenges/catalog.test.ts`
- Modify: `server/game-service.test.ts`

- [x] **Step 1: Write the new order expectations**

```ts
expect(challenges.map((challenge) => challenge.id)).toEqual([
  "le-juste-poisson",
  "question-pour-un-poisson",
  "qui-veut-gagner-des-poissons",
  "whos-dat-salmon",
])
```

- [x] **Step 2: Run tests to verify RED**

Run: `npm test -- shared/challenges/catalog.test.ts server/game-service.test.ts`
Expected: FAIL because Salmon and Millionnaire are reversed.

- [x] **Step 3: Reorder the catalog**

Place `quiVeutGagnerDesPoissons` before `whosDatSalmon`. The existing `startGame` normalization writes this canonical order into lobby games.

- [x] **Step 4: Re-run focused tests**

Run: `npm test -- shared/challenges/catalog.test.ts server/game-service.test.ts`
Expected: PASS.

### Task 4: Runtime verification

**Files:**
- No production file changes expected.

- [x] Run `npm test` and require the complete suite to pass.
- [x] Run `npm run build` and require TypeScript/Vite to succeed.
- [x] Rebuild Docker and require `/api/health` to return healthy.
- [x] Request every challenge image from Docker and require an `image/*` content type, never the SPA HTML fallback.
- [x] Verify the four challenge introductions in order through a game-service integration test.
- [ ] Commit and push feature files without staging the user-owned untracked `public/` directory.
