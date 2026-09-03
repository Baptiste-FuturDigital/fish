import { describe, expect, it } from "vitest"

import { challenges } from "./catalog.js"

describe("challenge catalog", () => {
  it("contains the four consecutive challenges with 23 total rounds", () => {
    expect(challenges).toHaveLength(4)
    expect(challenges.map(({ id, title, rounds }) => ({ id, title, roundCount: rounds.length }))).toEqual([
      { id: "le-juste-poisson", title: "Le juste poisson", roundCount: 3 },
      { id: "question-pour-un-poisson", title: "Question pour un poisson", roundCount: 10 },
      { id: "whos-dat-salmon", title: "Who's that salmon ?", roundCount: 5 },
      { id: "qui-veut-gagner-des-poissons", title: "Qui veut gagner des poissons ?", roundCount: 5 },
    ])
    expect(challenges.flatMap((challenge) => challenge.rounds)).toHaveLength(23)
  })

  it("uses unique challenge and round ids", () => {
    expect(new Set(challenges.map((challenge) => challenge.id))).toHaveLength(4)
    const roundIds = challenges.flatMap((challenge) => challenge.rounds.map((round) => round.id))
    expect(new Set(roundIds)).toHaveLength(roundIds.length)
  })
})
