# Attendee Roster and Fair Team Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove absent guests from selection without deleting portraits and normalize Salmon team scores when team sizes differ.

**Architecture:** The invitation catalog controls selectability independently of the asset directory. Salmon aggregation receives authoritative team sizes and scales only team results; individual points remain unchanged.

**Tech Stack:** TypeScript, SQLite, Vitest, Node.js

---

### Task 1: Update the selectable roster without deleting assets

**Files:**
- Modify: `shared/player-identities.ts`
- Modify: `shared/player-identities.test.ts`
- Modify: `server/player-identities-assets.test.ts`
- Preserve: `assets/players/jeremy-phoque.png`

- [ ] **Step 1: Write failing roster assertions**

```ts
expect(invitedPlayerIdentities).toHaveLength(16)
expect(invitedPlayerIdentities.map((identity) => identity.id)).not.toContain("jeremy")
expect(invitedPlayerIdentities.map((identity) => identity.id)).not.toContain("valentine")
```

Add an asset test that checks `assets/players/jeremy-phoque.png` still exists independently of catalog membership.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- shared/player-identities.test.ts server/player-identities-assets.test.ts`

Expected: FAIL because Jérémy is still selectable.

- [ ] **Step 3: Remove only Jérémy's catalog entry and verify GREEN**

Run: `npm test -- shared/player-identities.test.ts server/player-identities-assets.test.ts`

Expected: PASS and the portrait remains on disk.

### Task 2: Normalize Salmon team aggregation by team size

**Files:**
- Modify: `server/tournament-engine.ts`
- Modify: `server/tournament-engine.test.ts`
- Modify: `server/game-service.ts`
- Modify: `server/game-service.test.ts`

- [ ] **Step 1: Write the failing fairness tests**

Call `aggregateTeamResults` with team sizes `{ "team-a": 3, "team-b": 4 }`. Give both teams a 50% success rate and assert equal normalized points. Also assert that `scorePlayerRound` still returns 2 points to every correct Salmon player.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- server/tournament-engine.test.ts server/game-service.test.ts`

Expected: FAIL because aggregation currently sums correct players without team-size scaling.

- [ ] **Step 3: Pass authoritative team sizes into aggregation**

Change the signature to:

```ts
aggregateTeamResults(
  challenge: ChallengeDefinition,
  roundIndex: number,
  playerResults: readonly PlayerRoundScoreResult[],
  participatingTeamIds: readonly string[],
  teamSizes?: ReadonlyMap<string, number>,
): RoundScoreResult[]
```

For Salmon only, compute `largestTeamSize` and return `rawCorrectPoints * largestTeamSize / teamSize`; return zero for an empty team. Keep all existing branches byte-for-byte equivalent in behavior. In `GameService.revealRound`, build the map from `scoringPlayers` and pass it to aggregation.

- [ ] **Step 4: Verify GREEN and persistence**

Run: `npm test -- server/tournament-engine.test.ts server/game-service.test.ts`

Expected: PASS, including a service-level assertion that the persisted team scores are equal for equal success rates across unequal rosters.

- [ ] **Step 5: Commit**

```bash
git add shared/player-identities.ts shared/player-identities.test.ts server/player-identities-assets.test.ts server/tournament-engine.ts server/tournament-engine.test.ts server/game-service.ts server/game-service.test.ts
git commit -m "feat: balance party roster team scoring"
```

### Task 3: Full regression and deployment

**Files:**
- Verify: all application and deployment files

- [ ] **Step 1: Run the full suite and build**

Run: `npm test && npm run build && git diff --check`

Expected: all tests pass, production build succeeds and no whitespace errors exist.

- [ ] **Step 2: Push and deploy**

```bash
git push origin main
./scripts/pi/push.sh baptiste@192.168.1.15
```

- [ ] **Step 3: Verify local and public health**

```bash
curl --fail http://192.168.1.15:8787/api/health
curl --fail https://acm-tooth-harris-medline.trycloudflare.com/api/health
```

Expected: both endpoints return `{"status":"ok"}` and public assets match the Pi deployment.

