# Player Identity and TV Display Design

## Goal

Replace free-form guest onboarding and animal-totem reveals with a controlled guest catalog, while adding a read-only television display for the shared party experience.

## Decisions

- `assets/players` is the source catalog for invited guests.
- `baptiste-poséidon.png` is reserved for the game master and never appears in the guest selector.
- A named invitation can join a game only once. Occupied identities are disabled or rejected by the server.
- `anonyme-poisson-clown.png` is a reusable fallback. Selecting it requires a free nickname and never reserves the anonymous option.
- Existing random, balanced assignment across the four teams remains the source of team allocation.
- The scan animation remains theatrical but reveals the selected player's portrait and assigned team, not an animal totem.
- The television is a distinct, read-only client reached at `/tv/:code`. It never owns a player session or host token.

## Architecture

The server exposes a normalized player catalog and validates the selected catalog identity during join. A stable catalog key is persisted with the player so image mapping does not depend on display-name parsing. Anonymous players persist the anonymous catalog key with their custom nickname. Existing hidden totem/category assignment may remain as the internal balancing mechanism, but public player projection uses the catalog portrait.

The TV client consumes the same sanitized `GameView` as other clients through the existing polling mechanism. A display-state adapter maps lobby, challenge intro, answering, reveal, leaderboard and finished phases into presentation scenes. The TV route contains no mutation controls and does not store a player or host session.

## User Flow

1. A guest scans the existing QR code and opens the join screen with the game code prefilled.
2. The guest selects their identity from the invited-player dropdown.
3. Named guests join immediately; anonymous guests enter a free nickname.
4. The server atomically rejects duplicate named identities and creates the player.
5. The existing scan sequence runs, then resolves to the guest portrait and assigned team.
6. The game master opens the TV URL from the host lobby and casts or connects the browser to the television.
7. The TV automatically follows the tournament: QR lobby, rules, rounds, reveals, interstitial leaderboards and final ceremony.

## TV Presentation

- 16:9 first, readable from several metres, with large headings and minimal copy.
- Ocean game-show visual language consistent with the current application.
- Lobby: game name, join QR/link, game code, player count and four team banks.
- Intro: challenge artwork, ordinal label, title and compact rules.
- Live round: public prompt, timer and team/player response status without exposing secret answers.
- Reveal: answer/results and score animation.
- Leaderboard: team ranking between challenges; final screen supports the existing team/individual ranking.
- Connection loss: retain the latest frame and show a discreet reconnecting indicator.

## Invariants and Failure Handling

- The host is never counted as a player.
- Named catalog identities are unique per game; anonymous nicknames obey existing player-name uniqueness.
- Asset URLs are web paths served by Vite/Express, never absolute filesystem paths.
- TV endpoints expose no host token and accept no game mutations.
- Unknown game codes show a recoverable code-entry state.
- Missing portraits fall back to the anonymous portrait without blocking the game.

## Testing

- Unit tests for catalog parsing, host exclusion and anonymous handling.
- Service/API tests for duplicate identity rejection, multiple anonymous guests and persisted portrait mapping.
- Component tests for dropdown states, anonymous nickname and portrait reveal.
- TV adapter/component tests for every tournament phase and read-only behavior.
- End-to-end smoke test: create, join named and anonymous guests, reveal portraits, open TV, start a challenge and verify synchronized scene changes.

## Out of Scope

- Face recognition or biometric processing.
- A second authoritative game engine for the TV.
- PowerPoint export.
- TV-side controls, accounts or persistent display pairing.
