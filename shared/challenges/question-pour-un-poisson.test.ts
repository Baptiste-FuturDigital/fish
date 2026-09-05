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
      "buzzer-kraken",
    ])
  })

  it("uses the approved beluga and mantis-shrimp clues", () => {
    expect(questionPourUnPoisson.rounds[2].hostClues[0]).toBe(
      "Je vis dans les eaux arctiques, je suis très sociable et je communique avec un répertoire impressionnant de sons.",
    )
    expect(questionPourUnPoisson.rounds[3].hostClues[1]).toBe(
      "Mes bras frappent si vite qu'ils créent dans l'eau des bulles qui implosent avec un éclair et une seconde onde de choc.",
    )
  })

  it("finishes with the Scandinavian Kraken legend", () => {
    expect(questionPourUnPoisson.rounds[4]).toMatchObject({
      id: "buzzer-kraken",
      kicker: "Animal 5 · Légende des profondeurs",
      answerLabel: "Le Kraken",
      correctAnswer: "kraken",
      imageUrl: "/teams/20-big-le-kraken.jpg",
      hostClues: [
        "Depuis des siècles, les marins racontent qu’une créature gigantesque se cacherait dans les profondeurs.",
        "Je viens des légendes scandinaves et l’on me prête la force de faire sombrer des navires.",
        "Mes immenses tentacules surgiraient de l’eau pour encercler les coques.",
        "On me représente comme un calmar gigantesque : je suis le Kraken.",
      ],
      fact: "Cette légende scandinave est aujourd’hui associée au calmar géant, observé très rarement dans les profondeurs.",
      sourceUrl: "https://www.amnh.org/explore/ology/ology-cards/285-kraken",
    })
  })
})
