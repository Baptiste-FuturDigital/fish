import type {
  GameView,
  JoinPlayerInput,
  PlayerIdentityChoice,
  PrizeClaimResult,
  PrizeType,
  SessionResponse,
} from "@shared/game"

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
  create(name: string, hostName: string, prankPlayerName?: string) {
    return request<SessionResponse>("/api/games", {
      method: "POST",
      body: JSON.stringify({ name, hostName, prankPlayerName }),
    })
  },
  identities(code: string) {
    return request<PlayerIdentityChoice[]>(`/api/games/${code}/identities`)
  },
  join(code: string, input: JoinPlayerInput) {
    return request<SessionResponse>(`/api/games/${code}/join`, {
      method: "POST",
      body: JSON.stringify(input),
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
  claimPrize(
    code: string,
    prizeType: PrizeType,
    playerId: string,
    playerToken: string,
    email: string,
  ) {
    return request<PrizeClaimResult>(`/api/games/${code}/prizes/${prizeType}/claim`, {
      method: "POST",
      body: JSON.stringify({ playerId, playerToken, email }),
    })
  },
  renameTeam(code: string, teamId: string, name: string, playerId: string, playerToken: string) {
    return request<GameView>(`/api/games/${code}/teams/${teamId}/name`, {
      method: "POST",
      body: JSON.stringify({ name, playerId, playerToken }),
    })
  },
  kickPlayer(code: string, playerId: string, hostToken: string) {
    return request<GameView>(`/api/games/${code}/players/${playerId}/kick`, {
      method: "POST",
      body: JSON.stringify({ hostToken }),
    })
  },
  submitAnswer(code: string, playerId: string, playerToken: string, answer: string, locked: boolean) {
    return request<GameView>(`/api/games/${code}/answer`, {
      method: "POST",
      body: JSON.stringify({ playerId, playerToken, answer, locked }),
    })
  },
  buzz(code: string, playerId: string, playerToken: string) {
    return request<GameView>(`/api/games/${code}/buzz`, {
      method: "POST",
      body: JSON.stringify({ playerId, playerToken }),
    })
  },
  resolveBuzz(code: string, hostToken: string, correct: boolean) {
    return request<GameView>(`/api/games/${code}/buzz/resolve`, {
      method: "POST",
      body: JSON.stringify({ hostToken, correct }),
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
  skipChallenge(code: string, hostToken: string) {
    return request<GameView>(`/api/games/${code}/skip-challenge`, {
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
