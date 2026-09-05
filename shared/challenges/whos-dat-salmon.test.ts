import { describe, expect, it } from "vitest"

import { whosDatSalmon } from "./whos-dat-salmon.js"

describe("whosDatSalmon", () => {
  it("définit les quatre paires guess/reveal dans l'ordre", () => {
    expect(whosDatSalmon.id).toBe("whos-dat-salmon")
    expect(whosDatSalmon.title).toBe("Who's that salmon ?")
    expect(whosDatSalmon.shortTitle).toBe("Who's that salmon ?")
    expect(whosDatSalmon.introImageUrl).toBe("/game/Who's that salmon/1-guess-whale.png")
    expect(whosDatSalmon.rounds).toHaveLength(4)

    whosDatSalmon.rounds.forEach((round, index) => {
      expect(round.kind).toBe("choice")
      expect(round.durationSeconds).toBe(20)
      expect(round.imageUrl).toContain(`/game/Who's that salmon/${index + 1}-guess-`)
      expect(Reflect.get(round, "revealImageUrl")).toContain(`/game/Who's that salmon/${index + 1}-reveal-`)
    })
  })

  it("joue le fond épique et le jingle de cinq secondes", () => {
    expect(whosDatSalmon.introMusicYoutubeId).toBe("FsvGm4pqlW8")
    expect(whosDatSalmon.introMusicStartSeconds).toBe(0)
    expect(whosDatSalmon.introMusicEndSeconds).toBe(5)
    expect(whosDatSalmon.answeringMusicYoutubeId).toBe("3pPR6IOV7Rg")
  })

  it("respecte exactement la matrice A/B", () => {
    expect(whosDatSalmon.rounds.map((round) => ({
      choices: round.kind === "choice" ? round.choices.map(({ label }) => label) : [],
      correctAnswer: round.correctAnswer,
    }))).toEqual([
      { choices: ["Baleine", "Pikachu"], correctAnswer: "pikachu" },
      { choices: ["Crevette Mante", "Langouste Mitraillette"], correctAnswer: "crevette-mante" },
      { choices: ["Saumon", "Carpe"], correctAnswer: "saumon" },
      { choices: ["Pikachu", "Tortue de mer"], correctAnswer: "tortue-de-mer" },
    ])
  })

  it("relie chaque bonne réponse à son libellé révélé", () => {
    for (const round of whosDatSalmon.rounds) {
      expect(round.kind).toBe("choice")
      if (round.kind !== "choice") continue

      const correctChoice = round.choices.find(
        (choice) => choice.id === round.correctAnswer,
      )

      expect(correctChoice).toBeDefined()
      expect(correctChoice?.label).toBe(round.answerLabel)
    }
  })

  it("révèle un fait et une source pour chaque réponse", () => {
    for (const round of whosDatSalmon.rounds) {
      expect(round.fact.length).toBeGreaterThan(30)
      expect(round.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it("attribue deux points pour chaque réponse exacte", () => {
    expect(whosDatSalmon.scoring).toEqual({ kind: "exact", points: 2 })
  })
})
