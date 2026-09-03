# Animated Home Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Fish Party home hero copy and add a richer, accessible animated bubble field.

**Architecture:** Keep the existing `OceanShell` boundary. Render a fixed-size decorative bubble list in React and animate it entirely in the existing global stylesheet, preserving the current reduced-motion fallback and avoiding runtime animation state.

**Tech Stack:** React, TypeScript, Tailwind CSS, CSS keyframes, Playwright, Docker Compose

---

### Task 1: Lock the new home experience with an end-to-end test

**Files:**
- Modify: `e2e/game.spec.ts`

- [x] **Step 1: Write the failing expectations**

Add assertions immediately after `host.goto("/")`:

```ts
await expect(host.getByText("C'EST L'HEURE DU DUEL")).toBeVisible()
await expect(host.getByRole("heading", { name: "Quels poissons seront dignes de Poséidon ? 🔱" })).toBeVisible()
await expect(host.getByText("Merci de vous donner à fond, marins, les champions seront dignement récompensés.")).toBeVisible()
await expect(host.locator("[data-testid='bubble-field'] > span")).toHaveCount(12)
```

- [x] **Step 2: Verify the test fails**

Run: `npm run test:e2e -- --reporter=line`

Expected: FAIL because the new hero copy and bubble field do not exist.

### Task 2: Implement the decorative bubble field and copy

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [x] **Step 1: Render a non-interactive bubble field**

Replace the three individual bubble nodes with:

```tsx
<div className="bubble-field" data-testid="bubble-field" aria-hidden="true">
  {Array.from({ length: 12 }, (_, index) => <span className="bubble" key={index} />)}
</div>
```

- [x] **Step 2: Replace the hero copy**

Use the three exact strings from Task 1 in the badge, heading and description.

- [x] **Step 3: Animate the bubbles**

Make `.bubble-field` an absolute, pointer-events-none layer. Give each child a distinct horizontal position, size, duration and negative delay with `:nth-child()`, then animate from below the viewport to above it with subtle lateral drift. Keep the existing `prefers-reduced-motion` rule.

- [x] **Step 4: Verify the complete flow**

Run: `npm run test:e2e -- --reporter=line && npm test`

Expected: all end-to-end and unit tests PASS.

### Task 3: Publish the new local Docker build

**Files:**
- No source changes

- [x] **Step 1: Rebuild and start**

Run: `docker compose up --build -d`

Expected: image builds and `poisson-chelou` starts.

- [x] **Step 2: Verify runtime health and output**

Run: `curl -fsS http://127.0.0.1:8787/api/health`

Expected: `{"status":"ok"}` and the production bundle contains the new title.

- [x] **Step 3: Commit the implementation**

```bash
git add src/App.tsx src/index.css e2e/game.spec.ts docs/superpowers/plans/2026-09-03-home-bubbles-copy.md
git commit -m "feat: animate Fish Party home hero"
```
