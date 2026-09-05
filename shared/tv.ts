import type {
  GameStatus,
  GameView,
  TournamentView,
} from "./game.js"

export interface TvTeamView {
  id: string
  name: string
  score: number
  memberCount: number
}

export interface TvPlayerView {
  name: string
  score: number
  teamId: string | null
  imageUrl: string
}

export interface TvAnswerProgressView {
  teamId: string
  submittedCount: number
  lockedCount: number
}

export interface TvBuzzView {
  teamId: string
  teamName: string
  points: number
}

export interface TvPlayerResultView {
  playerName: string
  teamId: string
  answer: string | null
  points: number
  isCorrect: boolean
  distance: number | null
}

export type TvTournamentView = Omit<TournamentView, "answers" | "results" | "buzz"> & {
  answerProgress: TvAnswerProgressView[]
  results: TvPlayerResultView[]
  buzz: TvBuzzView | null
}

export interface TvGameView {
  code: string
  name: string
  isDemo: boolean
  status: GameStatus
  currentRound: number
  totalRounds: number
  players: TvPlayerView[]
  teams: TvTeamView[]
  tournament: TvTournamentView | null
  createdAt: string
}

export function toTvGameView(game: GameView): TvGameView {
  const players = game.players.map((player) => ({
    name: player.name,
    score: player.score,
    teamId: player.teamId,
    imageUrl: player.imageUrl ?? player.totem?.imageUrl ?? "/players/anonyme-poisson-clown.png",
  }))
  const teams = game.teams.map((team) => ({
    id: team.id,
    name: team.name,
    score: team.score,
    memberCount: team.memberIds.length,
  }))

  if (!game.tournament) {
    return {
      code: game.code,
      name: game.name,
      isDemo: game.isDemo,
      status: game.status,
      currentRound: game.currentRound,
      totalRounds: game.totalRounds,
      players,
      teams,
      tournament: null,
      createdAt: game.createdAt,
    }
  }

  const { answers, results: playerResults, buzz, ...publicTournament } = game.tournament
  const { hostClues: _hostClues, ...publicRound } = publicTournament.round
  const answerProgress = teams.map((team) => {
    const teamAnswers = answers.filter((answer) => answer.teamId === team.id)
    return {
      teamId: team.id,
      submittedCount: teamAnswers.length,
      lockedCount: teamAnswers.filter((answer) => answer.locked).length,
    }
  })

  return {
    code: game.code,
    name: game.name,
    isDemo: game.isDemo,
    status: game.status,
    currentRound: game.currentRound,
    totalRounds: game.totalRounds,
    players,
    teams,
    tournament: {
      ...publicTournament,
      round: publicRound,
      answerProgress,
      results: publicTournament.phase === "reveal" || publicTournament.phase === "leaderboard"
        ? playerResults.map((result) => ({
            playerName: result.playerName,
            teamId: result.teamId,
            answer: result.answer,
            points: result.points,
            isCorrect: result.isCorrect,
            distance: result.distance,
          }))
        : [],
      buzz: buzz
        ? {
            teamId: buzz.teamId,
            teamName: buzz.teamName,
            points: buzz.points,
          }
        : null,
    },
    createdAt: game.createdAt,
  }
}
