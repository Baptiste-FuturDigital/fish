import type {
  ChallengeDefinition,
  ChallengeRoundDefinition,
  PlayerRoundScoreResult,
  PublicRoundView,
  RoundScoreResult,
  SubmittedPlayerAnswer,
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
    imageUrl: revealed ? round.revealImageUrl ?? round.imageUrl : round.imageUrl,
  }
  if (round.kind === "number") {
    base.unit = round.unit
    base.estimateRange = round.estimateRange
  } else if (round.kind === "choice") {
    base.choices = round.choices
    base.maskImage = round.maskImage
  } else {
    base.hostClues = round.hostClues
    base.answerLabel = round.answerLabel
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

export function scorePlayerRound(
  challenge: ChallengeDefinition,
  roundIndex: number,
  answers: readonly SubmittedPlayerAnswer[],
): PlayerRoundScoreResult[] {
  const round = challenge.rounds[roundIndex]
  if (!round) throw new Error("Manche introuvable.")
  if (round.kind === "buzzer") {
    return answers.map((entry) => {
      const isCorrect = entry.answer === round.correctAnswer
      return {
        playerId: entry.playerId,
        playerName: entry.playerName,
        teamId: entry.teamId,
        answer: entry.answer,
        points: isCorrect ? entry.awardedPoints ?? 0 : 0,
        isCorrect,
        distance: null,
      }
    })
  }
  const scored = scoreRound(
    challenge,
    roundIndex,
    answers.map((entry) => ({ teamId: entry.playerId, answer: entry.answer })),
  )
  const answersByPlayer = new Map(answers.map((entry) => [entry.playerId, entry]))
  return scored.map((result) => {
    const submitted = answersByPlayer.get(result.teamId)
    if (!submitted) throw new Error("Réponse joueur introuvable.")
    return {
      playerId: submitted.playerId,
      playerName: submitted.playerName,
      teamId: submitted.teamId,
      answer: result.answer,
      points: result.points,
      isCorrect: result.isCorrect,
      distance: result.distance,
    }
  })
}

export function aggregateTeamResults(
  challenge: ChallengeDefinition,
  roundIndex: number,
  playerResults: readonly PlayerRoundScoreResult[],
  participatingTeamIds: readonly string[],
  teamSizes?: ReadonlyMap<string, number>,
): RoundScoreResult[] {
  const round = challenge.rounds[roundIndex]
  if (!round) throw new Error("Manche introuvable.")

  if (round.kind === "number") {
    const closestByTeam = new Map<string, PlayerRoundScoreResult>()
    for (const result of playerResults) {
      if (result.distance === null) continue
      const current = closestByTeam.get(result.teamId)
      if (
        !current ||
        current.distance === null ||
        result.distance < current.distance ||
        (result.distance === current.distance && result.playerId.localeCompare(current.playerId) < 0)
      ) {
        closestByTeam.set(result.teamId, result)
      }
    }
    return scoreRound(
      challenge,
      roundIndex,
      participatingTeamIds.map((teamId) => ({
        teamId,
        answer: closestByTeam.get(teamId)?.answer ?? null,
      })),
    )
  }

  if (challenge.id === "whos-dat-salmon") {
    const largestTeamSize = teamSizes
      ? Math.max(0, ...participatingTeamIds.map((teamId) => teamSizes.get(teamId) ?? 0))
      : 0
    return participatingTeamIds.map((teamId) => {
      const teamPlayers = playerResults.filter((result) => result.teamId === teamId)
      const correctPlayers = teamPlayers.filter((result) => result.isCorrect)
      const rawPoints = correctPlayers.reduce((total, result) => total + result.points, 0)
      const teamSize = teamSizes?.get(teamId) ?? 0
      return {
        teamId,
        answer: correctPlayers[0]?.answer ?? teamPlayers[0]?.answer ?? null,
        points: teamSizes && teamSize > 0 && largestTeamSize > 0
          ? rawPoints * largestTeamSize / teamSize
          : rawPoints,
        isCorrect: correctPlayers.length > 0,
        distance: null,
      }
    })
  }

  return participatingTeamIds.map((teamId) => {
    const best = playerResults
      .filter((result) => result.teamId === teamId)
      .sort((left, right) => right.points - left.points || left.playerId.localeCompare(right.playerId))[0]
    return {
      teamId,
      answer: best?.answer ?? null,
      points: best?.points ?? 0,
      isCorrect: best?.isCorrect ?? false,
      distance: null,
    }
  })
}
