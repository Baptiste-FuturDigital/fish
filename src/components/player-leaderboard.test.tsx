import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { GameView, PlayerView } from "@shared/game"
import {
  PlayerLeaderboard,
  rankPlayerLeaderboard,
} from "./player-leaderboard.js"

const players = [
  player("host", "Poséithon", 999, true, null, null),
  player("p1", "Zoé", 4, false, "ugly", "/totems/totem-01.jpg"),
  player("p2", "Alice", 7, false, "cool", "/totems/totem-11.jpg"),
  player("p3", "Émile", 7, false, "big", null),
  player("p4", "Bruno", 0, false, null, null),
]

function player(
  id: string,
  name: string,
  score: number,
  isHost: boolean,
  teamId: string | null,
  imageUrl: string | null,
): PlayerView {
  return {
    id,
    name,
    score,
    isHost,
    teamId,
    totem: imageUrl
      ? {
          name: `Totem de ${name}`,
          fact: "Fait marin",
          teamName: "Banc test",
          imageUrl,
        }
      : null,
  }
}

const game: GameView = {
  id: "game-1",
  code: "FISH",
  name: "Fish Tournament",
  status: "running",
  currentRound: 2,
  totalRounds: 4,
  currentPrompt: null,
  createdAt: "2026-09-04T00:00:00.000Z",
  players,
  teams: [
    { id: "ugly", name: "Les Abysses", score: 3, memberIds: ["p1"] },
    { id: "cool", name: "Les Rapides", score: 5, memberIds: ["p2"] },
    { id: "big", name: "Les Colosses", score: 5, memberIds: ["p3"] },
  ],
  tournament: null,
}

describe("rankPlayerLeaderboard", () => {
  it("classe tous les joueurs hors maître par score puis nom", () => {
    expect(rankPlayerLeaderboard(players).map(({ player, rank }) => [rank, player.name])).toEqual([
      [1, "Alice"],
      [2, "Émile"],
      [3, "Zoé"],
      [4, "Bruno"],
    ])
  })

  it("ne modifie pas la liste reçue", () => {
    const originalOrder = players.map((entry) => entry.id)

    rankPlayerLeaderboard(players)

    expect(players.map((entry) => entry.id)).toEqual(originalOrder)
  })
})

describe("PlayerLeaderboard", () => {
  it("affiche chaque joueur, son rang, son banc, son totem et son score x10", () => {
    const markup = renderToStaticMarkup(<PlayerLeaderboard game={game} />)

    expect(markup).toContain('aria-label="Classement individuel des joueurs"')
    expect(markup).not.toContain("Poséithon")
    expect(markup.indexOf("Alice")).toBeLessThan(markup.indexOf("Émile"))
    expect(markup.indexOf("Émile")).toBeLessThan(markup.indexOf("Zoé"))
    expect(markup).toContain("Les Rapides")
    expect(markup).toContain("Les Colosses")
    expect(markup).toContain("Sans banc")
    expect(markup).toContain("/totems/totem-11.jpg")
    expect(markup).toContain('aria-label="70 points"')
    expect(markup).toContain('data-rank="1"')
    expect(markup).toContain('data-rank="4"')
  })

  it("rend un état vide explicite quand aucun joueur ne participe", () => {
    const markup = renderToStaticMarkup(
      <PlayerLeaderboard game={{ ...game, players: [players[0]] }} />,
    )

    expect(markup).toContain("Aucun poisson classé")
  })
})
