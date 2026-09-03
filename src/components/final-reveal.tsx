import { useEffect, useState } from "react"

import type { GameView } from "@shared/game"
import { FinalScoreboard } from "@/components/final-scoreboard"

import "./final-reveal.css"

const SUSPENSE_DURATION_MS = 7_000
const SUSPENSE_VIDEO_ID = "wKw0pvc1HiE"

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

function setAmbientSuspended(suspended: boolean) {
  window.dispatchEvent(
    new CustomEvent("fish:set-ambient-suspended", {
      detail: suspended,
    }),
  )
}

export function FinalReveal({
  game,
  onLeave,
}: {
  game: GameView
  onLeave: () => void
}) {
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    setAmbientSuspended(true)

    const revealTimer = window.setTimeout(() => {
      setAmbientSuspended(false)
      setIsRevealed(true)
    }, SUSPENSE_DURATION_MS)

    return () => {
      window.clearTimeout(revealTimer)
      setAmbientSuspended(false)
    }
  }, [])

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
      <iframe
        className="final-suspense-player"
        data-testid="final-suspense-player"
        src={suspensePlayerSource}
        title="Musique du suspense final"
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        aria-hidden="true"
      />

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
