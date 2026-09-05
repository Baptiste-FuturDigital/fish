import type { GameView, PlayerSession } from "@shared/game"

export function isPlayerSessionEjected(session: PlayerSession, game: GameView) {
  return !session.hostToken && !game.players.some((player) => player.id === session.playerId)
}

export function joinPathForGame(pathname: string, gameCode: string) {
  const query = new URLSearchParams({ code: gameCode.trim().toUpperCase() })
  return `${pathname}?${query.toString()}`
}
