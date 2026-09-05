import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { PlayerSession, SardineWheelView } from "@shared/game"
import { SardineWheel } from "./sardine-wheel.js"

const hostSession: PlayerSession = {
  gameCode: "FISH",
  playerId: "host",
  playerToken: "player-token",
  hostToken: "host-token",
}
const winnerSession: PlayerSession = {
  gameCode: "FISH",
  playerId: "p1",
  playerToken: "winner-token",
}
const otherSession: PlayerSession = {
  gameCode: "FISH",
  playerId: "p2",
  playerToken: "other-token",
}

function wheel(status: SardineWheelView["status"]): SardineWheelView {
  return {
    challengeIndex: 0,
    winnerPlayerId: "p1",
    winnerPlayerName: "Léa",
    status,
    offeredAt: "2026-09-05T20:00:00.000Z",
    startedAt: status === "offered" ? null : "2026-09-05T20:00:01.000Z",
    durationMs: 6_000,
    completedAt: status === "won" ? "2026-09-05T20:00:07.000Z" : null,
  }
}

function render(session: PlayerSession, value: SardineWheelView | null, available = false) {
  return renderToStaticMarkup(
    <SardineWheel
      session={session}
      wheel={value}
      available={available}
      winnerImageUrl="/players/lea.png"
      pending={false}
      onOffer={vi.fn()}
      onSpin={vi.fn()}
    />,
  )
}

describe("SardineWheel", () => {
  it("propose au maître de remettre la faveur", () => {
    const markup = render(hostSession, null, true)

    expect(markup).toContain("Roue de Poséithon")
    expect(markup).toContain("Déchaîner la faveur")
    expect(markup).not.toContain("+20 points")
  })

  it("invite uniquement le gagnant à lancer la roue", () => {
    const winnerMarkup = render(winnerSession, wheel("offered"))
    const otherMarkup = render(otherSession, wheel("offered"))

    expect(winnerMarkup).toContain("La faveur t&#x27;appelle")
    expect(winnerMarkup).toContain("Déchaîner la roue")
    expect(winnerMarkup).toContain("/players/lea.png")
    expect(otherMarkup).toContain("Léa prépare la Roue de Poséithon")
    expect(otherMarkup).not.toContain("Déchaîner la roue")
  })

  it("affiche la roue pendant la rotation", () => {
    const markup = render(winnerSession, wheel("spinning"))

    expect(markup).toContain('data-state="spinning"')
    expect(markup).toContain('aria-label="Roue des poissons en rotation"')
    expect(markup).toContain("La roue fend les courants")
  })

  it("rend la victoire et la sardine explicites", () => {
    const markup = render(otherSession, wheel("won"))

    expect(markup).toContain('data-state="won"')
    expect(markup).toContain("Sardine légendaire remportée")
    expect(markup).toContain("Léa")
    expect(markup).toContain('aria-live="assertive"')
  })
})
