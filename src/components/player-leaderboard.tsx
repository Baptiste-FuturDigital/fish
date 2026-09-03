import type { CSSProperties } from "react"
import { Crown, Gauge, Medal, Waves } from "lucide-react"

import type { GameView, PlayerView } from "@shared/game"
import { AnimatedScore } from "./animated-score.js"

import "./player-leaderboard.css"

export interface RankedPlayer {
  player: PlayerView
  rank: number
}

export function rankPlayerLeaderboard(players: readonly PlayerView[]): RankedPlayer[] {
  return players
    .filter((player) => !player.isHost)
    .slice()
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.name.localeCompare(right.name, "fr") ||
        left.id.localeCompare(right.id),
    )
    .map((player, index) => ({ player, rank: index + 1 }))
}

type RankingStyle = CSSProperties & {
  "--player-rank-delay": string
  "--player-team-color": string
}

const TEAM_COLORS = [
  "oklch(0.74 0.19 47)",
  "oklch(0.77 0.16 185)",
  "oklch(0.75 0.18 312)",
  "oklch(0.84 0.17 103)",
] as const

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "🐟"
}

function RankMarker({ rank }: { rank: number }) {
  if (rank === 1) return <Crown aria-hidden="true" />
  if (rank <= 3) return <Medal aria-hidden="true" />
  return <span>{rank}</span>
}

export function PlayerLeaderboard({ game }: { game: GameView }) {
  const ranking = rankPlayerLeaderboard(game.players)
  const teamNames = new Map(game.teams.map((team) => [team.id, team.name]))
  const teamColors = new Map(
    game.teams.map((team, index) => [team.id, TEAM_COLORS[index % TEAM_COLORS.length]]),
  )

  return (
    <section className="player-leaderboard" aria-labelledby="player-leaderboard-title">
      <header className="player-leaderboard__header">
        <div className="player-leaderboard__flag" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p><Waves aria-hidden="true" /> Classement individuel</p>
        <h2 id="player-leaderboard-title">La grille des poissons</h2>
        <div className="player-leaderboard__meta">
          <span><Gauge aria-hidden="true" /> La course aux points</span>
          <strong>{ranking.length} poissons</strong>
        </div>
      </header>

      {ranking.length > 0 ? (
        <ol
          className="player-leaderboard__list"
          aria-label="Classement individuel des joueurs"
        >
          {ranking.map(({ player, rank }, index) => {
            const teamName = player.teamId
              ? teamNames.get(player.teamId) ?? "Banc inconnu"
              : "Sans banc"
            const teamColor = player.teamId
              ? teamColors.get(player.teamId) ?? TEAM_COLORS[0]
              : "oklch(0.68 0.03 220)"

            return (
              <li
                className="player-leaderboard__row"
                data-rank={rank}
                key={player.id}
                style={{
                  "--player-rank-delay": `${Math.min(index, 14) * 65}ms`,
                  "--player-team-color": teamColor,
                } as RankingStyle}
              >
                <div className="player-leaderboard__rank" aria-label={`Rang ${rank}`}>
                  <RankMarker rank={rank} />
                </div>

                <div className="player-leaderboard__avatar">
                  {player.totem ? (
                    <img
                      src={player.totem.imageUrl}
                      alt={`${player.name} — ${player.totem.name}`}
                    />
                  ) : (
                    <span aria-hidden="true">{initials(player.name)}</span>
                  )}
                </div>

                <div className="player-leaderboard__identity">
                  <strong>{player.name}</strong>
                  <span>
                    <i aria-hidden="true" />
                    {teamName}
                  </span>
                </div>

                <div className="player-leaderboard__score">
                  <AnimatedScore points={player.score} />
                  <small>PTS</small>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="player-leaderboard__empty" role="status">
          <span aria-hidden="true">🐟</span>
          <strong>Aucun poisson classé</strong>
          <p>La grille se remplira après les premières réponses.</p>
        </div>
      )}
    </section>
  )
}
