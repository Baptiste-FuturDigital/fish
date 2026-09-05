# Question pour un poisson Content, Demo, and Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the validated animal clues, replace Pauline with Maude without removing media, and let the host skip directly to the next round in demo mode.

**Architecture:** Keep static content in the existing challenge and identity catalogs. Add one host-authorized demo mutation that advances only `challenge_round`, exposed through the existing Express/API/hook/control chain.

**Tech Stack:** TypeScript, Express, React, SQLite, Vitest.

---

### Task 1: Lock and update catalogs

**Files:**
- Modify: `shared/challenges/question-pour-un-poisson.test.ts`
- Modify: `shared/challenges/question-pour-un-poisson.ts`
- Modify: `shared/player-identities.test.ts`
- Modify: `shared/player-identities.ts`
- Modify: `server/db.test.ts`
- Modify: `server/db.ts`

- [ ] **Step 1: Write failing content tests**

Assert exact IDs, selected clue strings, and Kraken image:

```ts
expect(questionPourUnPoisson.rounds.map((round) => round.id)).toEqual([
  "buzzer-hippocampe", "buzzer-poulpe", "buzzer-beluga",
  "buzzer-crevette-mante", "buzzer-kraken",
])
expect(questionPourUnPoisson.rounds[4]).toMatchObject({
  answerLabel: "Le Kraken",
  correctAnswer: "kraken",
  imageUrl: "/teams/20-big-le-kraken.jpg",
})
```

Assert `Maude` exists, `Pauline` does not, and the old file remains referenced:

```ts
expect(invitedPlayerIdentities).toContainEqual(expect.objectContaining({
  id: "maude", displayName: "Maude", imageUrl: "/players/pauline-beluga.png",
}))
expect(invitedPlayerIdentities.some(({ id }) => id === "pauline")).toBe(false)
```

- [ ] **Step 2: Verify RED**

Run `npx vitest run shared/challenges/question-pour-un-poisson.test.ts shared/player-identities.test.ts`. Expect failures for the old tortue-luth and Pauline entries.

- [ ] **Step 3: Apply the validated content**

Keep Hippocampe and Poulpe unchanged; replace only the approved Béluga and Crevette-mante clues; replace the fifth round with:

```ts
buzzerRound(
  "buzzer-kraken",
  "Animal 5 · Légende des profondeurs",
  "Le Kraken",
  "kraken",
  "/teams/20-big-le-kraken.jpg",
  [
    "Depuis des siècles, les marins racontent qu’une créature gigantesque se cacherait dans les profondeurs.",
    "Je viens des légendes scandinaves et l’on me prête la force de faire sombrer des navires.",
    "Mes immenses tentacules surgiraient de l’eau pour encercler les coques.",
    "On me représente comme un calmar gigantesque : je suis le Kraken.",
  ],
  "Cette légende scandinave est aujourd’hui associée au calmar géant, observé très rarement dans les profondeurs.",
  "https://www.amnh.org/explore/ology/ology-cards/285-kraken",
)
```

Change the identity entry to `invited("maude", "Maude", "pauline-beluga.png", ...)` without renaming or deleting the file.

Add an idempotent data migration after the player columns exist:

```sql
UPDATE players SET identity_id = 'maude', name = 'Maude'
WHERE identity_id = 'pauline'
```

The DB test seeds an old Pauline row, reopens/migrates the database, and asserts it becomes Maude. This preserves compatibility with the deployed SQLite volume.

- [ ] **Step 4: Verify GREEN and commit**

Run the two targeted test files and expect all tests to pass. Commit `feat: refresh question poisson roster and clues`.

### Task 2: Add the server-side demo round skip

**Files:**
- Modify: `server/game-service.test.ts`
- Modify: `server/app.test.ts`
- Modify: `server/game-service.ts`
- Modify: `server/app.ts`

- [ ] **Step 1: Write failing service and HTTP tests**

Cover successful transition from round `0` to `1`, reset of buzzer fields, rejection outside demos, and rejection on the last round. The success invariant is:

```ts
expect(skipped.tournament).toMatchObject({
  roundIndex: 1,
  phase: "answering",
  buzz: null,
  blockedTeamId: null,
})
expect(skipped.tournament?.endsAt).not.toBeNull()
```

The endpoint is `POST /api/games/:code/skip-round` with `{ hostToken }`.

- [ ] **Step 2: Verify RED**

Run `npx vitest run server/game-service.test.ts server/app.test.ts`. Expect failure because `skipDemoRound` and the route do not exist.

- [ ] **Step 3: Implement the transaction**

Add `skipDemoRound(code, hostToken)` next to `skipDemoChallenge`. Validate host, `is_demo`, running status, and non-final round. Update `challenge_round`, `current_round`, `phase`, `phase_ends_at`, and clear all `buzz_*` fields. Return `getGame`.

- [ ] **Step 4: Add the Express route**

Parse `hostSchema` and call the service:

```ts
app.post("/api/games/:code/skip-round", (request, response) => {
  const body = hostSchema.parse(request.body)
  response.json(service.skipDemoRound(request.params.code, body.hostToken))
})
```

- [ ] **Step 5: Verify GREEN and commit**

Run the targeted server tests and commit `feat: add demo round shortcut`.

### Task 3: Wire the demo control

**Files:**
- Modify: `src/api.ts`
- Modify: `src/hooks/use-game.ts`
- Modify: `src/components/host-session-controls.test.tsx`
- Modify: `src/components/host-session-controls.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing control test**

Render an eligible demo with `canSkipRound` and assert a button labeled `Manche suivante`; verify it is absent for real games and the final round.

- [ ] **Step 2: Verify RED**

Run `npx vitest run src/components/host-session-controls.test.tsx`. Expect the new label to be absent.

- [ ] **Step 3: Implement API and hook**

Add `gameApi.skipRound`, a `skipRound` callback requiring `hostToken`, and return it from `useGame`.

- [ ] **Step 4: Implement the control**

Add an independent pending state and button:

```tsx
{isDemo && status === "running" && canSkipRound ? (
  <Button size="sm" onClick={() => void skipRound()} disabled={Boolean(pending)}>
    <SkipForward data-icon="inline-start" /> Manche suivante
  </Button>
) : null}
```

Compute eligibility from `roundIndex < roundCount - 1` and pass the callback from `App`.

- [ ] **Step 5: Verify GREEN and commit**

Run the control test plus `npm run build`. Commit `feat: expose next-round demo control`.
