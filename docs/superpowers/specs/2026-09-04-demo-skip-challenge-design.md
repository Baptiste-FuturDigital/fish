# Demo challenge skipping

## Goal

Keep **Question pour un poisson** to five rounds and let the game master jump directly to the next challenge while testing a demo game.

## Design

- `GameView` exposes the server-owned `isDemo` flag so the client never infers demo state from a name or URL.
- A host-authenticated `skip-challenge` endpoint advances directly to the next challenge intro, resets round/buzzer state, and rejects non-demo games.
- The control appears beside **Accueil · nouvelle partie** only for a running demo with another challenge available.
- The five existing first animals remain the complete **Question pour un poisson** sequence.

## Failure handling

- Invalid host credentials keep the existing authorization error.
- Real games receive a conflict response if the demo-only endpoint is called.
- The last challenge exposes no skip control and cannot advance past the challenge order.

## Verification

- Service tests cover demo skipping, state reset, and rejection for real games.
- API/component tests cover endpoint wiring and conditional control rendering.
- The full unit suite, production build, and Docker health check must pass.
