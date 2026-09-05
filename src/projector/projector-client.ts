import type { TvGameView } from "@shared/tv"

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export async function fetchTvGame(
  code: string,
  fetcher: Fetcher = fetch,
): Promise<TvGameView> {
  const normalizedCode = code.trim().toUpperCase()
  const response = await fetcher(`/api/games/${encodeURIComponent(normalizedCode)}/tv`, {
    headers: { Accept: "application/json" },
    method: "GET",
  })
  const body = await response.json() as unknown

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body
      ? String(body.error)
      : "Écran TV déconnecté de l’aquarium."
    throw new Error(message)
  }

  return body as TvGameView
}
