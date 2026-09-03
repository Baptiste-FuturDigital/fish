export type GameStatus = "lobby" | "running" | "finished"

export type PromptKind = "question" | "duel" | "vote" | "mime" | "action"

export interface TotemView {
  name: string
  fact: string
  teamName: string
  imageUrl: string
}

export interface PlayerView {
  id: string
  name: string
  isHost: boolean
  score: number
  totem: TotemView | null
}

export interface PromptView {
  id: string
  kind: PromptKind
  kicker: string
  title: string
  instruction: string
  emoji: string
  players: string[]
}

export interface GameView {
  id: string
  code: string
  name: string
  status: GameStatus
  currentRound: number
  totalRounds: number
  currentPrompt: PromptView | null
  players: PlayerView[]
  createdAt: string
}

export interface PlayerSession {
  gameCode: string
  playerId: string
  playerToken: string
  hostToken?: string
}

export interface SessionResponse {
  game: GameView
  session: PlayerSession
}

export interface ApiError {
  error: string
}
