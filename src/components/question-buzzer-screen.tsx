import { useEffect, useMemo, useRef, useState } from "react"
import { Check, LoaderCircle, LockKeyhole, X } from "lucide-react"
import { toast } from "sonner"

import type { GameView, PlayerSession, TournamentView } from "@shared/game"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function remainingSeconds(endsAt: string | null, pausedRemainingMs: number | null) {
  if (!endsAt) return Math.ceil((pausedRemainingMs ?? 0) / 1_000)
  return Math.max(0, Math.ceil((Date.parse(endsAt) - Date.now()) / 1_000))
}

function playTone(frequency: number, duration = 0.08) {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.08, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + duration)
  oscillator.addEventListener("ended", () => void context.close(), { once: true })
}

function useHostBuzzerSound(enabled: boolean, tournament: TournamentView) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(tournament.endsAt, tournament.pausedRemainingMs))
  const previousSecond = useRef(seconds)
  const previousBuzz = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    window.dispatchEvent(new CustomEvent("fish:set-ambient-suspended", { detail: true }))
    return () => {
      window.dispatchEvent(new CustomEvent("fish:set-ambient-suspended", { detail: false }))
    }
  }, [enabled])

  useEffect(() => {
    setSeconds(remainingSeconds(tournament.endsAt, tournament.pausedRemainingMs))
    if (!tournament.endsAt) return
    const interval = window.setInterval(() => {
      setSeconds(remainingSeconds(tournament.endsAt, tournament.pausedRemainingMs))
    }, 200)
    return () => window.clearInterval(interval)
  }, [tournament.endsAt, tournament.pausedRemainingMs])

  useEffect(() => {
    if (enabled && tournament.endsAt && seconds !== previousSecond.current && seconds > 0) {
      playTone(seconds <= 10 ? 760 : 480, seconds <= 10 ? 0.12 : 0.05)
    }
    previousSecond.current = seconds
  }, [enabled, seconds, tournament.endsAt])

  useEffect(() => {
    if (enabled && tournament.buzz && tournament.buzz.playerId !== previousBuzz.current) {
      playTone(980, 0.32)
    }
    previousBuzz.current = tournament.buzz?.playerId ?? null
  }, [enabled, tournament.buzz])

  return seconds
}

export function QuestionBuzzerScreen({
  game,
  session,
  isHost,
  onBuzz,
  onResolve,
}: {
  game: GameView
  session: PlayerSession
  isHost: boolean
  onBuzz: () => Promise<GameView>
  onResolve: (correct: boolean) => Promise<GameView>
}) {
  const tournament = game.tournament!
  const [busy, setBusy] = useState<"buzz" | "correct" | "wrong" | null>(null)
  const seconds = useHostBuzzerSound(isHost, tournament)
  const currentPlayer = game.players.find((player) => player.id === session.playerId)
  const playerTeamId = currentPlayer?.teamId ?? null
  const teamImages = useMemo(() => new Map(game.teams.map((team) => {
    const member = team.memberIds
      .map((id) => game.players.find((player) => player.id === id))
      .find((player) => player?.totem)
    return [team.id, member?.totem?.imageUrl ?? null]
  })), [game.players, game.teams])

  async function buzz() {
    setBusy("buzz")
    try {
      await onBuzz()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Buzzer noyé.")
    } finally {
      setBusy(null)
    }
  }

  async function resolve(correct: boolean) {
    setBusy(correct ? "correct" : "wrong")
    try {
      await onResolve(correct)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Validation perdue.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="question-buzzer-stage" aria-label="Question pour un poisson">
      {isHost ? (
        <div className="host-clue-panel">
          <div className="host-clue-heading">
            <span>🎙️ SCRIPT DE POSÉITHON</span>
            <strong>Réponse : {tournament.round.answerLabel ?? "cachée"}</strong>
          </div>
          <div className="host-clue-list">
            {tournament.round.hostClues?.map((clue, index) => (
              <article key={clue} className={cn("host-clue", seconds <= 40 - index * 10 && "is-current")}>
                <b>{40 - index * 10} pts</b>
                <p>{clue}</p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="buzzer-player-instruction">Écoute Poséithon. Buzze dès que ton banc connaît l’animal.</p>
      )}

      <div className="buzzer-arena">
        {game.teams.map((team) => {
          const isOwn = team.id === playerTeamId
          const isActive = tournament.buzz?.teamId === team.id
          const isBlocked = tournament.blockedTeamId === team.id
          const canBuzz = !isHost && isOwn && !tournament.buzz && !isBlocked && seconds > 0
          return (
            <button
              type="button"
              className={cn("buzzer-team", isOwn && "is-own", isActive && "is-active", isBlocked && "is-blocked")}
              key={team.id}
              disabled={!canBuzz || busy === "buzz"}
              onClick={() => void buzz()}
            >
              {teamImages.get(team.id) ? <img src={teamImages.get(team.id)!} alt="" /> : <span className="buzzer-team-emoji">🐟</span>}
              <span className="buzzer-team-overlay" />
              <strong>{team.name}</strong>
              <small>
                {isActive ? `${tournament.buzz?.playerName} a buzzé !` : isBlocked ? "Banc temporairement bloqué" : isOwn ? "APPUIE POUR BUZZER" : `${team.memberIds.length} poissons`}
              </small>
              {isBlocked ? <LockKeyhole aria-hidden="true" /> : null}
            </button>
          )
        })}
        <div className={cn("buzzer-clock", tournament.buzz && "is-paused")}>
          <span>{tournament.buzz ? "PAUSE" : "CHRONO"}</span>
          <strong>{seconds}</strong>
          <small>{tournament.buzz ? `${tournament.buzz.points * 10} points en jeu` : "secondes"}</small>
        </div>
      </div>

      {isHost && tournament.buzz ? (
        <div className="buzz-resolution">
          <p><strong>{tournament.buzz.playerName}</strong> répond pour <strong>{tournament.buzz.teamName}</strong></p>
          <div>
            <Button onClick={() => void resolve(true)} disabled={Boolean(busy)}>
              {busy === "correct" ? <LoaderCircle className="animate-spin" /> : <Check />} Bonne réponse
            </Button>
            <Button variant="destructive" onClick={() => void resolve(false)} disabled={Boolean(busy)}>
              {busy === "wrong" ? <LoaderCircle className="animate-spin" /> : <X />} Mauvaise réponse
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
