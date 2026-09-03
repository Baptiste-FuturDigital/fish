import { describe, expect, it, vi } from "vitest"

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
})
