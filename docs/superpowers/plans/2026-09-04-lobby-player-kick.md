# Lobby Player Kick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the host remove a guest from the lobby and make the removed client return to the prefilled join form.

**Architecture:** SQLite remains authoritative for membership. A host-authenticated lobby-only action deletes one guest, while the polling client recognizes a missing own-player ID and clears its stale session locally.

**Tech Stack:** React, TypeScript, Express, SQLite, shadcn/ui Alert Dialog, Vitest

---

### Task 1: Implement the lobby-only exclusion invariant

**Files:**
- Modify: `server/game-service.test.ts`
- Modify: `server/game-service.ts`

- [ ] Add a failing test that creates a lobby, joins a guest, calls `kickPlayer(code, playerId, hostToken)`, and expects the guest to disappear.
- [ ] Add failing assertions for invalid host token, running-game state, and unknown player ID.
- [ ] Implement `kickPlayer` by calling `assertHost`, requiring `game.status === "lobby"`, verifying a non-host target, deleting it, and returning `getGame(code)`.
- [ ] Run `npm test -- --run server/game-service.test.ts` and expect PASS.

### Task 2: Expose the host action through HTTP

**Files:**
- Modify: `server/app.test.ts`
- Modify: `server/app.ts`
- Modify: `src/api.ts`

- [ ] Add a failing API test for `POST /api/games/:code/players/:playerId/kick` with `{ hostToken }`.
- [ ] Add the Express route using the existing `hostSchema` and return the updated `GameView`.
- [ ] Add `gameApi.kickPlayer(code, playerId, hostToken)` with the same request body.
- [ ] Run `npm test -- --run server/app.test.ts` and expect PASS.

### Task 3: Recover an excluded guest session

**Files:**
- Create: `src/hooks/player-session-membership.ts`
- Create: `src/hooks/player-session-membership.test.ts`
- Modify: `src/hooks/use-game.ts`
- Modify: `src/App.tsx`

- [ ] Add a failing pure-function test proving a non-host session whose ID is absent is considered ejected, while a host session is not.
- [ ] Implement `isPlayerSessionEjected(session, game)`.
- [ ] In `refresh`, clear storage/session/game and set `?code=FISH` when the helper returns true.
- [ ] Initialize `HomeScreen` in `join` mode whenever the URL contains a code.
- [ ] Run the helper and relevant app tests and expect PASS.

### Task 4: Add the host confirmation dialog

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/player-list.tsx`
- Create: `src/components/player-list.test.tsx`
- Modify: `src/App.tsx`

- [ ] Add a failing render test proving host profiles are buttons labelled `Exclure <name>` and guest profiles are not.
- [ ] Add the shadcn/ui Alert Dialog primitive.
- [ ] Extract `PlayerList` into a component accepting `canKick` and `onKick`.
- [ ] Open a named confirmation dialog on host click and disable confirmation while `onKick(player.id)` runs.
- [ ] Wire `kickPlayer` from `useGame` through `LobbyScreen` and show request failures with the existing toast pattern.
- [ ] Run `npm test -- --run src/components/player-list.test.tsx` and expect PASS.

### Task 5: Verify delivery

**Files:**
- Test: all existing unit and type checks

- [ ] Run `npm test -- --run` and expect all tests to pass.
- [ ] Run `npm run build` and expect a successful Vite production build.
- [ ] Run `docker compose up -d --build`.
- [ ] Verify `GET http://localhost:8787/api/health` returns `{"status":"ok"}`.
