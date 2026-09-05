import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { GameView, PlayerSession, PrizeClaimResult, PrizeType } from "@shared/game"
import {
  PrizeClaimCard,
  PrizeClaims,
  eligiblePrizeTypes,
  isValidPrizeEmail,
} from "./prize-claims.js"

function player(id: string, name: string, score: number, teamId: string) {
  return { id, name, score, teamId, isHost: false, totem: null }
}

const game = {
  id: "game-prizes",
  code: "FISH",
  name: "Finale",
  isDemo: false,
  status: "finished",
  currentRound: 4,
  totalRounds: 4,
  currentPrompt: null,
  players: [
    player("alice", "Alice", 100, "abysses"),
    player("bruno", "Bruno", 10, "coraux"),
    player("zoe", "Zoé", 100, "abysses"),
  ],
  teams: [
    { id: "abysses", name: "Les Abysses", score: 200, memberIds: ["alice", "zoe"] },
    { id: "coraux", name: "Les Coraux", score: 10, memberIds: ["bruno"] },
  ],
  tournament: null,
  createdAt: "2026-09-05T00:00:00.000Z",
} satisfies GameView

function session(playerId: string, hostToken?: string): PlayerSession {
  return { gameCode: game.code, playerId, playerToken: "player-token", hostToken }
}

describe("PrizeClaims eligibility", () => {
  it("uses deterministic rankings to expose independent best, worst and team cards", () => {
    expect(eligiblePrizeTypes(game, "alice")).toEqual(["best-player", "winning-team"])
    expect(eligiblePrizeTypes(game, "zoe")).toEqual(["winning-team"])
    expect(eligiblePrizeTypes(game, "bruno")).toEqual(["worst-player"])
  })

  it("renders no email form for host, TV or unknown sessions", () => {
    const claim = vi.fn()
    const host = renderToStaticMarkup(
      <PrizeClaims game={game} session={session("alice", "host-token")} onClaim={claim} />,
    )
    const tv = renderToStaticMarkup(<PrizeClaims game={game} session={null} onClaim={claim} />)
    const unknown = renderToStaticMarkup(
      <PrizeClaims game={game} session={session("intrus")} onClaim={claim} />,
    )

    expect(host).toBe("")
    expect(tv).toBe("")
    expect(unknown).toBe("")
  })

  it("renders one separate form per prize earned by the current player", () => {
    const markup = renderToStaticMarkup(
      <PrizeClaims game={game} session={session("alice")} onClaim={vi.fn()} />,
    )

    expect(markup).toContain("Champion individuel")
    expect(markup).toContain("Banc champion")
    expect(markup).not.toContain("Poisson pané")
    expect(markup).toContain('id="prize-email-best-player"')
    expect(markup).toContain('id="prize-email-winning-team"')
    expect(markup).toContain('type="email"')
    expect(markup).toContain("required=\"\"")
  })

  it("blocks malformed addresses before any claim", () => {
    expect(isValidPrizeEmail("poisson@example.com")).toBe(true)
    expect(isValidPrizeEmail("poisson@abysses")).toBe(false)
    expect(isValidPrizeEmail("  ")).toBe(false)
  })
})

describe("PrizeClaimCard feedback", () => {
  const claim = vi.fn(async (_type: PrizeType, _email: string) => ({
    prizeType: "best-player" as const,
    status: "sent" as const,
    alreadySent: false,
  }))

  it("replaces a successful form with an accessible sent confirmation", () => {
    const result: PrizeClaimResult = {
      prizeType: "best-player",
      status: "sent",
      alreadySent: false,
    }
    const markup = renderToStaticMarkup(
      <PrizeClaimCard prizeType="best-player" onClaim={claim} result={result} />,
    )

    expect(markup).toContain("Prix envoyé")
    expect(markup).toContain('role="alert"')
    expect(markup).not.toContain('type="email"')
  })

  it("keeps the form retryable and renders a safe server error", () => {
    const markup = renderToStaticMarkup(
      <PrizeClaimCard
        prizeType="winning-team"
        onClaim={claim}
        initialError="La mouette postale est indisponible."
      />,
    )

    expect(markup).toContain("La mouette postale est indisponible.")
    expect(markup).toContain('type="email"')
    expect(markup).toContain("Réessayer l’envoi")
  })
})
