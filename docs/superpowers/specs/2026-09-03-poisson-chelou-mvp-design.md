# Fish Tournament MVP Design

## Outcome

A phone-first party game where one host creates a room, guests join with a short code and nickname, everyone sees the same server-owned state, and the host advances through several absurd ocean-themed rounds before ending the game.

## Architecture

- One Node.js/TypeScript process serves a JSON API and the built React SPA.
- SQLite persists games and players. Seeded prompts live in TypeScript because they are product content, not user-managed records.
- Clients poll the room state every 1.5 seconds. This keeps deployment and reconnection simpler than WebSockets for the MVP.
- A random host token and player token stored in `localStorage` provide lightweight capability-based access without accounts.

## Gameplay

- A game starts in `lobby`, changes to `running`, then `finished`.
- Each round displays a prompt type, a main instruction, and zero or more selected players.
- Rounds mix confessions, duels, group votes, mime, and absurd mini-actions. No answer storage is required: the room plays the interaction aloud and the host advances.
- The host can start, advance, and end. Non-host clients are read-only after joining.

## UX

- Home combines create and join flows to minimize navigation.
- Lobby emphasizes the room code and connected-player confirmation.
- Game emphasizes one instruction at a time and keeps host controls thumb-accessible.
- Visual direction: midnight aquarium, warm paper cards, coral and acid-lime accents, playful display type, restrained bubble motion.

## Failure handling and quality

- API validation rejects missing names, invalid codes, duplicate names, insufficient players, invalid tokens, and illegal transitions.
- Client requests show a useful error and retain room identity across refreshes.
- Automated API tests cover the complete game lifecycle; browser smoke tests cover the multi-player flow and mobile layout.
