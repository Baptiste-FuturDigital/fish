import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { PlayerAnswerView, PlayerView } from "@shared/game"
import { SalmonAnswerProgress } from "./salmon-answer-progress.js"

const players = [
  { id: "p1", name: "Léa", score: 0, isHost: false, teamId: "ugly", totem: null },
  { id: "p2", name: "Sam", score: 0, isHost: false, teamId: "pretty", totem: null },
  { id: "p3", name: "Jo", score: 0, isHost: false, teamId: "pretty", totem: null },
  { id: "p4", name: "Mia", score: 0, isHost: false, teamId: "cool", totem: null },
] satisfies PlayerView[]

function render(answers: PlayerAnswerView[]) {
  return renderToStaticMarkup(
    <SalmonAnswerProgress players={players} answers={answers} />,
  )
}

describe("SalmonAnswerProgress", () => {
  it("compte chaque poisson ayant verrouillé sa réponse", () => {
    const markup = render([
      { playerId: "p1", playerName: "Léa", teamId: "ugly", answer: null, locked: true },
      { playerId: "p2", playerName: "Sam", teamId: "pretty", answer: null, locked: false },
    ])

    expect(markup).toContain("1 / 4 poissons ont répondu")
    expect(markup).toContain('aria-valuenow="1"')
    expect(markup).toContain('aria-valuemax="4"')
    expect(markup).toContain("Léa")
    expect(markup).toContain("Réponse verrouillée")
    expect(markup).toContain("Sam")
    expect(markup).toContain("En réflexion")
  })

  it("annonce clairement quand tous les poissons ont répondu", () => {
    const markup = render([
      { playerId: "p1", playerName: "Léa", teamId: "ugly", answer: null, locked: true },
      { playerId: "p2", playerName: "Sam", teamId: "pretty", answer: null, locked: true },
      { playerId: "p3", playerName: "Jo", teamId: "pretty", answer: null, locked: true },
      { playerId: "p4", playerName: "Mia", teamId: "cool", answer: null, locked: true },
    ])

    expect(markup).toContain("Tous les poissons ont répondu")
    expect(markup).toContain('data-complete="true"')
  })
})
