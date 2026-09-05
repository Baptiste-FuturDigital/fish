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
  sardineWheel: null,
  sardineWheelAvailable: false,
} satisfies TvTournamentView

const baseGame = {
  code: "FISH",
  name: "L’aquarium de ce soir",
  isDemo: false,
  status: "lobby",
  currentRound: 0,
  totalRounds: 4,
  players: [{ name: "Léa", score: 4, teamId: "abyssaux", imageUrl: "/raie.jpg", animalName: "la raie manta" }],
  teams: [
    { id: "abyssaux", name: "Les Abyssaux", score: 4, memberCount: 1 },
    { id: "coralliens", name: "Les Coralliens", score: 0, memberCount: 0 },
    { id: "electriques", name: "Les Électriques", score: 0, memberCount: 0 },
    { id: "colosses", name: "Les Colosses", score: 0, memberCount: 0 },
  ],
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
    expect(markup).toContain('aria-label="Agrandir la photo de Léa"')
    expect(markup.match(/projector-team-card-rainbow/g)).toHaveLength(4)
    expect(markup).not.toContain("Lancer la partie")
  })

  it("affiche un portrait sélectionné en grand dans un dialogue", async () => {
    const { ProjectorPortraitLightbox } = await import("./projector-screen.js")
    const markup = renderToStaticMarkup(
      <ProjectorPortraitLightbox player={baseGame.players[0]} onClose={() => undefined} />,
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain("Portrait de Léa")
    expect(markup).toContain('/raie.jpg')
    expect(markup).toContain("Fermer le portrait")
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
    expect(markup).toContain("/hippocampe.jpg")
    expect(markup).toContain("projector-round-image")
    expect(markup).not.toContain("Bonne réponse")
  })

  it("masque entièrement le visuel animal de Question pour un poisson pendant la réponse", async () => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: {
        ...tournament,
        phase: "answering",
        challenge: {
          ...tournament.challenge,
          id: "question-pour-un-poisson",
        },
        round: {
          ...tournament.round,
          kind: "buzzer",
          imageUrl: "/teams/20-big-le-kraken.jpg",
        },
      },
    })

    expect(markup).toContain("Combien pèse cet hippocampe")
    expect(markup).toContain("projector-gameplay-grid--full")
    expect(markup).not.toContain("/teams/20-big-le-kraken.jpg")
    expect(markup).not.toContain("projector-round-image")
    expect(markup).not.toContain("projector-round-placeholder")
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
    expect(markup).toContain("/hippocampe.jpg")
    expect(markup).toContain("projector-round-image")
  })

  it("masque entièrement le visuel animal de Question pour un poisson à la révélation", async () => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: {
        ...tournament,
        phase: "reveal",
        challenge: {
          ...tournament.challenge,
          id: "question-pour-un-poisson",
        },
        round: {
          ...tournament.round,
          kind: "buzzer",
          imageUrl: "/teams/20-big-le-kraken.jpg",
          answerLabel: "Le requin blanc",
          fact: "Il détecte les champs électriques.",
        },
      },
    })

    expect(markup).toContain("Le requin blanc")
    expect(markup).toContain("projector-reveal-grid--full")
    expect(markup).not.toContain("/teams/20-big-le-kraken.jpg")
    expect(markup).not.toContain("projector-round-image")
    expect(markup).not.toContain("projector-round-placeholder")
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

  it.each([
    ["offered", "Léa doit déchaîner la roue"],
    ["spinning", "La roue fend les courants"],
    ["won", "Sardine légendaire remportée"],
  ] as const)("priorise la scène roue dans l'état %s", async (status, expected) => {
    const markup = await render({
      ...baseGame,
      status: "running",
      tournament: {
        ...tournament,
        phase: "leaderboard",
        sardineWheel: {
          challengeIndex: 0,
          winnerPlayerName: "Léa",
          status,
          offeredAt: "2026-09-05T20:00:00.000Z",
          startedAt: status === "offered" ? null : "2026-09-05T20:00:01.000Z",
          durationMs: 6_000,
          completedAt: status === "won" ? "2026-09-05T20:00:07.000Z" : null,
        },
      },
    })

    expect(markup).toContain('class="projector-sardine-wheel"')
    expect(markup).toContain("Léa")
    expect(markup).toContain(expected)
    expect(markup).not.toContain("winnerPlayerId")
  })

  it("termine par le classement des bancs et le vainqueur", async () => {
    const markup = await render({ ...baseGame, status: "finished" })

    expect(markup).toContain("Le verdict de Poséithon")
    expect(markup).toContain("Les Abyssaux")
    expect(markup).toContain("40 points")
    expect(markup).not.toContain("<button")
  })
})
