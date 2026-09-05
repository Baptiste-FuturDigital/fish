import "./whos-that-salmon-stage.css"

interface WhosThatSalmonStageProps {
  imageUrl: string
  imageAlt: string
  revealed: boolean
}

export function WhosThatSalmonStage({ imageUrl, imageAlt, revealed }: WhosThatSalmonStageProps) {
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
    </figure>
  )
}
