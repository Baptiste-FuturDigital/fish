import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { GameView, PlayerSession } from "@shared/game"
import { LeaderboardScreen } from "./leaderboard-screen.js"

const game = {
  id: "game-1",
  code: "FISH",
  name: "Aquarium test",
  isDemo: false,
  status: "running",
  currentRound: 1,
  totalRounds: 3,
  currentPrompt: null,
  createdAt: "2026-09-04T00:00:00.000Z",
  players: [
    { id: "p1", name: "Léa", isHost: false, score: 4, teamId: "a", totem: null },
    { id: "p2", name: "Sam", isHost: false, score: 2, teamId: "b", totem: null },
  ],
  teams: [
    { id: "a", name: "Les Abyssaux", score: 4, memberIds: ["p1"] },
    { id: "b", name: "Les Coralliens", score: 2, memberIds: ["p2"] },
  ],
  tournament: null,
} satisfies GameView

const hostSession = {
  gameCode: "FISH",
  playerId: "host",
  playerToken: "player-token",
  hostToken: "host-token",
} satisfies PlayerSession

describe("LeaderboardScreen", () => {
  it("affiche le classement de tous les joueurs entre les épreuves", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardScreen
        game={game}
        session={hostSession}
        onAdvance={vi.fn()}
        onFinish={vi.fn()}
        onBonus={vi.fn()}
      />,
    )

    expect(markup).toContain("Classement après")
    expect(markup).toContain("l&#x27;épreuve 1")
    expect(markup).toContain('aria-label="Classement individuel des joueurs"')
    expect(markup.indexOf("Léa")).toBeLessThan(markup.indexOf("Sam"))
    expect(markup).not.toContain('aria-label="Classement des bancs"')
    expect(markup).toContain("Découvrir l&#x27;épreuve suivante")
  })
})
