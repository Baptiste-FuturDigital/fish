# Lobby player exclusion

## Goal

Allow the game master to remove a guest from the lobby by selecting their profile, while forcing that guest back through the join form.

## Interaction

- Only the host sees player profiles as interactive controls.
- Selecting a player opens a confirmation dialog naming that player.
- Confirming calls the host-only exclusion endpoint; cancelling changes nothing.
- While the request runs, the confirmation action is disabled and shows progress.

## Server invariants

- The caller must present the host token for the game.
- The game must still be in `lobby` state.
- Only a non-host player belonging to that game can be deleted.
- SQLite foreign-key cascades remove any player-owned rows. In a lobby there are no scores or answers to preserve.
- Deleting the row releases both the nickname and totem, so the guest can rejoin cleanly.

## Ejected client recovery

The public game poll remains readable, so the client detects that its own player ID is no longer present. It clears the stale local session and routes to the join form with the current four-character game code prefilled. The guest enters a nickname and joins again through the normal endpoint.

## Verification

- Service tests cover success, wrong host token, non-lobby rejection, and unknown player rejection.
- API tests cover endpoint wiring.
- Component tests cover host-only interactivity and dialog content.
- Hook-level extraction tests cover kicked-session detection without timers or network mocks.
- Full unit tests, TypeScript build, Docker build, and a live health check must pass.
