import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { TeamAnswerView, TeamView } from "@shared/game"
import { SalmonAnswerProgress } from "./salmon-answer-progress.js"

const teams = [
  { id: "ugly", name: "Les Abysses", score: 0, memberIds: ["p1"] },
  { id: "pretty", name: "Les Coraux", score: 0, memberIds: ["p2", "p3"] },
  { id: "cool", name: "Les Courants", score: 0, memberIds: ["p4"] },
  { id: "big", name: "Les Colosses", score: 0, memberIds: [] },
] satisfies TeamView[]

function render(answers: TeamAnswerView[]) {
  return renderToStaticMarkup(
    <SalmonAnswerProgress teams={teams} answers={answers} />,
  )
}

describe("SalmonAnswerProgress", () => {
  it("compte uniquement les bancs participants ayant verrouillé leur réponse", () => {
    const markup = render([
      { teamId: "ugly", answer: null, locked: true },
      { teamId: "pretty", answer: null, locked: false },
      { teamId: "big", answer: null, locked: true },
    ])

    expect(markup).toContain("1 / 3 bancs ont répondu")
    expect(markup).toContain('aria-valuenow="1"')
    expect(markup).toContain('aria-valuemax="3"')
    expect(markup).toContain("Les Abysses")
    expect(markup).toContain("Réponse verrouillée")
    expect(markup).toContain("Les Coraux")
    expect(markup).toContain("En réflexion")
    expect(markup).not.toContain("Les Colosses")
  })

  it("annonce clairement quand tous les bancs ont répondu", () => {
    const markup = render([
      { teamId: "ugly", answer: null, locked: true },
      { teamId: "pretty", answer: null, locked: true },
      { teamId: "cool", answer: null, locked: true },
    ])

    expect(markup).toContain("Tous les bancs ont répondu")
    expect(markup).toContain('data-complete="true"')
  })
})
