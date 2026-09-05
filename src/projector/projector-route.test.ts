import { describe, expect, it } from "vitest"

import type { TvGameView } from "@shared/tv"

describe("projector route", () => {
  it("lit le code depuis la route TV canonique", async () => {
    const { parseProjectorLocation } = await import("./projector-route.js")

    expect(parseProjectorLocation("/tv/fish", "")).toEqual({ active: true, code: "FISH" })
    expect(parseProjectorLocation("/tv/F1SH/", "")).toEqual({ active: true, code: "F1SH" })
  })

  it("accepte le paramètre historique sans détourner les routes normales", async () => {
    const { parseProjectorLocation } = await import("./projector-route.js")

    expect(parseProjectorLocation("/tv", "?code=fish")).toEqual({ active: true, code: "FISH" })
    expect(parseProjectorLocation("/", "?code=fish")).toEqual({ active: false, code: null })
  })

  it("construit une URL de participation sans propager la route TV", async () => {
    const { buildProjectorJoinUrl, buildProjectorPath } = await import("./projector-route.js")

    expect(buildProjectorJoinUrl("https://party.example", "FISH")).toBe(
      "https://party.example/?code=FISH",
    )
    expect(buildProjectorPath("fish")).toBe("/tv/FISH")
  })

  it("projette chaque état serveur vers une scène publique", async () => {
    const { projectorSceneKind } = await import("./projector-route.js")
    const game = {
      status: "lobby",
      tournament: null,
    } as TvGameView

    expect(projectorSceneKind(game)).toBe("lobby")
    expect(projectorSceneKind({ ...game, status: "finished" })).toBe("final")
    expect(projectorSceneKind({
      ...game,
      status: "running",
      tournament: { phase: "challenge-intro" },
    } as TvGameView)).toBe("intro")
    expect(projectorSceneKind({
      ...game,
      status: "running",
      tournament: { phase: "answering" },
    } as TvGameView)).toBe("gameplay")
    expect(projectorSceneKind({
      ...game,
      status: "running",
      tournament: { phase: "reveal" },
    } as TvGameView)).toBe("reveal")
    expect(projectorSceneKind({
      ...game,
      status: "running",
      tournament: { phase: "leaderboard" },
    } as TvGameView)).toBe("leaderboard")
    expect(projectorSceneKind({
      ...game,
      status: "running",
      tournament: {
        phase: "leaderboard",
        sardineWheel: { status: "offered" },
      },
    } as TvGameView)).toBe("sardine-wheel")
  })
})
