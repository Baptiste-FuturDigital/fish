import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { PoseithonBonusView } from "@shared/game"
import { PoseithonBonus } from "./poseithon-bonus.js"

describe("PoseithonBonus", () => {
  it("propose à l'hôte une seule faveur de rattrapage disponible", () => {
    const markup = renderToStaticMarkup(
      <PoseithonBonus isHost available pending={false} bonus={null} onApply={vi.fn()} />,
    )

    expect(markup).toContain("Marée de Poséithon")
    expect(markup).toContain("+20 points")
    expect(markup).toContain("Déchaîner la faveur")
  })

  it("annonce le banc favorisé à tous les joueurs", () => {
    const bonus = {
      challengeIndex: 0,
      challengeId: "le-juste-poisson",
      teamId: "abyssaux",
      teamName: "Les Abyssaux",
      points: 2,
      awardedAt: "2026-09-04T00:00:00.000Z",
    } satisfies PoseithonBonusView
    const markup = renderToStaticMarkup(
      <PoseithonBonus isHost={false} available={false} pending={false} bonus={bonus} onApply={vi.fn()} />,
    )

    expect(markup).toContain("Les Abyssaux")
    expect(markup).toContain("+20")
    expect(markup).not.toContain("Déchaîner la faveur")
  })
})
