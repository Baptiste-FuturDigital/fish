import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { GameView, PlayerSession, TournamentPhase } from "@shared/game"
import {
  HostAudioConsole,
  buildHostAudioPlayerSource,
  selectHostAudioTracks,
} from "./host-audio-console.js"

const hostSession = {
  gameCode: "FISH",
  playerId: "host",
  playerToken: "player-token",
  hostToken: "host-token",
} satisfies PlayerSession

const playerSession = {
  gameCode: "FISH",
  playerId: "player",
  playerToken: "player-token",
} satisfies PlayerSession

function game(status: GameView["status"], phase: TournamentPhase = "challenge-intro"): GameView {
  return {
    id: "game-1",
    code: "FISH",
    name: "Aquarium",
    isDemo: false,
    status,
    currentRound: 1,
    totalRounds: 4,
    currentPrompt: null,
    players: [],
    teams: [],
    tournament: status === "running" ? {
      challengeIndex: 1,
      challengeCount: 4,
      roundIndex: 0,
      roundCount: 3,
      phase,
      endsAt: null,
      challenge: {
        id: "qui-veut-gagner-des-poissons",
        title: "Qui veut gagner des poissons ?",
        shortTitle: "Millionnaire",
        emoji: "🦈",
        description: "Choisis.",
        rules: ["Une règle."],
        introMusicYoutubeId: "intro-video",
        introMusicStartSeconds: 4,
        introMusicEndSeconds: 12,
        answeringMusicYoutubeId: "answering-video",
        timerEndSoundYoutubeId: "timer-end-video",
      },
      round: {
        id: "round-1",
        kind: "choice",
        kicker: "Question 1",
        question: "Quel poisson ?",
        durationSeconds: 20,
        choices: [],
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
    } : null,
    createdAt: "2026-09-05T00:00:00.000Z",
  }
}

describe("host audio track selection", () => {
  it("propose uniquement l'ambiance dans le lobby", () => {
    expect(selectHostAudioTracks(game("lobby")).map((track) => track.kind)).toEqual(["ambient"])
  })

  it("propose le générique découpé et l'ambiance pendant l'introduction", () => {
    const tracks = selectHostAudioTracks(game("running", "challenge-intro"))

    expect(tracks.map((track) => track.kind)).toEqual(["challenge-intro", "ambient"])
    expect(tracks[0]).toMatchObject({
      videoId: "intro-video",
      startSeconds: 4,
      endSeconds: 12,
    })
  })

  it("propose le chrono et son effet de fin pendant les réponses", () => {
    expect(selectHostAudioTracks(game("running", "answering")).map((track) => track.kind)).toEqual([
      "answering",
      "timer-end",
      "ambient",
    ])
  })

  it("propose le fond et le jingle de manche pour Who's that salmon", () => {
    const salmon = game("running", "answering")
    salmon.tournament!.challenge = {
      id: "whos-dat-salmon",
      title: "Who's that salmon ?",
      shortTitle: "Salmon",
      emoji: "🐟",
      description: "Devine.",
      rules: ["Une règle."],
      introMusicYoutubeId: "salmon-cue",
      answeringMusicYoutubeId: "salmon-background",
    }

    expect(selectHostAudioTracks(salmon).map((track) => track.kind)).toEqual([
      "answering",
      "salmon-cue",
      "ambient",
    ])
  })

  it("propose le suspense final et l'ambiance lorsque le tournoi est terminé", () => {
    expect(selectHostAudioTracks(game("finished")).map((track) => track.kind)).toEqual([
      "final-suspense",
      "ambient",
    ])
  })
})

describe("HostAudioConsole", () => {
  it("reste absente pour un joueur et rend la régie pour le maître", () => {
    expect(renderToStaticMarkup(
      <HostAudioConsole game={game("lobby")} session={playerSession} />,
    )).toBe("")

    const hostMarkup = renderToStaticMarkup(
      <HostAudioConsole game={game("lobby")} session={hostSession} />,
    )
    expect(hostMarkup).toContain('data-testid="host-audio-console"')
    expect(hostMarkup).toContain("Régie son")
  })

  it("affiche un lecteur YouTube natif qui ne démarre jamais automatiquement", () => {
    const source = new URL(buildHostAudioPlayerSource({
      kind: "challenge-intro",
      label: "Générique",
      videoId: "intro-video",
      startSeconds: 4,
      endSeconds: 12,
    }, "http://localhost:5179"))

    expect(source.searchParams.get("autoplay")).toBe("0")
    expect(source.searchParams.get("controls")).toBe("1")
    expect(source.searchParams.get("playsinline")).toBe("1")
    expect(source.searchParams.get("start")).toBe("4")
    expect(source.searchParams.get("end")).toBe("12")

    const markup = renderToStaticMarkup(
      <HostAudioConsole game={game("running", "challenge-intro")} session={hostSession} />,
    )
    expect(markup).toContain('data-testid="host-audio-player"')
    expect(markup).toContain("controls=1")
    expect(markup).toContain("autoplay=0")
  })
})
