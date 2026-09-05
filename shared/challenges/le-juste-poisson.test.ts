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
      "/game/Le juste poisson/poids-hippocampe.avif",
      "/game/Le juste poisson/poids-crabe-araignee.jpg",
      "/game/Le juste poisson/poids-moon-fish.jpg",
      "/game/Le juste poisson/poids-tortue-luth.jpg",
      "/game/Le juste poisson/poids-blue-whale.webp",
    ])

    for (const round of leJustePoisson.rounds) {
      expect(round.imageUrl).toMatch(/^\/game\/Le juste poisson\/poids-/)
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

  it("utilise les plages de poids jouables demandees", () => {
    expect(Object.fromEntries(leJustePoisson.rounds.map((round) => [round.id, round.estimateRange]))).toEqual({
      hippocampe: { min: 0.001, max: 1, step: 0.0005, displayUnit: "g" },
      "crabe-araignee-japonais": { min: 0.5, max: 100, step: 0.5, displayUnit: "kg" },
      "poisson-lune-mole": { min: 10, max: 3_000, step: 10, displayUnit: "kg" },
      "tortue-luth": { min: 10, max: 1_200, step: 10, displayUnit: "kg" },
      "baleine-bleue": { min: 1, max: 150_000, step: 1_000, displayUnit: "kg" },
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
