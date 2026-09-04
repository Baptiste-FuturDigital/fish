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
  demo() {
    return request<SessionResponse>("/api/demo", { method: "POST" })
  },
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
  claimTotem(code: string, playerId: string, playerToken: string) {
    return request<GameView>(`/api/games/${code}/totem`, {
      method: "POST",
      body: JSON.stringify({ playerId, playerToken }),
    })
  },
  renameTeam(code: string, teamId: string, name: string, playerId: string, playerToken: string) {
    return request<GameView>(`/api/games/${code}/teams/${teamId}/name`, {
      method: "POST",
      body: JSON.stringify({ name, playerId, playerToken }),
    })
  },
  submitAnswer(code: string, playerId: string, playerToken: string, answer: string, locked: boolean) {
    return request<GameView>(`/api/games/${code}/answer`, {
      method: "POST",
      body: JSON.stringify({ playerId, playerToken, answer, locked }),
    })
  },
  useFiftyFifty(code: string, playerId: string, playerToken: string) {
    return request<GameView>(`/api/games/${code}/jokers/fifty-fifty`, {
      method: "POST",
      body: JSON.stringify({ playerId, playerToken }),
    })
  },
  hostAction(code: string, action: "start" | "advance" | "finish", hostToken: string) {
    return request<GameView>(`/api/games/${code}/${action}`, {
      method: "POST",
      body: JSON.stringify({ hostToken }),
    })
  },
  applyBonus(code: string, hostToken: string) {
    return request<GameView>(`/api/games/${code}/bonus`, {
      method: "POST",
      body: JSON.stringify({ hostToken }),
    })
  },
}
