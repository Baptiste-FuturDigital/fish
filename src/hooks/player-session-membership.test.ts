import { describe, expect, it } from "vitest"

import type { GameView, PlayerSession } from "@shared/game"
import { isPlayerSessionEjected, joinPathForGame } from "./player-session-membership.js"

const game = {
  id: "game-1",
  code: "FISH",
  name: "Aquarium",
  isDemo: false,
  status: "lobby",
  currentRound: 0,
  totalRounds: 0,
  currentPrompt: null,
  players: [
    { id: "player-1", name: "Léa", isHost: false, score: 0, teamId: null, totem: null },
  ],
  teams: [],
  tournament: null,
  createdAt: "2026-09-04T00:00:00.000Z",
} satisfies GameView

const playerSession = {
  gameCode: "FISH",
  playerId: "player-1",
  playerToken: "player-token",
} satisfies PlayerSession

describe("isPlayerSessionEjected", () => {
  it("detects a guest session missing from the lobby", () => {
    expect(isPlayerSessionEjected(playerSession, { ...game, players: [] })).toBe(true)
  })

  it("keeps present guests and the technical host connected", () => {
    expect(isPlayerSessionEjected(playerSession, game)).toBe(false)
    expect(isPlayerSessionEjected(
      { ...playerSession, playerId: "host", hostToken: "host-token" },
      { ...game, players: [] },
    )).toBe(false)
  })

  it("builds a join URL with the game code preserved", () => {
    expect(joinPathForGame("/fish", "fish")).toBe("/fish?code=FISH")
  })
})
