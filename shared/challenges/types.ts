export type ChallengeId =
  | "le-juste-poisson"
  | "whos-dat-salmon"
  | "question-pour-un-poisson"
  | "qui-veut-gagner-des-poissons"

export interface ChoiceOption {
  id: string
  label: string
}

interface RoundBase {
  id: string
  kicker: string
  question: string
  durationSeconds: number
  imageUrl?: string
  revealImageUrl?: string
  answerLabel: string
  fact: string
  sourceUrl: string
}

export interface NumericRoundDefinition extends RoundBase {
  kind: "number"
  unit: "kg"
  estimateRange: WeightEstimateRange
  correctAnswer: number
}

export type WeightDisplayUnit = "g" | "kg" | "t"

export interface WeightEstimateRange {
  min: number
  max: number
  step: number
  displayUnit: WeightDisplayUnit
}

export interface ChoiceRoundDefinition extends RoundBase {
  kind: "choice"
  choices: readonly ChoiceOption[]
  correctAnswer: string
  maskImage?: boolean
}

export interface BuzzerRoundDefinition extends RoundBase {
  kind: "buzzer"
  hostClues: readonly string[]
  correctAnswer: string
}

export type ChallengeRoundDefinition =
  | NumericRoundDefinition
  | ChoiceRoundDefinition
  | BuzzerRoundDefinition

export type ScoringRule =
  | { kind: "ranked-relative"; maxPoints: number }
  | { kind: "exact"; points: number }
  | { kind: "escalating"; points: readonly number[] }
  | { kind: "buzzer-countdown"; points: readonly number[] }

export interface ChallengeDefinition {
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
  scoring: ScoringRule
  rounds: readonly ChallengeRoundDefinition[]
}

export interface PublicRoundView {
  id: string
  kind: "number" | "choice" | "buzzer"
  kicker: string
  question: string
  durationSeconds: number
  imageUrl?: string
  unit?: "kg"
  estimateRange?: WeightEstimateRange
  choices?: readonly ChoiceOption[]
  maskImage?: boolean
  hostClues?: readonly string[]
  correctAnswer?: string | number
  answerLabel?: string
  fact?: string
}

export interface SubmittedTeamAnswer {
  teamId: string
  answer: string | null
}

export interface SubmittedPlayerAnswer extends SubmittedTeamAnswer {
  playerId: string
  playerName: string
  awardedPoints?: number
}

export interface RoundScoreResult {
  teamId: string
  answer: string | null
  points: number
  isCorrect: boolean
  distance: number | null
}

export interface PlayerRoundScoreResult extends RoundScoreResult {
  playerId: string
  playerName: string
}
