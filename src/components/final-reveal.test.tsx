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

  it("monte un player contrôlable sans autoplay uniquement quand l’audio est activé", async () => {
    const markup = renderToStaticMarkup(
      <FinalReveal game={game} onLeave={() => undefined} audioEnabled />,
    )

    expect(markup).toContain('data-testid="final-suspense-player"')
    const { buildFinalRevealPlayerSource } = await import("./final-reveal.js")
    const source = new URL(buildFinalRevealPlayerSource("http://localhost:5179"))
    expect(source.searchParams.get("autoplay")).toBe("0")
    expect(source.searchParams.get("enablejsapi")).toBe("1")
    expect(source.searchParams.get("end")).toBe("10")
    expect(source.searchParams.get("origin")).toBe("http://localhost:5179")
  })

  it("garde une seconde de silence hôte puis joue sans rien commander au participant", async () => {
    const { beginFinalRevealTransition } = await import("./final-reveal.js")
    vi.useFakeTimers()

    const participantTarget = new EventTarget()
    const participantStates: boolean[] = []
    let participantReveals = 0
    const participantPlay = vi.fn()
    participantTarget.addEventListener("fish:set-ambient-suspended", (event) => {
      participantStates.push((event as CustomEvent<boolean>).detail)
    })

    const cleanupParticipant = beginFinalRevealTransition({
      audioEnabled: false,
      target: participantTarget,
      onReveal: () => participantReveals += 1,
      onPlayAudio: participantPlay,
    })

    vi.advanceTimersByTime(1_000)
    expect(participantPlay).not.toHaveBeenCalled()
    vi.advanceTimersByTime(6_999)
    expect(participantReveals).toBe(1)
    expect(participantStates).toEqual([])
    cleanupParticipant()

    const hostTarget = new EventTarget()
    const hostStates: boolean[] = []
    let hostReveals = 0
    const hostPlay = vi.fn()
    hostTarget.addEventListener("fish:set-ambient-suspended", (event) => {
      hostStates.push((event as CustomEvent<boolean>).detail)
    })

    const cleanupHost = beginFinalRevealTransition({
      audioEnabled: true,
      target: hostTarget,
      onReveal: () => hostReveals += 1,
      onPlayAudio: hostPlay,
    })

    expect(hostStates).toEqual([true])
    vi.advanceTimersByTime(999)
    expect(hostPlay).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(hostPlay).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(5_999)
    expect(hostReveals).toBe(0)
    vi.advanceTimersByTime(1)
    expect(hostReveals).toBe(1)
    expect(hostStates).toEqual([true])
    vi.advanceTimersByTime(3_999)
    expect(hostStates).toEqual([true])
    vi.advanceTimersByTime(1)
    expect(hostStates).toEqual([true, false])
    cleanupHost()
    expect(hostStates).toEqual([true, false])
  })

  it("démarre le player que son chargement arrive avant ou après la seconde de silence", async () => {
    const { createSuspensePlayerController } = await import("./final-reveal.js")

    const commandsWhenLoadedFirst: string[] = []
    const loadedFirst = createSuspensePlayerController((command) => commandsWhenLoadedFirst.push(command))
    loadedFirst.markLoaded()
    expect(commandsWhenLoadedFirst).toEqual([])
    loadedFirst.requestPlay()
    expect(commandsWhenLoadedFirst).toEqual(["playVideo", "unMute"])

    const commandsWhenRequestedFirst: string[] = []
    const requestedFirst = createSuspensePlayerController((command) => commandsWhenRequestedFirst.push(command))
    requestedFirst.requestPlay()
    expect(commandsWhenRequestedFirst).toEqual([])
    requestedFirst.markLoaded()
    expect(commandsWhenRequestedFirst).toEqual(["playVideo", "unMute"])
  })
})
