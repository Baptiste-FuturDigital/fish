import { describe, expect, it } from "vitest"

import { challenges } from "./catalog.js"

describe("challenge catalog", () => {
  it("contains the four consecutive challenges with 23 total rounds", () => {
    expect(challenges).toHaveLength(4)
    expect(challenges.map((challenge) => challenge.rounds.length)).toEqual([3, 5, 10, 5])
    expect(challenges.flatMap((challenge) => challenge.rounds)).toHaveLength(23)
  })

  it("uses unique challenge and round ids", () => {
    expect(new Set(challenges.map((challenge) => challenge.id))).toHaveLength(4)
    const roundIds = challenges.flatMap((challenge) => challenge.rounds.map((round) => round.id))
    expect(new Set(roundIds)).toHaveLength(roundIds.length)
  })
})
