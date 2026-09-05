# Prize Email Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Envoyer de façon sûre et idempotente les prix individuels et d’équipe depuis l’écran final des joueurs.

**Architecture:** Un `PrizeService` serveur authentifie le joueur, recalcule son éligibilité et orchestre une abstraction `PrizeEmailSender`. SQLite garantit l’idempotence ; Resend assure le transport ; un composant React autonome gère chaque réclamation.

**Tech Stack:** React, TypeScript, Express, SQLite/better-sqlite3, Zod, Resend HTTP API, Vitest, shadcn/ui.

---

### Task 1: Persistence and private prize assets

**Files:**
- Modify: `server/db.ts`
- Modify: `server/db.test.ts`
- Move: `assets/prize/*.jpeg` to `private/prizes/*.jpeg`
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] Write a DB test asserting `prize_claims` accepts the three prize types and rejects a duplicate `(game_id, player_id, prize_type)`.
- [ ] Run `npm test -- server/db.test.ts` and verify the new assertion fails because the table is absent.
- [ ] Add the `prize_claims` table with status/type checks, foreign keys, timestamps, provider id and error fields.
- [ ] Run `npm test -- server/db.test.ts` and verify it passes.
- [ ] Move the four JPEGs to `private/prizes`, copy that directory in the runtime image, and expose only provider configuration through Compose.

### Task 2: Email transport and templates

**Files:**
- Create: `server/prize-email.ts`
- Create: `server/prize-email.test.ts`

- [ ] Write tests asserting each template has French text, the correct filenames and the exact attachment set; assert missing Resend configuration throws a typed unavailable error.
- [ ] Run `npm test -- server/prize-email.test.ts` and verify module-not-found failure.
- [ ] Define `PrizeEmailSender`, `PrizeEmail`, `PrizeAttachment` and a Resend implementation using native `fetch`.
- [ ] Load only allowlisted filenames from `FISH_PRIZE_DIR` or `private/prizes`; encode each JPEG as base64.
- [ ] Implement the three templates: Aquatis champion, dernier poisson humoristique, and winning team certificate + prize.
- [ ] Run `npm test -- server/prize-email.test.ts` and verify it passes.

### Task 3: Eligibility, authentication, idempotency

**Files:**
- Create: `server/prize-service.ts`
- Create: `server/prize-service.test.ts`

- [ ] Write failing tests for invalid token, unfinished game, ineligible player, deterministic ties, all three eligible flows, duplicate sent claims, and retry after provider failure.
- [ ] Run `npm test -- server/prize-service.test.ts` and verify failures are caused by missing service behavior.
- [ ] Implement `PrizeService.claim(code, prizeType, playerId, playerToken, email)` with SHA-256 token verification and server-side rankings.
- [ ] Insert `pending` before send, update `sent` after provider success, update `failed` on error, and return existing `sent` claims without sending again.
- [ ] Run `npm test -- server/prize-service.test.ts` and verify all cases pass.

### Task 4: HTTP endpoint and production wiring

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`
- Modify: `server/index.ts`

- [ ] Write API tests for a valid claim, invalid email, invalid prize type, ineligible session and unavailable transport.
- [ ] Run `npm test -- server/app.test.ts` and verify the route tests fail with 404.
- [ ] Add the Zod request schema and async claim route; map typed prize errors to safe status codes.
- [ ] Construct the Resend sender and `PrizeService` in `server/index.ts` without logging secrets or emails.
- [ ] Run `npm test -- server/app.test.ts` and verify all route tests pass.

### Task 5: Player claim interface

**Files:**
- Modify: `shared/game.ts`
- Modify: `src/api.ts`
- Create: `src/components/prize-claims.tsx`
- Create: `src/components/prize-claims.test.tsx`
- Modify: `src/components/final-scoreboard.tsx`
- Modify: `src/components/final-scoreboard.test.tsx`
- Modify: `src/components/final-reveal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] Write component tests proving host/TV sees no form, best/worst/team players see correct independent cards, invalid email is blocked, and success/error states render.
- [ ] Run `npm test -- src/components/prize-claims.test.tsx src/components/final-scoreboard.test.tsx` and verify failures.
- [ ] Add shared request/result types and `gameApi.claimPrize`.
- [ ] Build `PrizeClaims` from existing `Card`, `Field`, `Input`, `Button` and `Alert` components, with one controlled email per prize type.
- [ ] Thread `PlayerSession` from `EndScreen` through `FinalReveal` and `FinalScoreboard`, rendering forms only for a non-host player present in the final game.
- [ ] Add restrained ocean-prize styling and mobile layout without changing the TV route.
- [ ] Run the component tests and verify they pass.

### Task 6: Full verification and delivery

**Files:**
- Modify if needed: `README.md`

- [ ] Run `npm test` and obtain a fully green suite.
- [ ] Run `npm run build` and verify TypeScript plus Vite succeed.
- [ ] Run `npm run test:e2e` and verify the tournament flow remains green.
- [ ] Rebuild with `docker compose up -d --build`, verify `/api/health`, and verify prize assets return 404.
- [ ] Exercise a fake-sender integration test proving best/worst/team attachment counts of `1/1/2` and no duplicate send.
- [ ] Document the two required environment variables and the verified-domain requirement in `README.md`.
- [ ] Commit the integrated feature and push `main`.
