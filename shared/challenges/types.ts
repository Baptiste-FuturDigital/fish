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
  answerLabel: string
  fact: string
  sourceUrl: string
}

export interface NumericRoundDefinition extends RoundBase {
  kind: "number"
  unit: "kg"
  correctAnswer: number
}

export interface ChoiceRoundDefinition extends RoundBase {
  kind: "choice"
  choices: readonly ChoiceOption[]
  correctAnswer: string
  maskImage?: boolean
}

export type ChallengeRoundDefinition =
  | NumericRoundDefinition
  | ChoiceRoundDefinition

export type ScoringRule =
  | { kind: "ranked-relative"; maxPoints: number }
  | { kind: "exact"; points: number }
  | { kind: "escalating"; points: readonly number[] }

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
  presenterImageUrl?: string
  confirmationLabel?: string
  scoring: ScoringRule
  rounds: readonly ChallengeRoundDefinition[]
}

export interface PublicRoundView {
  id: string
  kind: "number" | "choice"
  kicker: string
  question: string
  durationSeconds: number
  imageUrl?: string
  unit?: "kg"
  choices?: readonly ChoiceOption[]
  maskImage?: boolean
  correctAnswer?: string | number
  answerLabel?: string
  fact?: string
}

export interface SubmittedTeamAnswer {
  teamId: string
  answer: string | null
}

export interface RoundScoreResult {
  teamId: string
  answer: string | null
  points: number
  isCorrect: boolean
  distance: number | null
}
