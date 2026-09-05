import { useState } from "react"
import { ArrowRight, Flag, LoaderCircle, Trophy, Waves } from "lucide-react"

import type { GameView, PlayerSession } from "@shared/game"
import { PlayerLeaderboard } from "./player-leaderboard.js"
import { PoseithonBonus } from "./poseithon-bonus.js"
import { Button } from "./ui/button.js"

import "./leaderboard-screen.css"

export interface LeaderboardScreenProps {
  game: GameView
  session: PlayerSession
  onAdvance: () => Promise<unknown> | unknown
  onFinish: () => Promise<unknown> | unknown
  onBonus: () => Promise<unknown> | unknown
}

type PendingAction = "advance" | "finish" | "bonus" | null

export function LeaderboardScreen({
  game,
  session,
  onAdvance,
  onFinish,
  onBonus,
}: LeaderboardScreenProps) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)
  const isHost = Boolean(session.hostToken)
  const challengeNumber = game.tournament
    ? game.tournament.challengeIndex + 1
    : Math.max(1, game.currentRound)

  async function run(action: Exclude<PendingAction, null>) {
    setPending(action)
    setError(null)
    try {
      await (action === "advance" ? onAdvance() : action === "finish" ? onFinish() : onBonus())
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
          <p>Chaque poisson remonte sur la grille. La rivalité est ouverte.</p>
        </div>
      </header>

      <PlayerLeaderboard game={game} />

      {game.tournament ? (
        <PoseithonBonus
          isHost={isHost}
          available={game.tournament.bonusAvailable}
          pending={pending === "bonus"}
          bonus={game.tournament.bonus}
          onApply={() => void run("bonus")}
        />
      ) : null}

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
            className="leaderboard-finish-action finish-tournament-button"
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
