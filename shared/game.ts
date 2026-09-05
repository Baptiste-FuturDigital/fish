import type {
  ChallengeId,
  PlayerRoundScoreResult,
  PublicRoundView,
  RoundScoreResult,
} from "./challenges/types.js"

export type GameStatus = "lobby" | "running" | "finished"

export type TournamentPhase = "challenge-intro" | "answering" | "reveal" | "leaderboard"

export type PromptKind = "question" | "duel" | "vote" | "mime" | "action"

export interface TotemView {
  name: string
  fact: string
  teamName: string
  imageUrl: string
}

export interface TeamView {
  id: string
  name: string
  score: number
  memberIds: string[]
}

export interface TeamAnswerView {
  teamId: string
  answer: string | null
  locked: boolean
}

export interface PlayerAnswerView extends TeamAnswerView {
  playerId: string
  playerName: string
}

export interface PoseithonBonusView {
  challengeIndex: number
  challengeId: ChallengeId
  teamId: string
  teamName: string
  points: number
  awardedAt: string
}

export interface TeamFiftyFiftyJokerView {
  teamId: string
  roundIndex: number
  keptChoiceIds: string[]
  usedAt: string
}

export interface QuestionBuzzView {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  points: number
}

export interface TournamentChallengeView {
  id: ChallengeId
  title: string
  shortTitle: string
  emoji: string
  description: string
  rules: readonly string[]
  introMusicYoutubeId: string
  introMusicStartSeconds?: number
  introMusicEndSeconds?: number
  answeringMusicYoutubeId?: string
  timerEndSoundYoutubeId?: string
  introImageUrl?: string
  presenterImageUrl?: string
  confirmationLabel?: string
}

export interface TournamentView {
  challengeIndex: number
  challengeCount: number
  roundIndex: number
  roundCount: number
  phase: TournamentPhase
  endsAt: string | null
  challenge: TournamentChallengeView
  round: PublicRoundView
  answers: PlayerAnswerView[]
  results: PlayerRoundScoreResult[]
  teamResults: RoundScoreResult[]
  bonus: PoseithonBonusView | null
  bonusAvailable: boolean
  fiftyFiftyJokers: TeamFiftyFiftyJokerView[]
  buzz: QuestionBuzzView | null
  blockedTeamId: string | null
  pausedRemainingMs: number | null
}

export interface PlayerView {
  id: string
  name: string
  identityId?: string
  imageUrl?: string
  animalName?: string
  animalFact?: string
  isHost: boolean
  score: number
  teamId: string | null
  totem: TotemView | null
}

export interface PlayerIdentityChoice {
  id: string
  displayName: string
  imageUrl: string
  anonymous: boolean
  animalName: string
  animalFact: string
  available: boolean
}

export interface JoinPlayerInput {
  identityId: string
  nickname?: string
}

export type PrizeType = "best-player" | "worst-player" | "winning-team"

export interface PrizeClaimRequest {
  playerId: string
  playerToken: string
  email: string
}

export interface PrizeClaimResult {
  prizeType: PrizeType
  status: "sent"
  alreadySent: boolean
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
  isDemo: boolean
  status: GameStatus
  currentRound: number
  totalRounds: number
  currentPrompt: PromptView | null
  players: PlayerView[]
  teams: TeamView[]
  tournament: TournamentView | null
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
