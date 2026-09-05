import { useEffect, useState } from "react"

import type { GameView, PlayerSession } from "@shared/game"
import { FinalScoreboard } from "./final-scoreboard.js"

import "./final-reveal.css"

const SUSPENSE_DURATION_MS = 7_000

interface FinalRevealTransitionOptions {
  onReveal: () => void
}

export function beginFinalRevealTransition({
  onReveal,
}: FinalRevealTransitionOptions) {
  let active = true

  const revealTimer = setTimeout(() => {
    if (!active) return
    onReveal()
  }, SUSPENSE_DURATION_MS)

  return () => {
    active = false
    clearTimeout(revealTimer)
  }
}

export function FinalReveal({
  game,
  session = null,
  onLeave,
}: {
  game: GameView
  session?: PlayerSession | null
  onLeave: () => void
}) {
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    return beginFinalRevealTransition({
      onReveal: () => setIsRevealed(true),
    })
  }, [])

  return (
    <>
      {isRevealed ? (
        <FinalScoreboard game={game} session={session} onLeave={onLeave} />
      ) : (
        <section
          className="final-suspense"
          data-testid="final-suspense"
          aria-live="polite"
          aria-label="Le verdict final arrive"
        >
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
      )}
    </>
  )
}
