import type {
  ChallengeDefinition,
  ChallengeRoundDefinition,
  PublicRoundView,
  RoundScoreResult,
  SubmittedTeamAnswer,
} from "../shared/challenges/types.js"

export function projectRound(
  round: ChallengeRoundDefinition,
  revealed: boolean,
): PublicRoundView {
  const base: PublicRoundView = {
    id: round.id,
    kind: round.kind,
    kicker: round.kicker,
    question: round.question,
    durationSeconds: round.durationSeconds,
    imageUrl: round.imageUrl,
  }
  if (round.kind === "number") {
    base.unit = round.unit
    base.estimateRange = round.estimateRange
  } else {
    base.choices = round.choices
    base.maskImage = round.maskImage
  }
  if (revealed) {
    base.correctAnswer = round.correctAnswer
    base.answerLabel = round.answerLabel
    base.fact = round.fact
    base.maskImage = false
  }
  return base
}

export function scoreRound(
  challenge: ChallengeDefinition,
  roundIndex: number,
  answers: readonly SubmittedTeamAnswer[],
): RoundScoreResult[] {
  const round = challenge.rounds[roundIndex]
  if (!round) throw new Error("Manche introuvable.")

  if (round.kind === "number") {
    const ranked = answers
      .map((entry) => {
        const numericAnswer = entry.answer === null ? Number.NaN : Number(entry.answer)
        const distance = Number.isFinite(numericAnswer) && numericAnswer >= 0
          ? Math.abs(numericAnswer - round.correctAnswer) / round.correctAnswer
          : null
        return { ...entry, distance }
      })
      .sort((left, right) => {
        if (left.distance === null) return right.distance === null ? left.teamId.localeCompare(right.teamId) : 1
        if (right.distance === null) return -1
        return left.distance - right.distance || left.teamId.localeCompare(right.teamId)
      })

    return ranked.map((entry, index) => {
      if (entry.distance === null) {
        return { ...entry, points: 0, isCorrect: false, distance: null }
      }
      const firstSameDistance = ranked.findIndex((candidate) => candidate.distance === entry.distance)
      const points = Math.max(1, challenge.scoring.kind === "ranked-relative"
        ? challenge.scoring.maxPoints - firstSameDistance
        : 0)
      return { ...entry, points, isCorrect: entry.distance === 0, distance: entry.distance }
    })
  }

  const availablePoints = challenge.scoring.kind === "escalating"
    ? challenge.scoring.points[roundIndex] ?? 0
    : challenge.scoring.kind === "exact"
      ? challenge.scoring.points
      : 0
  return answers.map((entry) => {
    const isCorrect = entry.answer === round.correctAnswer
    return {
      ...entry,
      points: isCorrect ? availablePoints : 0,
      isCorrect,
      distance: null,
    }
  })
}
