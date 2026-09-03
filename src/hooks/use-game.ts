import { useCallback, useEffect, useRef, useState } from "react"

import type { GameView, PlayerSession, SessionResponse } from "@shared/game"
import { gameApi } from "@/api"

const STORAGE_KEY = "fish-tournament-session"

function readSession(): PlayerSession | null {
  try {
    const query = new URLSearchParams(window.location.search)
    if (query.get("salmon-demo") === "1") return null
    if (query.get("demo") === "1") {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as PlayerSession) : null
  } catch {
    return null
  }
}

export function useGame() {
  const [session, setSession] = useState<PlayerSession | null>(readSession)
  const [game, setGame] = useState<GameView | null>(null)
  const [loading, setLoading] = useState(Boolean(session))
  const [error, setError] = useState<string | null>(null)
  const refreshInFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (!session) return
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const nextGame = await gameApi.get(session.gameCode)
      setGame(nextGame)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Aquarium inaccessible.")
    } finally {
      refreshInFlight.current = false
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    void refresh()
    const interval = window.setInterval(() => void refresh(), game?.status === "running" ? 1_000 : 1_500)
    return () => window.clearInterval(interval)
  }, [game?.status, refresh, session])

  const enter = useCallback((response: SessionResponse) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.session))
    setSession(response.session)
    setGame(response.game)
    setError(null)
    setLoading(false)
  }, [])

  const leave = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setGame(null)
    setError(null)
    window.history.replaceState({}, "", window.location.pathname)
  }, [])

  const hostAction = useCallback(
    async (action: "start" | "advance" | "finish") => {
      if (!session?.hostToken) throw new Error("Tu n'es pas le capitaine.")
      const nextGame = await gameApi.hostAction(
        session.gameCode,
        action,
        session.hostToken,
      )
      setGame(nextGame)
      return nextGame
    },
    [session],
  )

  const claimTotem = useCallback(async () => {
    if (!session) throw new Error("Session introuvable.")
    const nextGame = await gameApi.claimTotem(
      session.gameCode,
      session.playerId,
      session.playerToken,
    )
    setGame(nextGame)
    return nextGame
  }, [session])

  const renameTeam = useCallback(async (teamId: string, name: string) => {
    if (!session) throw new Error("Session introuvable.")
    const nextGame = await gameApi.renameTeam(
      session.gameCode,
      teamId,
      name,
      session.playerId,
      session.playerToken,
    )
    setGame(nextGame)
    return nextGame
  }, [session])

  const submitAnswer = useCallback(async (answer: string, locked: boolean) => {
    if (!session) throw new Error("Session introuvable.")
    const nextGame = await gameApi.submitAnswer(
      session.gameCode,
      session.playerId,
      session.playerToken,
      answer,
      locked,
    )
    setGame(nextGame)
    return nextGame
  }, [session])

  const applyBonus = useCallback(async () => {
    if (!session?.hostToken) throw new Error("Tu n'es pas le capitaine.")
    const nextGame = await gameApi.applyBonus(session.gameCode, session.hostToken)
    setGame(nextGame)
    return nextGame
  }, [session])

  return { session, game, loading, error, enter, leave, refresh, hostAction, claimTotem, renameTeam, submitAnswer, applyBonus }
}
