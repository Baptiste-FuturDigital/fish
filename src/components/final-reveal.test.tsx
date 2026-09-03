import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { GameView } from "@shared/game"
import { FinalReveal } from "./final-reveal.js"

vi.mock("./final-scoreboard.js", () => ({
  FinalScoreboard: () => <div data-testid="final-scoreboard" />,
}))

afterEach(() => vi.useRealTimers())

const game = {
  id: "game-1",
  code: "FISH",
  name: "Aquarium",
  status: "finished",
  currentRound: 0,
  totalRounds: 1,
  currentPrompt: null,
  players: [],
  teams: [],
  tournament: null,
  createdAt: "2026-09-03T00:00:00.000Z",
} satisfies GameView

describe("FinalReveal audio policy", () => {
  it("conserve le suspense mais ne monte aucun player pour un participant", () => {
    const markup = renderToStaticMarkup(
      <FinalReveal game={game} onLeave={() => undefined} audioEnabled={false} />,
    )

    expect(markup).toContain('data-testid="final-suspense"')
    expect(markup).not.toContain('data-testid="final-suspense-player"')
  })

  it("monte le player du verdict uniquement quand l’audio est activé", () => {
    const markup = renderToStaticMarkup(
      <FinalReveal game={game} onLeave={() => undefined} audioEnabled />,
    )

    expect(markup).toContain('data-testid="final-suspense-player"')
  })

  it("garde le délai pour tous mais suspend l’ambiance uniquement avec audio", async () => {
    const { beginFinalRevealTransition } = await import("./final-reveal.js")
    vi.useFakeTimers()

    const participantTarget = new EventTarget()
    const participantStates: boolean[] = []
    let participantReveals = 0
    participantTarget.addEventListener("fish:set-ambient-suspended", (event) => {
      participantStates.push((event as CustomEvent<boolean>).detail)
    })

    const cleanupParticipant = beginFinalRevealTransition({
      audioEnabled: false,
      target: participantTarget,
      onReveal: () => participantReveals += 1,
    })

    vi.advanceTimersByTime(6_999)
    expect(participantReveals).toBe(0)
    vi.advanceTimersByTime(1)
    expect(participantReveals).toBe(1)
    expect(participantStates).toEqual([])
    cleanupParticipant()

    const hostTarget = new EventTarget()
    const hostStates: boolean[] = []
    let hostReveals = 0
    hostTarget.addEventListener("fish:set-ambient-suspended", (event) => {
      hostStates.push((event as CustomEvent<boolean>).detail)
    })

    const cleanupHost = beginFinalRevealTransition({
      audioEnabled: true,
      target: hostTarget,
      onReveal: () => hostReveals += 1,
    })

    expect(hostStates).toEqual([true])
    vi.advanceTimersByTime(7_000)
    expect(hostReveals).toBe(1)
    expect(hostStates).toEqual([true, false])
    cleanupHost()
    expect(hostStates).toEqual([true, false])
  })
})
