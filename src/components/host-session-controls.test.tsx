import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { HostSessionControls } from "./host-session-controls.js"

describe("HostSessionControls", () => {
  it("permet de revenir à l’accueil depuis le lobby sans terminer", async () => {
    const { runHostSessionAction } = await import("./host-session-action.js")
    const calls: string[] = []

    await runHostSessionAction({
      status: "lobby",
      onFinish: vi.fn(async () => calls.push("finish")),
      onLeave: vi.fn(() => calls.push("leave")),
    })

    expect(calls).toEqual(["leave"])
  })

  it("termine le tournoi avant de revenir créer une partie", async () => {
    const { runHostSessionAction } = await import("./host-session-action.js")
    const calls: string[] = []

    await runHostSessionAction({
      status: "running",
      onFinish: vi.fn(async () => calls.push("finish")),
      onLeave: vi.fn(() => calls.push("leave")),
    })

    expect(calls).toEqual(["finish", "leave"])
  })

  it("affiche le raccourci vers l'épreuve suivante uniquement dans une démo éligible", () => {
    const eligibleMarkup = renderToStaticMarkup(
      <HostSessionControls
        status="running"
        isDemo
        canSkipChallenge
        onFinish={vi.fn(async () => undefined)}
        onLeave={vi.fn()}
        onSkipChallenge={vi.fn(async () => undefined)}
      />,
    )
    const realGameMarkup = renderToStaticMarkup(
      <HostSessionControls
        status="running"
        isDemo={false}
        canSkipChallenge
        onFinish={vi.fn(async () => undefined)}
        onLeave={vi.fn()}
        onSkipChallenge={vi.fn(async () => undefined)}
      />,
    )

    expect(eligibleMarkup).toContain("Épreuve suivante")
    expect(realGameMarkup).not.toContain("Épreuve suivante")
  })
})
