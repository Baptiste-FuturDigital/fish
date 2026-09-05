import { describe, expect, it } from "vitest"

import { questionPourUnPoisson } from "./question-pour-un-poisson.js"

describe("Question pour un poisson", () => {
  it("contains five progressive buzzer animals", () => {
    expect(questionPourUnPoisson.rounds).toHaveLength(5)
    expect(questionPourUnPoisson.scoring).toEqual({ kind: "buzzer-countdown", points: [4, 3, 2, 1] })
    for (const round of questionPourUnPoisson.rounds) {
      expect(round.kind).toBe("buzzer")
      expect(round.durationSeconds).toBe(40)
      expect(round.hostClues).toHaveLength(4)
    }
  })

  it("keeps the five selected animals in their intended order", () => {
    expect(questionPourUnPoisson.rounds.map((round) => round.id)).toEqual([
      "buzzer-hippocampe",
      "buzzer-poulpe",
      "buzzer-beluga",
      "buzzer-crevette-mante",
      "buzzer-tortue-luth",
    ])
  })
})
