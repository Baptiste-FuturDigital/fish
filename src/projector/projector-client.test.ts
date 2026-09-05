import { describe, expect, it, vi } from "vitest"

describe("TV projector client", () => {
  it("utilise exclusivement le endpoint TV en lecture seule", async () => {
    const { fetchTvGame } = await import("./projector-client.js")
    const payload = { code: "FISH", status: "lobby" }
    const fetcher = vi.fn(async () => new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))

    await expect(fetchTvGame("fish", fetcher)).resolves.toEqual(payload)
    expect(fetcher).toHaveBeenCalledWith("/api/games/FISH/tv", {
      headers: { Accept: "application/json" },
      method: "GET",
    })
  })

  it("remonte le message public du serveur en cas d’erreur", async () => {
    const { fetchTvGame } = await import("./projector-client.js")
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify({ error: "Aquarium introuvable. Vérifie le code." }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    ))

    await expect(fetchTvGame("NOPE", fetcher)).rejects.toThrow("Aquarium introuvable")
  })
})
