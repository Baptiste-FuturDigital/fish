import { describe, expect, it } from "vitest"

import { whosDatSalmon } from "./whos-dat-salmon.js"

describe("whosDatSalmon", () => {
  it("définit cinq manches visuelles à choix de vingt secondes", () => {
    expect(whosDatSalmon.id).toBe("whos-dat-salmon")
    expect(whosDatSalmon.title).toBe("Who's that salmon ?")
    expect(whosDatSalmon.shortTitle).toBe("Who's that salmon ?")
    expect(whosDatSalmon.rounds).toHaveLength(5)

    for (const round of whosDatSalmon.rounds) {
      expect(round.kind).toBe("choice")
      expect(round.durationSeconds).toBe(20)
      expect(round.imageUrl).toMatch(/^(\/hippocampe-cutout\.png|\/totems\/totem-\d{2}\.jpg)$/)
      expect(round.maskImage).toBe(true)
    }
  })

  it("ouvre avec l’hippocampe et un générique limité aux cinq premières secondes", () => {
    const firstRound = whosDatSalmon.rounds[0]

    expect(whosDatSalmon.introMusicYoutubeId).toBe("FsvGm4pqlW8")
    expect(whosDatSalmon.introMusicStartSeconds).toBe(0)
    expect(whosDatSalmon.introMusicEndSeconds).toBe(5)
    expect(firstRound.id).toBe("salmon-1-hippocampe")
    expect(firstRound.imageUrl).toBe("/hippocampe-cutout.png")
    expect(firstRound.correctAnswer).toBe("hippocampe")
    expect(firstRound.answerLabel).toBe("L’hippocampe")
    expect(firstRound.choices).toContainEqual({ id: "hippocampe", label: "L’hippocampe" })
  })

  it("propose exactement quatre réponses uniques par manche", () => {
    for (const round of whosDatSalmon.rounds) {
      expect(round.kind).toBe("choice")
      if (round.kind !== "choice") continue

      expect(round.choices).toHaveLength(4)
      expect(new Set(round.choices.map((choice) => choice.id)).size).toBe(4)
      expect(new Set(round.choices.map((choice) => choice.label)).size).toBe(4)
    }
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

  it("révèle un fait et une source institutionnelle pour chaque animal", () => {
    for (const round of whosDatSalmon.rounds) {
      expect(round.fact.length).toBeGreaterThan(30)
      expect(round.sourceUrl).toMatch(/^https:\/\/(?:www\.fisheries|oceanservice)\.noaa\.gov\//)
    }
  })

  it("attribue deux points pour chaque réponse exacte", () => {
    expect(whosDatSalmon.scoring).toEqual({ kind: "exact", points: 2 })
  })
})
