import { describe, expect, it } from "vitest"
import { leJustePoisson } from "./le-juste-poisson.js"

describe("leJustePoisson", () => {
  it("propose exactement cinq manches numeriques de 20 secondes en kilogrammes", () => {
    expect(leJustePoisson.rounds).toHaveLength(5)

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
    expect(leJustePoisson.rounds.map((round) => round.imageUrl)).toEqual([
      "/poids-hippocampe.avif",
      "/poids-crabe-araignee.jpg",
      "/poids-moon-fish.jpg",
      "/poids-tortue-luth.jpg",
      "/poids-blue-whale.webp",
    ])

    for (const round of leJustePoisson.rounds) {
      expect(round.imageUrl).toMatch(/^\/poids-/)
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

  it("identifie correctement le poisson-lune de la troisième manche", () => {
    const round = leJustePoisson.rounds[2]

    expect(round.id).toBe("poisson-lune-mole")
    expect(round.question).toContain("poisson-lune")
    expect(round.question).not.toContain("opah")
    expect(round.correctAnswer).toBe(2_744)
    expect(round.answerLabel).toContain("2 744 kg")
    expect(round.fact).toContain("Mola alexandrini")
  })

  it("présente trois règles courtes pour les joueurs", () => {
    expect(leJustePoisson.rules).toEqual([
      "Chaque joueur estime le juste poids du poisson ; le meilleur de chaque banc porte le score de son équipe.",
      "À chaque manche, les poissons et les quatre bancs peuvent gagner de 10 à 40 points selon leur classement.",
      "20 secondes par manche",
    ])
  })
})
