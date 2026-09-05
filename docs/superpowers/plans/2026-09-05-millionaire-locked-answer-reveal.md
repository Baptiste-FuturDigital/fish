# Millionaire Locked Answer Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Millionaire answer grid visible after lock and animate the player's selected answer to its correct or wrong verdict.

**Architecture:** `ChallengeScreen` derives the player-specific panel mode from authoritative tournament data. `MillionaireAnswerPanel` renders selection, locked, and reveal states while CSS keyframes handle the client-only suspense sequence.

**Tech Stack:** React 19, TypeScript, CSS animations, Vitest, Playwright

---

### Task 1: Add explicit locked and reveal panel states

**Files:**
- Modify: `src/components/millionaire-answer-panel.tsx`
- Modify: `src/components/millionaire-answer-panel.css`
- Modify: `src/components/millionaire-answer-panel.test.tsx`

- [ ] **Step 1: Write the failing render tests**

Add cases that render four disabled options with the chosen option carrying `data-answer-state="locked"`, `data-answer-state="correct"`, and `data-answer-state="wrong"`; assert that the status copy matches each state.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/components/millionaire-answer-panel.test.tsx`

Expected: FAIL because the component has no locked/reveal props or answer-state attributes.

- [ ] **Step 3: Implement the panel modes**

Add these props:

```ts
locked?: boolean
verdict?: "pending" | "correct" | "wrong" | null
```

When locked, use the controlled `value`, disable every choice and the joker, preserve the 50/50 filtered list, and replace the submit button with compact status text. Apply `data-answer-state` only to the selected choice. Add orange, pulsing, green and red styles plus `prefers-reduced-motion` handling.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/components/millionaire-answer-panel.test.tsx`

Expected: PASS.

### Task 2: Route Millionaire reveal through the persistent panel

**Files:**
- Modify: `src/components/challenge-screen.tsx`
- Modify: `src/components/challenge-screen.test.tsx`
- Modify: `e2e/millionaire-joker.spec.ts`

- [ ] **Step 1: Write failing state and integration tests**

Render a revealed Millionaire game and assert that the question, choices and personal verdict exist while `LA RÉPONSE ÉTAIT` does not. The panel test must verify the verdict data attribute that triggers the 1.2-second CSS sequence.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- src/components/millionaire-answer-panel.test.tsx src/components/challenge-screen.test.tsx`

Expected: FAIL because the dedicated reveal branch and verdict state do not exist.

- [ ] **Step 3: Implement the dedicated branch**

Find the current player's `tournament.results` entry. Use the server result's `isCorrect`; never infer correctness from the answer label. Render the existing Millionaire question shell and panel during answering-locked and reveal phases, passing the stored answer ID and verdict. Use CSS keyframes to pulse orange before settling on green or red. Keep the generic reveal branch for every other challenge.

- [ ] **Step 4: Run component tests and E2E**

Run: `npm test -- src/components/millionaire-answer-panel.test.tsx src/components/challenge-screen.test.tsx && npx playwright test e2e/millionaire-joker.spec.ts --project=mobile-chrome`

Expected: PASS, including orange lock persistence and final green/red state.

- [ ] **Step 5: Commit**

```bash
git add src/components/millionaire-answer-panel.tsx src/components/millionaire-answer-panel.css src/components/millionaire-answer-panel.test.tsx src/components/challenge-screen.tsx src/components/challenge-screen.test.tsx e2e/millionaire-joker.spec.ts
git commit -m "feat: animate locked millionaire answers"
```
