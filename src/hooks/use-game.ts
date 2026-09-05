import { useCallback, useEffect, useRef, useState } from "react"

import type { DemoSessionResponse, GameView, PlayerSession, SessionResponse } from "@shared/game"
import { gameApi } from "@/api"
import {
  clearCurrentGameSession,
  clearDemoPlayerLaunchSession,
  isDemoPlayerView,
  openDemoPlayerTab,
  readDemoPlayerLaunchSession,
  readGameSession,
  writeDemoPlayerLaunchSession,
  writeHostSession,
} from "./game-session-storage.js"
import { isPlayerSessionEjected, joinPathForGame } from "./player-session-membership.js"

function hasDemoPlayerSession(
  response: SessionResponse | DemoSessionResponse,
): response is DemoSessionResponse {
  return "demoPlayerSession" in response
}

export function useGame() {
  const [session, setSession] = useState<PlayerSession | null>(readGameSession)
  const [demoPlayerSession, setDemoPlayerSession] = useState<PlayerSession | null>(
    readDemoPlayerLaunchSession,
  )
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
      if (isPlayerSessionEjected(session, nextGame)) {
        clearCurrentGameSession()
        window.history.replaceState(
          {},
          "",
          joinPathForGame(window.location.pathname, session.gameCode),
        )
        setSession(null)
        setGame(null)
        setError(null)
        return
      }
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

  const enter = useCallback((response: SessionResponse | DemoSessionResponse) => {
    writeHostSession(response.session)
    if (hasDemoPlayerSession(response)) {
      writeDemoPlayerLaunchSession(response.demoPlayerSession)
      setDemoPlayerSession(response.demoPlayerSession)
    } else {
      clearDemoPlayerLaunchSession()
      setDemoPlayerSession(null)
    }
    setSession(response.session)
    setGame(response.game)
    setError(null)
    setLoading(false)
  }, [])

  const leave = useCallback(() => {
    clearCurrentGameSession()
    if (!isDemoPlayerView()) {
      clearDemoPlayerLaunchSession()
      setDemoPlayerSession(null)
    }
    setSession(null)
    setGame(null)
    setError(null)
    window.history.replaceState({}, "", window.location.pathname)
  }, [])

  const openDemoPlayerView = useCallback(() => {
    if (!demoPlayerSession) throw new Error("Vue joueur de démonstration indisponible.")
    if (!openDemoPlayerTab(demoPlayerSession)) {
      throw new Error("Le navigateur a bloqué le nouvel onglet joueur.")
    }
  }, [demoPlayerSession])

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

  const kickPlayer = useCallback(async (playerId: string) => {
    if (!session?.hostToken) throw new Error("Tu n'es pas le capitaine.")
    const nextGame = await gameApi.kickPlayer(
      session.gameCode,
      playerId,
      session.hostToken,
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

  const useFiftyFifty = useCallback(async () => {
    if (!session) throw new Error("Session introuvable.")
    const nextGame = await gameApi.useFiftyFifty(
      session.gameCode,
      session.playerId,
      session.playerToken,
    )
    setGame(nextGame)
    return nextGame
  }, [session])

  const buzz = useCallback(async () => {
    if (!session) throw new Error("Session introuvable.")
    const nextGame = await gameApi.buzz(session.gameCode, session.playerId, session.playerToken)
    setGame(nextGame)
    return nextGame
  }, [session])

  const resolveBuzz = useCallback(async (correct: boolean) => {
    if (!session?.hostToken) throw new Error("Tu n'es pas le capitaine.")
    const nextGame = await gameApi.resolveBuzz(session.gameCode, session.hostToken, correct)
    setGame(nextGame)
    return nextGame
  }, [session])

  const applyBonus = useCallback(async () => {
    if (!session?.hostToken) throw new Error("Tu n'es pas le capitaine.")
    const nextGame = await gameApi.applyBonus(session.gameCode, session.hostToken)
    setGame(nextGame)
    return nextGame
  }, [session])

  const skipChallenge = useCallback(async () => {
    if (!session?.hostToken) throw new Error("Tu n'es pas le capitaine.")
    const nextGame = await gameApi.skipChallenge(session.gameCode, session.hostToken)
    setGame(nextGame)
    return nextGame
  }, [session])

  return {
    session,
    game,
    loading,
    error,
    enter,
    leave,
    refresh,
    hostAction,
    claimTotem,
    renameTeam,
    kickPlayer,
    submitAnswer,
    useFiftyFifty,
    buzz,
    resolveBuzz,
    applyBonus,
    skipChallenge,
    canOpenDemoPlayer: Boolean(demoPlayerSession),
    openDemoPlayerView,
  }
}
