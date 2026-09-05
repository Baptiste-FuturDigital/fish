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
  isDemo: false,
  status: "finished",
  currentRound: 0,
  totalRounds: 1,
  currentPrompt: null,
  players: [],
  teams: [],
  tournament: null,
  createdAt: "2026-09-03T00:00:00.000Z",
} satisfies GameView

describe("FinalReveal", () => {
  it("conserve le suspense sans monter de lecteur audio automatique", () => {
    const markup = renderToStaticMarkup(
      <FinalReveal game={game} onLeave={() => undefined} />,
    )

    expect(markup).toContain('data-testid="final-suspense"')
    expect(markup).not.toContain('data-testid="final-suspense-player"')
  })

  it("révèle le classement après sept secondes", async () => {
    const { beginFinalRevealTransition } = await import("./final-reveal.js")
    vi.useFakeTimers()

    const onReveal = vi.fn()
    const cleanup = beginFinalRevealTransition({ onReveal })
    vi.advanceTimersByTime(6_999)
    expect(onReveal).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onReveal).toHaveBeenCalledOnce()
    cleanup()
  })
})
