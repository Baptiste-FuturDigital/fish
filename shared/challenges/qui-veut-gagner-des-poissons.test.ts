import { describe, expect, it } from "vitest"

import { quiVeutGagnerDesPoissons } from "./qui-veut-gagner-des-poissons.js"

describe("quiVeutGagnerDesPoissons", () => {
  it("définit l’habillage du jeu télévisé", () => {
    expect(quiVeutGagnerDesPoissons.id).toBe(
      "qui-veut-gagner-des-poissons",
    )
    expect(quiVeutGagnerDesPoissons.title).toBe(
      "Qui veut gagner des poissons ?",
    )
    expect(quiVeutGagnerDesPoissons.shortTitle).toBe(
      "Qui veut gagner des poissons ?",
    )
    expect(quiVeutGagnerDesPoissons.introImageUrl).toBe(
      "/game/Qui veut gagner des poissons/qui-veut-gagner-des-poissons.png",
    )
    expect(quiVeutGagnerDesPoissons.introMusicYoutubeId).toBe("ntFaUwJMhg0")
    expect(quiVeutGagnerDesPoissons.answeringMusicYoutubeId).toBe("236sJVHRh1M")
    expect(quiVeutGagnerDesPoissons.timerEndSoundYoutubeId).toBe("5ijevRmcIBM")
    expect(quiVeutGagnerDesPoissons.confirmationLabel).toBe(
      "C’est mon dernier mot",
    )
    expect(quiVeutGagnerDesPoissons.rules.join(" ")).toContain("50/50")
  })

  it("contient exactement cinq questions de trente secondes", () => {
    expect(quiVeutGagnerDesPoissons.rounds).toHaveLength(5)

    for (const round of quiVeutGagnerDesPoissons.rounds) {
      expect(round.kind).toBe("choice")
      expect(round.durationSeconds).toBe(30)
    }
  })

  it("propose quatre options uniques et une réponse valide par question", () => {
    for (const round of quiVeutGagnerDesPoissons.rounds) {
      if (round.kind !== "choice") {
        throw new Error(`La manche ${round.id} doit être un choix multiple`)
      }

      expect(round.choices).toHaveLength(4)
      expect(new Set(round.choices.map((choice) => choice.id)).size).toBe(4)
      expect(new Set(round.choices.map((choice) => choice.label)).size).toBe(4)

      const correctChoice = round.choices.find(
        (choice) => choice.id === round.correctAnswer,
      )

      expect(correctChoice).toBeDefined()
      expect(correctChoice?.label).toBe(round.answerLabel)
    }
  })

  it("fournit une explication courte et une source HTTPS fiable", () => {
    for (const round of quiVeutGagnerDesPoissons.rounds) {
      expect(round.fact.trim().length).toBeGreaterThan(20)
      expect(round.fact.length).toBeLessThan(180)
      expect(round.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it("utilise des identifiants uniques", () => {
    const ids = quiVeutGagnerDesPoissons.rounds.map((round) => round.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("annonce cinq paliers de difficulté croissante", () => {
    quiVeutGagnerDesPoissons.rounds.forEach((round, index) => {
      expect(round.kicker).toContain(`Palier ${index + 1}`)
    })
  })

  it("garde des gains internes équilibrés avant l’affichage multiplié par dix", () => {
    expect(quiVeutGagnerDesPoissons.scoring).toEqual({
      kind: "escalating",
      points: [1, 2, 3, 5, 10],
    })
  })

  it("consacre le quatrième palier aux épines de l’oursin comestible européen", () => {
    const round = quiVeutGagnerDesPoissons.rounds[3]

    expect(round).toEqual(expect.objectContaining({
      id: "million-4-epines-oursin",
      kicker: "Palier 4 · 50 poissons",
      durationSeconds: 30,
      question: "Chez l’oursin comestible européen, combien d’épines peut-on compter au minimum ?",
      correctAnswer: "environ-3000",
      answerLabel: "Environ 3 000",
    }))
    expect(round.choices).toEqual([
      { id: "environ-3000", label: "Environ 3 000" },
      { id: "environ-5000", label: "Environ 5 000" },
      { id: "environ-8000", label: "Environ 8 000" },
      { id: "environ-10000", label: "Environ 10 000" },
    ])
    expect(round.fact).toContain("varie selon l’espèce et la taille")
    expect(round.fact).toContain("au moins 3 000 épines")
  })
})
