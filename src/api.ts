import type { GameView, SessionResponse } from "@shared/game"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const body = (await response.json()) as unknown
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String(body.error)
        : "Une vague a tout emporté."
    throw new Error(message)
  }
  return body as T
}

export const gameApi = {
  create(name: string, hostName: string) {
    return request<SessionResponse>("/api/games", {
      method: "POST",
      body: JSON.stringify({ name, hostName }),
    })
  },
  join(code: string, name: string) {
    return request<SessionResponse>(`/api/games/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  },
  get(code: string) {
    return request<GameView>(`/api/games/${code}`)
  },
  hostAction(code: string, action: "start" | "next" | "finish", hostToken: string) {
    return request<GameView>(`/api/games/${code}/${action}`, {
      method: "POST",
      body: JSON.stringify({ hostToken }),
    })
  },
}
