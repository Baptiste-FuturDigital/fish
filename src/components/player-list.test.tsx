import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { GameView, PlayerSession } from "@shared/game"
import { PlayerList } from "./player-list.js"

const game = {
  id: "game-1",
  code: "FISH",
  name: "Aquarium",
  isDemo: false,
  status: "lobby",
  currentRound: 0,
  totalRounds: 0,
  currentPrompt: null,
  players: [
    { id: "player-1", name: "Léa", isHost: false, score: 0, teamId: null, totem: null },
  ],
  teams: [],
  tournament: null,
  createdAt: "2026-09-04T00:00:00.000Z",
} satisfies GameView

const guestSession = {
  gameCode: "FISH",
  playerId: "player-1",
  playerToken: "player-token",
} satisfies PlayerSession

describe("PlayerList", () => {
  it("makes each profile an exclusion trigger for the host", () => {
    const markup = renderToStaticMarkup(
      <PlayerList
        game={game}
        session={{ ...guestSession, playerId: "host", hostToken: "host-token" }}
        onKick={vi.fn(async () => undefined)}
      />,
    )

    expect(markup).toContain('aria-label="Exclure Léa"')
    expect(markup).toContain("Cliquer pour exclure")
  })

  it("keeps profiles non-interactive for guests", () => {
    const markup = renderToStaticMarkup(
      <PlayerList game={game} session={guestSession} onKick={vi.fn(async () => undefined)} />,
    )

    expect(markup).not.toContain('aria-label="Exclure Léa"')
    expect(markup).toContain("Léa")
  })
})
