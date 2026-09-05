import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { GameView, PlayerSession, TournamentView } from "@shared/game"
import { QuestionBuzzerScreen } from "./question-buzzer-screen.js"

const playerSession: PlayerSession = {
  gameCode: "FISH",
  playerId: "player-1",
  playerToken: "player-token",
}

const hostSession: PlayerSession = {
  gameCode: "FISH",
  playerId: "host",
  playerToken: "host-token",
  hostToken: "captain-token",
}

function tournament(overrides: Partial<TournamentView> = {}): TournamentView {
  return {
    challengeIndex: 1,
    challengeCount: 4,
    roundIndex: 0,
    roundCount: 5,
    phase: "answering",
    endsAt: new Date(Date.now() + 40_000).toISOString(),
    challenge: {
      id: "question-pour-un-poisson",
      title: "Question pour un poisson",
      shortTitle: "Question pour un poisson",
      emoji: "🐟",
      description: "Buzze au bon moment.",
      rules: [],
      introMusicYoutubeId: "video",
    },
    round: {
      id: "buzzer-hippocampe",
      kind: "buzzer",
      kicker: "Animal 1",
      question: "Quel animal marin se cache derrière ces indices ?",
      durationSeconds: 40,
      answerLabel: "L’hippocampe",
      hostClues: ["Je nage debout."],
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
    ...overrides,
  }
}

function game(tournamentView: TournamentView): GameView {
  return {
    id: "game-1",
    code: "FISH",
    name: "Aquarium buzzer",
    isDemo: false,
    status: "running",
    currentRound: 0,
    totalRounds: 8,
    currentPrompt: null,
    players: [{
      id: "player-1",
      name: "Léa",
      isHost: false,
      score: 0,
      teamId: "abyssaux",
      totem: {
        name: "la raie manta",
        fact: "Elle vole sous l’eau.",
        teamName: "Les Abyssaux",
        imageUrl: "/raie.jpg",
      },
    }],
    teams: [{ id: "abyssaux", name: "Les Abyssaux", score: 0, memberIds: ["player-1"] }],
    tournament: tournamentView,
    createdAt: "2026-09-05T00:00:00.000Z",
  }
}

function render(session: PlayerSession, isHost: boolean, tournamentView: TournamentView) {
  const props = {
    game: game(tournamentView),
    session,
    isHost,
    onBuzz: vi.fn(async () => game(tournamentView)),
    onResolve: vi.fn(async () => game(tournamentView)),
    onToggleTimer: vi.fn(async () => game(tournamentView)),
  }
  return renderToStaticMarkup(<QuestionBuzzerScreen {...props} />)
}

describe("QuestionBuzzerScreen", () => {
  it("exposes the running clock as a host pause control", () => {
    const markup = render(hostSession, true, tournament())

    expect(markup).toContain('aria-label="Mettre le chronomètre en pause"')
    expect(markup).toContain("CHRONO")
  })

  it("exposes a manually paused clock as a host resume control", () => {
    const markup = render(hostSession, true, tournament({
      endsAt: null,
      pausedRemainingMs: 24_500,
    }))

    expect(markup).toContain('aria-label="Reprendre le chronomètre"')
    expect(markup).toContain("PAUSE")
    expect(markup).toContain(">25<")
  })

  it("disables the phone buzzer during a manual pause", () => {
    const markup = render(playerSession, false, tournament({
      endsAt: null,
      pausedRemainingMs: 24_500,
    }))

    expect(markup).toContain("CHRONO EN PAUSE")
    expect(markup).toMatch(/<button[^>]*class="[^"]*buzzer-team[^"]*"[^>]*disabled=""/)
    expect(markup).not.toContain("Reprendre le chronomètre")
  })
})
