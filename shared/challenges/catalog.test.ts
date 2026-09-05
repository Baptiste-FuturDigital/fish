import { describe, expect, it } from "vitest"

import { challenges } from "./catalog.js"

describe("challenge catalog", () => {
  it("contains the four consecutive challenges with 19 total rounds", () => {
    expect(challenges).toHaveLength(4)
    expect(challenges.map(({ id, title, rounds }) => ({ id, title, roundCount: rounds.length }))).toEqual([
      { id: "le-juste-poisson", title: "Le juste poisson", roundCount: 5 },
      { id: "question-pour-un-poisson", title: "Question pour un poisson", roundCount: 5 },
      { id: "qui-veut-gagner-des-poissons", title: "Qui veut gagner des poissons ?", roundCount: 5 },
      { id: "whos-dat-salmon", title: "Who's that salmon ?", roundCount: 4 },
    ])
    expect(challenges.flatMap((challenge) => challenge.rounds)).toHaveLength(19)
  })

  it("uses unique challenge and round ids", () => {
    expect(new Set(challenges.map((challenge) => challenge.id))).toHaveLength(4)
    const roundIds = challenges.flatMap((challenge) => challenge.rounds.map((round) => round.id))
    expect(new Set(roundIds)).toHaveLength(roundIds.length)
  })

  it("utilise les quatre nouvelles images de présentation rangées par épreuve", () => {
    expect(challenges.map((challenge) => challenge.introImageUrl)).toEqual([
      "/game/Le juste poisson/le-juste-poisson.png",
      "/game/Question pour un poisson/question-pour-un-poisson.png",
      "/game/Qui veut gagner des poissons/qui-veut-gagner-des-poissons.png",
      "/game/Who's that salmon/1-guess-whale.png",
    ])
  })
})
