import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { GameView, PlayerSession } from "@shared/game"
import { ChallengeScreen } from "./challenge-screen.js"

const session = {
  gameCode: "FISH",
  playerId: "player-1",
  playerToken: "player-token",
} satisfies PlayerSession

function introGame(challengeIndex: number): GameView {
  return {
    id: "game-1",
    code: "FISH",
    name: "Aquarium test",
    isDemo: false,
    status: "running",
    currentRound: 1,
    totalRounds: 23,
    currentPrompt: null,
    createdAt: "2026-09-04T00:00:00.000Z",
    players: [],
    teams: [],
    tournament: {
      challengeIndex,
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
        description: "Trouve le poids.",
        rules: ["Une règle."],
        introMusicYoutubeId: "video",
      },
      round: {
        id: "round-1",
        kind: "number",
        kicker: "Manche 1",
        question: "Quel poids ?",
        durationSeconds: 20,
      },
      answers: [],
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
    },
  }
}

describe("ChallengeScreen", () => {
  it("présente Who's that salmon en deux grandes cartes A/B sur le téléphone", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:8787" } })
    const game = introGame(2)
    game.players = [{
      id: "player-1",
      name: "Léa",
      isHost: false,
      score: 0,
      teamId: "team-a",
      totem: null,
    }]
    game.teams = [{ id: "team-a", name: "Les Saumons", score: 0, memberIds: ["player-1"] }]
    game.tournament!.phase = "answering"
    game.tournament!.challenge = {
      id: "whos-dat-salmon",
      title: "Who's that salmon ?",
      shortTitle: "Who's that salmon ?",
      emoji: "🐟",
      description: "Devine.",
      rules: ["Choisis."],
      introMusicYoutubeId: "FsvGm4pqlW8",
      answeringMusicYoutubeId: "3pPR6IOV7Rg",
    }
    game.tournament!.round = {
      id: "salmon-1",
      kind: "choice",
      kicker: "Duel 1",
      question: "Qui est-ce ?",
      durationSeconds: 20,
      imageUrl: "/game/Who's that salmon/1-guess-whale.png",
      choices: [
        { id: "baleine", label: "Baleine" },
        { id: "pikachu", label: "Pikachu" },
      ],
    }

    const markup = renderToStaticMarkup(
      <ChallengeScreen
        game={game}
        session={session}
        onAdvance={vi.fn(async () => game)}
        onFinish={vi.fn(async () => game)}
        onSubmit={vi.fn(async () => game)}
        onUseFiftyFifty={vi.fn(async () => game)}
        onBuzz={vi.fn(async () => game)}
        onToggleQuestionTimer={vi.fn(async () => game)}
        onResolveBuzz={vi.fn(async () => game)}
      />,
    )

    expect(markup).toContain("salmon-choice-grid")
    expect(markup.match(/salmon-choice-card/g)).toHaveLength(2)
    expect(markup).toContain("Baleine")
    expect(markup).toContain("Pikachu")
  })

  it("donne au maître une commande explicite pour passer à l'image suivante", () => {
    const game = introGame(2)
    game.tournament!.phase = "reveal"
    game.tournament!.round.answerLabel = "Pikachu"
    game.tournament!.round.fact = "Un Pikachu marin surgit des abysses."
    game.tournament!.challenge.id = "whos-dat-salmon"

    const markup = renderToStaticMarkup(
      <ChallengeScreen
        game={game}
        session={{ ...session, hostToken: "host-token" }}
        onAdvance={vi.fn(async () => game)}
        onFinish={vi.fn(async () => game)}
        onSubmit={vi.fn(async () => game)}
        onUseFiftyFifty={vi.fn(async () => game)}
        onBuzz={vi.fn(async () => game)}
        onToggleQuestionTimer={vi.fn(async () => game)}
        onResolveBuzz={vi.fn(async () => game)}
      />,
    )

    expect(markup).toContain("Image suivante")
  })

  it("marque le bouton de fin pour son survol orange", () => {
    const game = introGame(0)
    game.tournament!.phase = "reveal"
    game.tournament!.round.answerLabel = "12 grammes"
    game.tournament!.round.fact = "Un fait marin."
    const markup = renderToStaticMarkup(
      <ChallengeScreen
        game={game}
        session={{ ...session, hostToken: "host-token" }}
        onAdvance={vi.fn(async () => game)}
        onFinish={vi.fn(async () => game)}
        onSubmit={vi.fn(async () => game)}
        onUseFiftyFifty={vi.fn(async () => game)}
        onBuzz={vi.fn(async () => game)}
        onToggleQuestionTimer={vi.fn(async () => game)}
        onResolveBuzz={vi.fn(async () => game)}
      />,
    )

    expect(markup).toContain("finish-tournament-button")
  })

  it("garde les réponses Millionaire visibles au reveal et colore le choix personnel", () => {
    const game = introGame(2)
    game.players = [{
      id: "player-1",
      name: "Léa",
      isHost: false,
      score: 2,
      teamId: "team-a",
      totem: null,
    }]
    game.teams = [{ id: "team-a", name: "Les Saumons", score: 2, memberIds: ["player-1"] }]
    game.tournament!.phase = "reveal"
    game.tournament!.challenge = {
      id: "qui-veut-gagner-des-poissons",
      title: "Qui veut gagner des poissons ?",
      shortTitle: "Qui veut gagner des poissons ?",
      emoji: "🐡",
      description: "Quatre réponses.",
      rules: ["Choisis."],
      introMusicYoutubeId: "video",
      confirmationLabel: "C’est mon dernier mot",
    }
    game.tournament!.round = {
      id: "million-1",
      kind: "choice",
      kicker: "Palier 1 · 10 poissons",
      question: "Quel poisson ?",
      durationSeconds: 30,
      choices: [
        { id: "a", label: "Anchois" },
        { id: "b", label: "Baleine" },
        { id: "c", label: "Calamar" },
        { id: "d", label: "Dauphin" },
      ],
      correctAnswer: "b",
      answerLabel: "Baleine",
      fact: "Une explication marine.",
    }
    game.tournament!.answers = [{
      playerId: "player-1",
      playerName: "Léa",
      teamId: "team-a",
      answer: "b",
      locked: true,
    }]
    game.tournament!.results = [{
      playerId: "player-1",
      playerName: "Léa",
      teamId: "team-a",
      answer: "Baleine",
      points: 1,
      isCorrect: true,
      distance: null,
    }]

    const markup = renderToStaticMarkup(
      <ChallengeScreen
        game={game}
        session={session}
        onAdvance={vi.fn(async () => game)}
        onFinish={vi.fn(async () => game)}
        onSubmit={vi.fn(async () => game)}
        onUseFiftyFifty={vi.fn(async () => game)}
        onBuzz={vi.fn(async () => game)}
        onToggleQuestionTimer={vi.fn(async () => game)}
        onResolveBuzz={vi.fn(async () => game)}
      />,
    )

    expect(markup).toContain("Quel poisson ?")
    expect(markup.match(/data-choice-id=/g)).toHaveLength(4)
    expect(markup).toContain('data-answer-state="correct"')
    expect(markup).not.toContain("LA RÉPONSE ÉTAIT")
  })

  it.each([
    [0, "PREMIÈRE ÉPREUVE"],
    [1, "DEUXIÈME ÉPREUVE"],
    [2, "TROISIÈME ÉPREUVE"],
    [3, "QUATRIÈME ÉPREUVE"],
  ])("annonce l'épreuve %s avec son ordinal", (challengeIndex, expectedLabel) => {
    const game = introGame(challengeIndex)
    const markup = renderToStaticMarkup(
      <ChallengeScreen
        game={game}
        session={session}
        onAdvance={vi.fn(async () => game)}
        onFinish={vi.fn(async () => game)}
        onSubmit={vi.fn(async () => game)}
        onUseFiftyFifty={vi.fn(async () => game)}
        onBuzz={vi.fn(async () => game)}
        onToggleQuestionTimer={vi.fn(async () => game)}
        onResolveBuzz={vi.fn(async () => game)}
      />,
    )

    expect(markup).toContain(expectedLabel)
    expect(markup).toContain('class="round-counter"')
  })

  it("habille Question pour un poisson comme un jeu télévisé marin", () => {
    const game = introGame(1)
    game.tournament!.challenge = {
      id: "question-pour-un-poisson",
      title: "Question pour un poisson",
      shortTitle: "Question pour un poisson",
      emoji: "🐠",
      description: "Dix questions marines.",
      rules: ["Règle une.", "Règle deux.", "Règle trois."],
      introMusicYoutubeId: "video",
      introImageUrl: "/game/Question pour un poisson/question-pour-un-poisson.png",
    }

    const markup = renderToStaticMarkup(
      <ChallengeScreen
        game={game}
        session={session}
        onAdvance={vi.fn(async () => game)}
        onFinish={vi.fn(async () => game)}
        onSubmit={vi.fn(async () => game)}
        onUseFiftyFifty={vi.fn(async () => game)}
        onBuzz={vi.fn(async () => game)}
        onToggleQuestionTimer={vi.fn(async () => game)}
        onResolveBuzz={vi.fn(async () => game)}
      />,
    )

    expect(markup).toContain("question-champion-intro-card")
    expect(markup).toContain('src="/game/Question pour un poisson/question-pour-un-poisson.png"')
    expect(markup).toContain("challenge-intro-image")
    expect(markup).toContain("Question pour un poisson")
    expect(markup).toContain("🐋")
    expect(markup).toContain("🐢")
    expect(markup).toContain("🐙")
  })
})
