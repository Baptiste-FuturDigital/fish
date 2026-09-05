# Gameplay ranges and host timer pause

**Date:** 2026-09-05

## Goal

Adjust the five `Le juste poisson` sliders to the requested playable ranges and let the host pause or resume the `Question pour un poisson` countdown without weakening the existing phone-buzzer synchronization.

## Scope

### Le juste poisson ranges

The canonical values remain kilograms in shared game state. The player interface formats each round with its configured display unit.

| Round | Minimum | Maximum | Step | Display unit |
| --- | ---: | ---: | ---: | --- |
| Hippocampe | 0.001 kg | 1 kg | 0.0005 kg | g |
| Crabe-araignée japonais | 0.5 kg | 100 kg | 0.5 kg | kg |
| Poisson-lune | 10 kg | 3,000 kg | 10 kg | kg |
| Tortue luth | 10 kg | 1,200 kg | 10 kg | kg |
| Baleine bleue | 1 kg | 150,000 kg | 1,000 kg | kg |

The upper bound remains selectable even when the interval is not an exact multiple of the configured step. Existing correct answers, scoring, round order, copy, and images remain unchanged.

### Question pour un poisson timer

The existing server-authoritative countdown remains the source of truth. While a buzzer answer is not pending, the host can click the clock to toggle between running and manually paused states.

- Pausing stores the exact remaining milliseconds and clears the active deadline.
- Resuming creates a new deadline from the stored remaining duration.
- Player buzz actions are rejected by the server and disabled in the interface while manually paused.
- A player buzz continues to pause the timer automatically exactly as it does today.
- Manual timer controls are unavailable while a buzzed answer awaits host validation.
- Only the authenticated host can pause or resume the timer.
- Timer state is projected through the existing game view so host, players, and projector converge through the current synchronization mechanism.

## Architecture

Add one authenticated game-service operation that toggles the timer only for an active `Question pour un poisson` buzzer round in the answering phase. Expose it through the existing API and client action layers. Reuse `phase_ends_at` and `buzz_paused_ms`: a null deadline plus a positive paused duration and no active buzz represents a manual pause.

The host clock becomes an accessible button. Its visible state distinguishes `CHRONO`, manual `PAUSE`, and the existing buzz pause. The player view requires an active deadline before enabling its buzzer.

## Invariants and errors

- The remaining duration never increases through repeated pause/resume cycles except for normal sub-millisecond rounding at storage boundaries.
- Toggle requests outside the correct challenge, phase, or timer state fail with a conflict response.
- Toggle requests during an unresolved buzz fail with a conflict response.
- Player credentials cannot call the host-only operation.
- Repeated host clicks are serialized by the database-backed game state and each successful request toggles exactly once.

## Testing

Use test-driven development.

- Shared challenge test asserts all five ranges, steps, and display units.
- Game-service tests cover pause, resume, preserved remaining time, host authentication, wrong phase/challenge, and unresolved-buzz rejection.
- API tests cover the authenticated endpoint and error propagation.
- Component tests verify the host clock is interactive, player clock is not, paused copy is visible, and the phone buzzer is disabled while manually paused.
- End-to-end coverage pauses and resumes the countdown from the host while confirming the player cannot buzz during the pause and can buzz after resumption.

## Deployment

Run focused tests, the full test suite, the production build, and the relevant Playwright flow. Commit and push the implementation, deploy the synchronized revision to the Raspberry Pi using the existing deployment script, then verify local and Cloudflare health plus a public gameplay smoke test.
