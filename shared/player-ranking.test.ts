import { describe, expect, it } from "vitest"

import { comparePlayerRanking } from "./player-ranking.js"

describe("comparePlayerRanking", () => {
  it("orders players by descending score, French name, then stable id", () => {
    const players = [
      { id: "z", name: "Zoé", score: 4 },
      { id: "b", name: "Émile", score: 7 },
      { id: "c", name: "Alice", score: 7 },
      { id: "a", name: "Alice", score: 7 },
    ]

    expect(players.sort(comparePlayerRanking).map((player) => player.id))
      .toEqual(["a", "c", "b", "z"])
  })
})
