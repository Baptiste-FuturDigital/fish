import { useState, type CSSProperties } from "react"
import { ArrowRight, Crown, Flag, LoaderCircle, Trophy, Waves } from "lucide-react"

import type { GameView, PlayerSession } from "@shared/game"
import { AnimatedScore } from "@/components/animated-score"
import { toDisplayPoints } from "@/components/score-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import "./leaderboard-screen.css"

export interface LeaderboardScreenProps {
  game: GameView
  session: PlayerSession
  onAdvance: () => Promise<unknown> | unknown
  onFinish: () => Promise<unknown> | unknown
}

type PendingAction = "advance" | "finish" | null

export function LeaderboardScreen({
  game,
  session,
  onAdvance,
  onFinish,
}: LeaderboardScreenProps) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)
  const isHost = Boolean(session.hostToken)
  const challengeNumber = game.tournament
    ? game.tournament.challengeIndex + 1
    : Math.max(1, game.currentRound)
  const ranking = [...game.teams].sort(
    (left, right) => right.score - left.score || left.name.localeCompare(right.name, "fr"),
  )
  const maxScore = Math.max(1, ...ranking.map((team) => team.score))
  const displayedMaxScore = toDisplayPoints(maxScore)

  async function run(action: Exclude<PendingAction, null>) {
    setPending(action)
    setError(null)
    try {
      await (action === "advance" ? onAdvance() : onFinish())
    } catch {
      setError("La commande s’est perdue dans les profondeurs. Réessaie.")
    } finally {
      setPending(null)
    }
  }

  return (
    <section className="leaderboard-screen" aria-labelledby="leaderboard-title">
      <div className="leaderboard-bubbles" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
      </div>

      <header className="leaderboard-hero">
        <div className="leaderboard-trophy" aria-hidden="true">
          <Trophy />
          <span>★</span>
        </div>
        <div>
          <p className="leaderboard-kicker"><Waves /> Point de marée</p>
          <h2 id="leaderboard-title">
            Classement après <span>l'épreuve {challengeNumber}</span>
          </h2>
          <p>Les bancs remontent à la surface. Voici l’état des profondeurs.</p>
        </div>
      </header>

      <ol className="leaderboard-list" aria-label="Classement des bancs">
        {ranking.map((team, index) => {
          const rank = index + 1
          const members = team.memberIds
            .map((memberId) => game.players.find((player) => player.id === memberId))
            .filter((player) => player !== undefined)
          const fill = `${Math.max(0, (team.score / maxScore) * 100)}%`

          return (
            <li className="leaderboard-row" data-rank={rank} key={team.id}>
              <div className="leaderboard-rank" aria-label={`Rang ${rank}`}>
                {rank === 1 ? <Crown aria-hidden="true" /> : rank}
              </div>

              <div className="leaderboard-team">
                <div className="leaderboard-team-line">
                  <div className="leaderboard-avatars" aria-label={`Membres de ${team.name}`}>
                    {members.map((player) => (
                      <Avatar className="leaderboard-avatar" size="lg" key={player.id} title={player.name}>
                        {player.totem ? (
                          <AvatarImage src={player.totem.imageUrl} alt={`${player.name} — ${player.totem.name}`} />
                        ) : null}
                        <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <strong className="leaderboard-team-name">{team.name}</strong>
                  <Badge className="leaderboard-score" variant={rank === 1 ? "default" : "secondary"}>
                    <AnimatedScore points={team.score} /> pts
                  </Badge>
                </div>

                <div
                  className="leaderboard-bar"
                  role="progressbar"
                  aria-label={`Score de ${team.name}`}
                  aria-valuemin={0}
                  aria-valuemax={displayedMaxScore}
                  aria-valuenow={toDisplayPoints(team.score)}
                >
                  <span style={{ "--leaderboard-fill": fill } as CSSProperties} />
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {error ? <p className="leaderboard-error" role="alert">{error}</p> : null}

      {isHost ? (
        <div className="leaderboard-actions" aria-label="Commandes du maître du jeu">
          <Button
            className="leaderboard-primary-action"
            size="lg"
            onClick={() => void run("advance")}
            disabled={pending !== null}
          >
            {pending === "advance" ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
            Découvrir l'épreuve suivante
          </Button>
          <Button
            className="leaderboard-finish-action"
            size="lg"
            variant="outline"
            onClick={() => void run("finish")}
            disabled={pending !== null}
          >
            {pending === "finish" ? <LoaderCircle className="animate-spin" /> : <Flag />}
            Terminer le tournoi
          </Button>
        </div>
      ) : (
        <div className="leaderboard-waiting" role="status" aria-live="polite">
          <span aria-hidden="true">🫧</span>
          <div>
            <strong>Reste dans le banc</strong>
            <p>Le maître du jeu prépare la prochaine épreuve…</p>
          </div>
        </div>
      )}
    </section>
  )
}
