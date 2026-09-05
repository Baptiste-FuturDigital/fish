import { useEffect } from "react"
import { X } from "lucide-react"

import type { PlayerView } from "@shared/game"

import "./player-portrait-lightbox.css"

export interface PortraitPlayer {
  name: string
  imageUrl: string
  animalName: string
}

export function portraitPlayerFromView(player: PlayerView): PortraitPlayer | null {
  const imageUrl = player.imageUrl ?? player.totem?.imageUrl
  if (!imageUrl) return null

  return {
    name: player.name,
    imageUrl,
    animalName: player.animalName ?? player.totem?.name ?? "Poisson mystérieux",
  }
}

export function PlayerPortraitLightbox({
  player,
  onClose,
}: {
  player: PortraitPlayer
  onClose: () => void
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [onClose])

  return (
    <div
      className="player-portrait-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Portrait de ${player.name}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <button
        type="button"
        className="player-portrait-close"
        onClick={onClose}
        aria-label="Fermer le portrait"
      >
        <X aria-hidden="true" />
      </button>
      <figure>
        <div className="player-portrait-frame">
          <img src={player.imageUrl} alt={`Portrait de ${player.name}`} />
        </div>
        <figcaption>
          <span>SPÉCIMEN IDENTIFIÉ</span>
          <h2>{player.name}</h2>
          <p>{player.animalName}</p>
        </figcaption>
      </figure>
    </div>
  )
}
