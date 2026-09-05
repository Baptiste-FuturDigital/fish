import { CircleX, Sparkles } from "lucide-react"

import { toDisplayPoints } from "./score-display.js"

import "./whos-that-salmon-stage.css"

interface WhosThatSalmonStageProps {
  imageUrl: string
  imageAlt: string
  revealed: boolean
  playerResult?: {
    isCorrect: boolean
    points: number
  }
}

export function WhosThatSalmonStage({ imageUrl, imageAlt, revealed, playerResult }: WhosThatSalmonStageProps) {
  const displayPoints = playerResult ? toDisplayPoints(playerResult.points) : 0

  return (
    <figure className="whos-salmon-stage" data-revealed={revealed}>
      <img
        className="whos-salmon-frame"
        src={imageUrl}
        alt={revealed ? imageAlt : "Silhouette marine mystérieuse"}
      />
      <div className="whos-salmon-ocean-burst" aria-hidden="true">
        <span>🫧</span><span>🐟</span><span>⚡</span><span>🫧</span><span>🌊</span>
      </div>
      <div className="whos-salmon-wipe" aria-hidden="true" />
      <p className="whos-salmon-phase" aria-hidden="true">
        {revealed ? "RÉVÉLATION !" : "À VOS NAGEOIRES !"}
      </p>
      {revealed && playerResult ? (
        <div
          className="whos-salmon-result-burst"
          data-result={playerResult.isCorrect ? "correct" : "wrong"}
          role="status"
          aria-live="polite"
        >
          {playerResult.isCorrect ? <Sparkles aria-hidden="true" /> : <CircleX aria-hidden="true" />}
          <strong>{playerResult.isCorrect ? `+${displayPoints} points` : "Réponse incorrecte"}</strong>
        </div>
      ) : null}
    </figure>
  )
}
