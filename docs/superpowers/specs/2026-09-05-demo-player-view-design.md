# Demo Player View Design

## Goal

Allow the host to open a real player view from a running demo in a second browser tab, while keeping the host controls active and isolated in the original tab.

## Scope

- Add an `Ouvrir la vue joueur` control to demo host navigation.
- Use one of the players already created by `createDemoGame()` as the test player.
- Keep host and test-player sessions synchronized against the same game.
- Preserve both tabs across refreshes for the lifetime of their browser storage.
- Deploy the feature together with the already-completed final-player portrait changes currently present on the local branch.

The feature is demo-only. Normal games, QR-code joins, TV mode, scoring, and player capacity remain unchanged.

## Architecture

`POST /api/demo` will return a `DemoSessionResponse` containing the existing host `session` plus a `demoPlayerSession`. The service already owns the raw session tokens while it creates the eight demo players, so it can return the first demo player's session without adding a recovery endpoint or persisting recoverable tokens in the database.

The host session remains in `localStorage`, as today. The demo player session is retained separately by the host and copied into the new tab's `sessionStorage` before the tab navigates to `/?demo-player=1`. The player tab reads only its tab-local session. This prevents either tab from overwriting or clearing the other tab's identity.

The new tab is created synchronously from the click event, before navigation, so browsers do not classify it as an unsolicited popup. If the browser still blocks the tab, the host receives an explicit toast and the existing session is left untouched.

## Data flow

1. The user launches the demo.
2. `GameService.createDemoGame()` creates the host and eight populated players, starts the tournament, and returns the host plus the first demo player session.
3. `useGame.enter()` persists the host session and the demo-player launch session independently.
4. The demo host clicks `Ouvrir la vue joueur`.
5. The application opens a same-origin blank tab, writes the player session into that tab's `sessionStorage`, then navigates it to `/?demo-player=1`.
6. The new tab loads the normal game UI with the player capability. Existing polling and player actions operate unchanged against the same game code.
7. Leaving or refreshing the player tab affects only its tab-local session. Leaving the host demo clears the retained demo-player launch session as part of host cleanup.

## Interfaces and ownership

- `shared/game.ts`: define `DemoSessionResponse extends SessionResponse` with `demoPlayerSession: PlayerSession`.
- `server/game-service.ts`: return the first generated demo player session from `createDemoGame()`.
- `src/api.ts`: type `gameApi.demo()` as `DemoSessionResponse`.
- A focused browser-session helper owns storage selection, seeding the child tab, and cleanup semantics.
- `useGame()` owns the retained demo-player launch session and exposes `openDemoPlayerView()`.
- `HostSessionControls` renders the demo-only button and reports blocked-popup failures through the existing toast pattern.

## Security and failure modes

- No capability token is placed in the query string, fragment, logs, or clipboard.
- The player token exists only in same-origin browser storage and is never sent to another origin.
- The returned player token has player privileges only; it cannot perform host actions.
- The host token remains isolated from the player tab.
- The control is rendered only when the current session is the host of a demo game and a demo-player launch session is available.
- A missing, malformed, or stale player session falls back to the home screen without changing the host tab.
- A blocked popup produces a visible error and no partial navigation.

## Testing

- Service test: a demo response contains a non-host player session belonging to the populated game.
- Session-helper tests: normal host reads use `localStorage`; demo-player reads and cleanup use `sessionStorage`; child-tab seeding does not expose tokens in the URL.
- Component test: the button is shown only for a demo host and invokes the launch callback.
- Playwright test: launch `/?demo=1`, open the player view, verify both pages share the game code, verify the child is not a host, perform a player action, and confirm the host tab remains usable.
- Regression suite: unit tests, production build, existing E2E coverage, then public smoke test after Raspberry Pi deployment.

## Deployment and rollback

Use the existing Pi push script, which builds the Docker image, backs up SQLite, replaces the service, and rolls back on failure. Confirm the public Cloudflare URL serves the new asset hash and smoke-test both host and player tabs. Rollback is the existing previous-image/database restore path; no database migration is required.

