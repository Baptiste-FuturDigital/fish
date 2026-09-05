import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SalmonRoundAudio } from "./salmon-round-audio.js"

describe("SalmonRoundAudio", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("gives the host an explicit control for the continuous Pokémon music", () => {
    vi.stubGlobal("window", { location: { origin: "http://localhost:8787" } })

    const markup = renderToStaticMarkup(
      <SalmonRoundAudio
        enabled
        phase="answering"
        roundId="salmon-1"
        backgroundVideoId="background"
        cueVideoId="cue"
      />,
    )

    expect(markup).toContain("Couper la musique Pokémon")
    expect(markup).toContain('aria-pressed="false"')
    expect(markup).toContain('data-testid="salmon-background-music-player"')
  })
})
