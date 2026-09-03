import { useEffect, useState } from "react"

import type { GameView } from "@shared/game"
import { FinalScoreboard } from "./final-scoreboard.js"

import "./final-reveal.css"

const SUSPENSE_DURATION_MS = 7_000
const SUSPENSE_VIDEO_ID = "wKw0pvc1HiE"
const AMBIENT_EVENT = "fish:set-ambient-suspended"

const suspensePlayerSource = (() => {
  const parameters = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    disablekb: "1",
    end: "7",
    fs: "0",
    modestbranding: "1",
    mute: "0",
    playsinline: "1",
    rel: "0",
    start: "0",
  })

  return `https://www.youtube-nocookie.com/embed/${SUSPENSE_VIDEO_ID}?${parameters.toString()}`
})()

interface FinalRevealTransitionOptions {
  audioEnabled: boolean
  onReveal: () => void
  target?: EventTarget
}

export function beginFinalRevealTransition({
  audioEnabled,
  onReveal,
  target = window,
}: FinalRevealTransitionOptions) {
  let active = true
  let ambientSuspended = false

  const restoreAmbient = () => {
    if (!ambientSuspended) return
    ambientSuspended = false
    target.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: false }))
  }

  if (audioEnabled) {
    ambientSuspended = true
    target.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: true }))
  }

  const revealTimer = setTimeout(() => {
    if (!active) return
    active = false
    restoreAmbient()
    onReveal()
  }, SUSPENSE_DURATION_MS)

  return () => {
    active = false
    clearTimeout(revealTimer)
    restoreAmbient()
  }
}

export function FinalReveal({
  game,
  onLeave,
  audioEnabled = false,
}: {
  game: GameView
  onLeave: () => void
  audioEnabled?: boolean
}) {
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    return beginFinalRevealTransition({
      audioEnabled,
      onReveal: () => setIsRevealed(true),
    })
  }, [audioEnabled])

  if (isRevealed) {
    return <FinalScoreboard game={game} onLeave={onLeave} />
  }

  return (
    <section
      className="final-suspense"
      data-testid="final-suspense"
      aria-live="polite"
      aria-label="Le verdict final arrive"
    >
      {audioEnabled ? (
        <iframe
          className="final-suspense-player"
          data-testid="final-suspense-player"
          src={suspensePlayerSource}
          title="Musique du suspense final"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : null}

      <div className="final-suspense-depth" aria-hidden="true" />
      <div className="final-suspense-sonar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="final-suspense-copy">
        <span className="final-suspense-trident" aria-hidden="true">🔱</span>
        <p>Silence dans l’aquarium</p>
        <h1>Poséithon délibère…</h1>
        <div className="final-suspense-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </section>
  )
}
