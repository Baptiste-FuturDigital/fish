import { afterEach, describe, expect, it, vi } from "vitest"

import { gameApi } from "./api.js"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("gameApi wheel and demo commands", () => {
  it.each([
    ["skipRound", ["FISH", "host-token"], "/api/games/FISH/skip-round", { hostToken: "host-token" }],
    ["offerSardineWheel", ["FISH", "host-token"], "/api/games/FISH/sardine-wheel/offer", { hostToken: "host-token" }],
    ["spinSardineWheel", ["FISH", "p1", "player-token"], "/api/games/FISH/sardine-wheel/spin", { playerId: "p1", playerToken: "player-token" }],
  ] as const)("envoie %s au endpoint dédié", async (method, args, path, body) => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ code: "FISH" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
    vi.stubGlobal("fetch", fetcher)

    await Reflect.apply(gameApi[method], gameApi, args)

    expect(fetcher).toHaveBeenCalledWith(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
  })
})
