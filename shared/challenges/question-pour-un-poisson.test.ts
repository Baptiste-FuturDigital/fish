import { describe, expect, it } from "vitest"

import { questionPourUnPoisson } from "./question-pour-un-poisson.js"

describe("questionPourUnPoisson", () => {
  it("définit le bon habillage et le barème exact", () => {
    expect(questionPourUnPoisson.id).toBe("question-pour-un-poisson")
    expect(questionPourUnPoisson.title).toBe("Question pour un poisson")
    expect(questionPourUnPoisson.shortTitle).toBe("Question pour un poisson")
    expect(questionPourUnPoisson.introMusicYoutubeId).toBe("Zcl98Bguq7k")
    expect(questionPourUnPoisson.scoring).toEqual({ kind: "exact", points: 2 })
  })

  it("contient exactement dix questions chronométrées à vingt secondes", () => {
    expect(questionPourUnPoisson.rounds).toHaveLength(10)

    for (const round of questionPourUnPoisson.rounds) {
      expect(round.kind).toBe("choice")
      expect(round.durationSeconds).toBe(20)
    }
  })

  it("propose quatre réponses uniques et une correction valide par question", () => {
    for (const round of questionPourUnPoisson.rounds) {
      if (round.kind !== "choice") {
        throw new Error(`La manche ${round.id} doit être un choix multiple`)
      }

      expect(round.choices).toHaveLength(4)
      expect(new Set(round.choices.map((choice) => choice.id)).size).toBe(4)
      expect(new Set(round.choices.map((choice) => choice.label)).size).toBe(4)
      expect(round.choices.some((choice) => choice.id === round.correctAnswer)).toBe(true)
      expect(round.answerLabel.trim()).not.toBe("")
    }
  })

  it("fournit une explication et une source HTTPS pour chaque réponse", () => {
    for (const round of questionPourUnPoisson.rounds) {
      expect(round.fact.trim().length).toBeGreaterThan(20)
      expect(round.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it("utilise des identifiants de manche uniques", () => {
    const ids = questionPourUnPoisson.rounds.map((round) => round.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
