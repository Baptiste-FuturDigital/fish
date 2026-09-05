import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { TvGameView, TvTournamentView } from "@shared/tv"

const tournament = {
  challengeIndex: 0,
  challengeCount: 4,
  roundIndex: 0,
  roundCount: 3,
  phase: "challenge-intro",
  endsAt: null,
  challenge: {
    id: "le-juste-poisson",
    title: "Le juste poisson",
    shortTitle: "Le juste poisson",
    emoji: "⚖️",
    description: "Devinez le poids.",
    rules: ["Chaque joueur répond.", "Le plus proche porte son banc."],
    introMusicYoutubeId: "video",
  },
  round: {
    id: "hippocampe",
    kind: "number",
    kicker: "Poids plume",
    question: "Combien pèse cet hippocampe ?",
    durationSeconds: 20,
    imageUrl: "/hippocampe.jpg",
  },
  answerProgress: [{ teamId: "abyssaux", submittedCount: 0, lockedCount: 0 }],
  results: [],
  teamResults: [],
  bonus: null,
  bonusAvailable: false,
  fiftyFiftyJokers: [],
  buzz: null,
  blockedTeamId: null,
  pausedRemainingMs: null,
} satisfies TvTournamentView

const baseGame = {
  code: "FISH",
  name: "L’aquarium de ce soir",
  isDemo: false,
  status: "lobby",
  currentRound: 0,
  totalRounds: 4,
  players: [{ name: "Léa", score: 4, teamId: "abyssaux", imageUrl: "/raie.jpg" }],
  teams: [{ id: "abyssaux", name: "Les Abyssaux", score: 4, memberCount: 1 }],
  tournament: null,
  createdAt: "2026-09-05T00:00:00.000Z",
} satisfies TvGameView

async function render(game: TvGameView) {
  const { ProjectorScreen } = await import("./projector-screen.js")
  return renderToStaticMarkup(
    <ProjectorScreen game={game} joinUrl="https://party.example/?code=FISH" />,
  )
}

describe("ProjectorScreen", () => {
  it("affiche le lobby, le QR et les joueurs sans commande", async () => {
    const markup = await render(baseGame)

    expect(markup).toContain("Scanne pour rejoindre")
    expect(markup).toContain("FISH")
    expect(markup).toContain("Léa")
    expect(markup).not.toContain("<button")
  })

  it.each([
    [0, "PREMIÈRE ÉPREUVE"],
    [1, "DEUXIÈME ÉPREUVE"],
    [2, "TROISIÈME ÉPREUVE"],
    [3, "QUATRIÈME ÉPREUVE"],
  ] as const)("affiche le libellé ordonné de l’introduction %i", async (challengeIndex, label) => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: { ...tournament, challengeIndex },
    })

    expect(markup).toContain(label)
    expect(markup).not.toContain("PROCHAINE ÉPREUVE")
    expect(markup).toContain("Le juste poisson")
    expect(markup).toContain("Le plus proche porte son banc")
  })

  it("affiche uniquement l’état public pendant la réponse", async () => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: {
        ...tournament,
        phase: "answering",
        answerProgress: [{ teamId: "abyssaux", submittedCount: 1, lockedCount: 1 }],
      },
    })

    expect(markup).toContain("Combien pèse cet hippocampe")
    expect(markup).toContain("1 / 1 poissons ont répondu")
    expect(markup).not.toContain("Bonne réponse")
  })

  it("affiche la solution et le fait marin après révélation", async () => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: {
        ...tournament,
        phase: "reveal",
        round: {
          ...tournament.round,
          answerLabel: "Environ 12,5 grammes",
          fact: "Le mâle porte les petits.",
          correctAnswer: 0.0125,
        },
      },
    })

    expect(markup).toContain("Environ 12,5 grammes")
    expect(markup).toContain("Le mâle porte les petits")
  })

  it("affiche le classement individuel entre les épreuves", async () => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: { ...tournament, phase: "leaderboard" },
    })

    expect(markup).toContain("Classement individuel")
    expect(markup).toContain("40")
    expect(markup).toContain("Les Abyssaux")
  })

  it("termine par le classement des bancs et le vainqueur", async () => {
    const markup = await render({ ...baseGame, status: "finished" })

    expect(markup).toContain("Le verdict de Poséithon")
    expect(markup).toContain("Les Abyssaux")
    expect(markup).toContain("40 points")
    expect(markup).not.toContain("<button")
  })
})
