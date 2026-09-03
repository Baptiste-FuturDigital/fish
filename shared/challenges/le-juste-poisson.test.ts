import { describe, expect, it } from "vitest"
import { leJustePoisson } from "./le-juste-poisson.js"

describe("leJustePoisson", () => {
  it("propose exactement trois manches numeriques de 20 secondes en kilogrammes", () => {
    expect(leJustePoisson.rounds).toHaveLength(3)

    for (const round of leJustePoisson.rounds) {
      expect(round.kind).toBe("number")
      expect(round.durationSeconds).toBe(20)

      if (round.kind === "number") {
        expect(round.unit).toBe("kg")
        expect(round.correctAnswer).toBeGreaterThan(0)
      }
    }
  })

  it("utilise des identifiants uniques et des contenus complets", () => {
    const roundIds = leJustePoisson.rounds.map((round) => round.id)

    expect(new Set(roundIds).size).toBe(roundIds.length)

    for (const round of leJustePoisson.rounds) {
      expect(round.imageUrl).toMatch(/^\/totems\/totem-\d{2}\.jpg$/)
      expect(round.answerLabel.trim().length).toBeGreaterThan(0)
      expect(round.fact.trim().length).toBeGreaterThan(10)
      expect(round.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it("classe les reponses selon leur proximite et attribue jusqu'a quatre points", () => {
    expect(leJustePoisson.scoring).toEqual({
      kind: "ranked-relative",
      maxPoints: 4,
    })
  })
})
