import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { GameView, PlayerView } from "@shared/game"
import { FinalPlayerRanking, FinalScoreboard } from "./final-scoreboard.js"

function player(
  id: string,
  name: string,
  score: number,
  teamId: string | null,
  isHost = false,
): PlayerView {
  return {
    id,
    name,
    score,
    teamId,
    isHost,
    totem: isHost
      ? null
      : {
          name: `Totem ${name}`,
          fact: "Fait marin",
          teamName: "Banc test",
          imageUrl: `/totems/${id}.jpg`,
        },
  }
}

const game: GameView = {
  id: "game-final",
  code: "FISH",
  name: "Fish Tournament",
  isDemo: false,
  status: "finished",
  currentRound: 4,
  totalRounds: 4,
  currentPrompt: null,
  createdAt: "2026-09-04T00:00:00.000Z",
  players: [
    player("host", "Poséithon", 999, null, true),
    player("zoe", "Zoé", 2, "abysses"),
    player("alice", "Alice", 9, "coraux"),
    player("emile", "Émile", 9, "abysses"),
    player("bruno", "Bruno", 0, "coraux"),
  ],
  teams: [
    { id: "abysses", name: "Les Abysses", score: 11, memberIds: ["zoe", "emile"] },
    { id: "coraux", name: "Les Coraux", score: 9, memberIds: ["alice", "bruno"] },
  ],
  tournament: null,
}

describe("FinalScoreboard", () => {
  it("propose les vues Bancs et Joueurs sans altérer le verdict final", () => {
    const markup = renderToStaticMarkup(<FinalScoreboard game={game} onLeave={() => undefined} />)

    expect(markup).toContain('role="tablist"')
    expect(markup).toContain("Bancs")
    expect(markup).toContain("Joueurs")
    expect(markup).toContain('aria-selected="true"')
    expect(markup).toContain('data-testid="final-confetti"')
    expect(markup).toContain('src="/references/poseithon.png"')
    expect(markup).toContain("Les Abysses")
  })

  it("mounts prize claims only for the authenticated player session", () => {
    const guestMarkup = renderToStaticMarkup(
      <FinalScoreboard
        game={game}
        session={{ gameCode: "FISH", playerId: "alice", playerToken: "secret" }}
        onLeave={() => undefined}
      />,
    )
    const hostMarkup = renderToStaticMarkup(
      <FinalScoreboard
        game={game}
        session={{ gameCode: "FISH", playerId: "host", playerToken: "secret", hostToken: "host" }}
        onLeave={() => undefined}
      />,
    )

    expect(guestMarkup).toContain("Réclame tes prix")
    expect(hostMarkup).not.toContain("Réclame tes prix")
  })
})

describe("FinalPlayerRanking", () => {
  it("classe tous les joueurs hors maître par score puis nom", () => {
    const markup = renderToStaticMarkup(<FinalPlayerRanking game={game} />)

    expect(markup).not.toContain("Poséithon")
    expect(markup.indexOf("Alice")).toBeLessThan(markup.indexOf("Émile"))
    expect(markup.indexOf("Émile")).toBeLessThan(markup.indexOf("Zoé"))
    expect(markup.indexOf("Zoé")).toBeLessThan(markup.indexOf("Bruno"))
    expect(markup).toContain('aria-label="Champion individuel"')
    expect(markup).toContain('aria-label="Dernier du classement"')
    expect(markup).toContain("💩")
    expect(markup).toContain('aria-label="90 points"')
    expect(markup).toContain("Les Coraux")
    expect(markup).toContain("4 joueurs")
  })
})
