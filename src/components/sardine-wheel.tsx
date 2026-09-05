import { useEffect, type CSSProperties } from "react"
import { Crown, LoaderCircle, Sparkles } from "lucide-react"

import type { PlayerSession, SardineWheelView } from "@shared/game"
import { Button } from "./ui/button.js"
import { playSardineWheelAudio, primeSardineWheelAudio } from "./sardine-wheel-audio.js"
import {
  SARDINE_FINAL_ROTATION_DEGREES,
  wheelProgress,
  wheelRotation,
} from "./sardine-wheel-timeline.js"

import "./sardine-wheel.css"

const WHEEL_FISH = ["🐟", "🐙", "🦐", "🐡", "🦈", "🐋", "🦑", "🦀"] as const
const CONFETTI = Array.from({ length: 18 }, (_, index) => index)

export interface SardineWheelTiming {
  status: SardineWheelView["status"]
  startedAt: string | null
  durationMs: number
}

type WheelStyle = CSSProperties & {
  "--sardine-wheel-from": string
  "--sardine-wheel-duration": string
  "--sardine-wheel-final": string
}

export function SardineWheelAudio({ wheel, enabled }: { wheel: SardineWheelTiming; enabled: boolean }) {
  useEffect(() => {
    if (!enabled || wheel.status !== "spinning" || !wheel.startedAt) return
    const elapsedMs = Math.max(0, Date.now() - Date.parse(wheel.startedAt))
    return playSardineWheelAudio(elapsedMs)
  }, [enabled, wheel.durationMs, wheel.startedAt, wheel.status])

  return null
}

export function SardineWheelDial({ wheel, label = "Roue des poissons en rotation" }: {
  wheel: SardineWheelTiming
  label?: string
}) {
  const progress = wheel.startedAt
    ? wheelProgress(wheel.startedAt, wheel.durationMs)
    : 0
  const remainingMs = wheel.status === "spinning"
    ? Math.max(0, wheel.durationMs * (1 - progress))
    : 0
  const rotation = wheel.status === "won"
    ? SARDINE_FINAL_ROTATION_DEGREES
    : wheelRotation(progress)
  const style = {
    "--sardine-wheel-from": `${rotation}deg`,
    "--sardine-wheel-duration": `${remainingMs}ms`,
    "--sardine-wheel-final": `${SARDINE_FINAL_ROTATION_DEGREES}deg`,
  } as WheelStyle

  return (
    <div className="sardine-wheel-dial-shell" aria-label={label} role="img">
      <div className="sardine-wheel-pointer" aria-hidden="true">▼</div>
      <div className="sardine-wheel-dial" data-motion={wheel.status} style={style}>
        {WHEEL_FISH.map((fish, index) => (
          <span
            className="sardine-wheel-fish"
            data-sardine={index === 0 ? "true" : "false"}
            style={{ "--fish-index": index } as CSSProperties}
            key={`${fish}-${index}`}
            aria-hidden="true"
          >
            {fish}
          </span>
        ))}
        <span className="sardine-wheel-hub" aria-hidden="true">🔱</span>
      </div>
    </div>
  )
}

interface SardineWheelProps {
  session: PlayerSession
  wheel: SardineWheelView | null
  available: boolean
  winnerImageUrl?: string
  pending: boolean
  onOffer: () => void
  onSpin: () => void
}

export function SardineWheel({
  session,
  wheel,
  available,
  winnerImageUrl,
  pending,
  onOffer,
  onSpin,
}: SardineWheelProps) {
  const isHost = Boolean(session.hostToken)
  const isWinner = wheel?.winnerPlayerId === session.playerId

  if (!wheel) {
    return (
      <section className="sardine-wheel" data-state="ready" aria-labelledby="sardine-wheel-title">
        <div className="sardine-wheel-orb" aria-hidden="true">🔱</div>
        <p className="sardine-wheel-kicker">FAVEUR DU GRAND LARGE</p>
        <h3 id="sardine-wheel-title">Roue de Poséithon</h3>
        <p className="sardine-wheel-copy">
          Le poisson en tête remportera une récompense choisie par les courants divins.
        </p>
        {isHost && available ? (
          <Button className="sardine-wheel-action" size="lg" onClick={onOffer} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            Déchaîner la faveur
          </Button>
        ) : (
          <p className="sardine-wheel-wait" role="status">Poséithon observe le classement…</p>
        )}
      </section>
    )
  }

  if (wheel.status === "offered") {
    return (
      <section className="sardine-wheel" data-state="offered" aria-labelledby="sardine-wheel-title">
        <div className="sardine-wheel-winner">
          {winnerImageUrl ? <img src={winnerImageUrl} alt="" /> : <span aria-hidden="true"><Crown /></span>}
          <div>
            <p className="sardine-wheel-kicker">{isWinner ? "La faveur t'appelle" : "LA FAVEUR EST REMISE"}</p>
            <h3 id="sardine-wheel-title">{wheel.winnerPlayerName}</h3>
          </div>
        </div>
        {isWinner ? (
          <>
            <p className="sardine-wheel-copy">Pose ton nageoire sur le destin et réveille la roue.</p>
            <Button
              className="sardine-wheel-action"
              size="lg"
              onClick={() => {
                primeSardineWheelAudio()
                onSpin()
              }}
              disabled={pending}
            >
              {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
              Déchaîner la roue
            </Button>
          </>
        ) : (
          <p className="sardine-wheel-wait" role="status" aria-live="polite">
            {isHost
              ? `La faveur attend le geste de ${wheel.winnerPlayerName}.`
              : `${wheel.winnerPlayerName} prépare la Roue de Poséithon…`}
          </p>
        )}
      </section>
    )
  }

  const won = wheel.status === "won"
  return (
    <section className="sardine-wheel" data-state={wheel.status} aria-labelledby="sardine-wheel-title">
      <SardineWheelAudio wheel={wheel} enabled={isWinner} />
      {won ? <div className="sardine-wheel-flash" aria-hidden="true" /> : null}
      {won ? (
        <div className="sardine-wheel-confetti" aria-hidden="true">
          {CONFETTI.map((piece) => (
            <i
              style={{ "--confetti-left": `${(piece * 37 + 7) % 100}%` } as CSSProperties}
              key={piece}
            />
          ))}
        </div>
      ) : null}
      <p className="sardine-wheel-kicker">LA ROUE DE POSÉITHON</p>
      <h3 id="sardine-wheel-title">
        {won ? "Sardine légendaire remportée" : "La roue fend les courants…"}
      </h3>
      <SardineWheelDial wheel={wheel} />
      {won ? <div className="sardine-wheel-prize" aria-hidden="true">🐟</div> : null}
      <p className="sardine-wheel-verdict" role="status" aria-live={won ? "assertive" : "polite"}>
        {won
          ? `${wheel.winnerPlayerName} remporte la sardine légendaire !`
          : `Le destin de ${wheel.winnerPlayerName} est en marche.`}
      </p>
    </section>
  )
}
