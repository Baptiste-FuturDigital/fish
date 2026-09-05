# Final Prize Dialog And Player Portraits Design

## Goal

Make the final result screen immediately actionable for prize winners and make the individual leaderboard as playful and inspectable as the TV lobby.

## UX

- The ranking switch keeps `Bancs` and renames `Joueurs` to `Poissons`.
- Every row in the individual ranking is a keyboard-accessible button.
- Selecting a player opens the same full-screen marine portrait treatment used by the TV lobby, including portrait, player name, and animal name.
- A connected non-host player who earned at least one prize sees an email prize dialog automatically when the final scoreboard appears.
- The dialog contains the existing independent claim forms, so a player eligible for two prizes can receive two distinct emails as required.
- Closing the dialog keeps a visible `Réclamer mes prix` button on the final screen so the flow is recoverable.
- Host, TV, anonymous sessions, and non-winning players never see the prize dialog.

## Architecture

- Extract the portrait lightbox into a shared presentational component consumed by both projector lobby and final scoreboard.
- Keep prize eligibility and delivery logic in `PrizeClaims`; add controlled dialog presentation around it in the final scoreboard.
- Use the shadcn dialog primitive for focus management, escape handling, and accessible modal semantics.

## Verification

- Component tests cover the `Poissons` label, clickable player rows, shared portrait dialog, eligible prize dialog, reopen action, and non-eligible/host exclusion.
- Full unit suite, TypeScript/Vite build, Docker health check, and browser smoke test must pass.
