# Phone Host and Rainbow TV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the phone-host workflow explicit, add a safe TV share action, and animate a thin rainbow border around every projected team card.

**Architecture:** Keep host authority in the existing local browser session. Add a small share utility and component that only exports the public TV URL, then enhance the projector card styling with CSS-only conic borders.

**Tech Stack:** React 19, TypeScript, shadcn/ui Button and Card, Vitest, Web Share API, CSS custom properties.

---

### Task 1: Public TV sharing utility

**Files:**
- Create: `src/projector/projector-share-button.tsx`
- Create: `src/projector/projector-share-button.test.tsx`

- [x] **Step 1: Write the failing tests**

```tsx
expect(buildProjectorUrl("fish", "https://party.example")).toBe("https://party.example/tv/FISH")
await shareProjectorUrl("FISH", { share, writeText }, "https://party.example")
expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: "https://party.example/tv/FISH" }))
```

- [x] **Step 2: Run the tests to verify RED**

Run: `npm test -- src/projector/projector-share-button.test.tsx`
Expected: FAIL because the module does not exist.

- [x] **Step 3: Implement the utility and button**

```tsx
export function buildProjectorUrl(code: string, origin: string) {
  return new URL(buildProjectorPath(code), origin).toString()
}
```

The button calls `navigator.share` when available, otherwise `navigator.clipboard.writeText`, and reports the result with Sonner.

- [x] **Step 4: Re-run the focused tests**

Run: `npm test -- src/projector/projector-share-button.test.tsx`
Expected: PASS.

### Task 2: Host lobby controls

**Files:**
- Create: `src/components/host-lobby-tools.tsx`
- Create: `src/components/host-lobby-tools.test.tsx`
- Modify: `src/App.tsx`

- [x] **Step 1: Add failing render assertions**

```tsx
expect(markup).toContain("Cet appareil est ta console maître")
expect(markup).toContain("Partager l’écran TV")
```

- [x] **Step 2: Run the test to verify RED**

Run: `npm test -- src/components/host-lobby-tools.test.tsx`
Expected: FAIL because the new host copy and control are absent.

- [x] **Step 3: Compose the host card**

Render `ProjectorShareButton` next to `ProjectorLaunchButton` and state that reopening the app on the same phone resumes the master session.

- [x] **Step 4: Re-run the test**

Run: `npm test -- src/components/host-lobby-tools.test.tsx`
Expected: PASS.

### Task 3: Projector rainbow team cards

**Files:**
- Modify: `src/projector/projector-screen.tsx`
- Modify: `src/projector/projector-screen.css`
- Modify: `src/projector/projector-screen.test.tsx`

- [x] **Step 1: Add a failing assertion**

```tsx
expect(markup.match(/projector-team-card-rainbow/g)).toHaveLength(4)
```

- [x] **Step 2: Run the projector test to verify RED**

Run: `npm test -- src/projector/projector-screen.test.tsx`
Expected: FAIL with zero rainbow card markers.

- [x] **Step 3: Add the visual treatment**

Add a dedicated rainbow class to each lobby team card. Use a transparent two-pixel border, a solid padding-box background and a rotating `conic-gradient` border-box background with staggered negative delays.

- [x] **Step 4: Re-run the projector test**

Run: `npm test -- src/projector/projector-screen.test.tsx`
Expected: PASS.

### Task 4: Regression and runtime verification

**Files:**
- No production file changes expected.

- [x] Run `npm test` and require all tests to pass.
- [x] Run `npm run build` and require TypeScript and Vite to succeed.
- [x] Run `docker compose up -d --build` and require `/api/health` to return `{"status":"ok"}`.
- [x] Verify the TV rainbow cards and host share control in Chromium with no console errors.
- [ ] Commit and push only tracked feature files; leave the user-owned untracked `public/` directory untouched.
