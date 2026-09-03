import "./whos-that-salmon-stage.css"

interface WhosThatSalmonStageProps {
  imageUrl: string
  imageAlt: string
  revealed: boolean
}

export function WhosThatSalmonStage({
  imageUrl,
  imageAlt,
  revealed,
}: WhosThatSalmonStageProps) {
  return (
    <figure className="whos-salmon-stage" data-revealed={revealed}>
      <img
        className="whos-salmon-backdrop"
        src="/whos-that-salmon-stage.png"
        alt=""
        aria-hidden="true"
      />
      <div className="whos-salmon-creature">
        <img
          className={revealed ? "whos-salmon-cutout" : "whos-salmon-cutout is-masked"}
          src={imageUrl}
          alt={revealed ? imageAlt : ""}
          aria-hidden={!revealed}
        />
        {!revealed ? <span className="whos-salmon-mystery" aria-hidden="true">?</span> : null}
      </div>
      <figcaption className="whos-salmon-title" aria-label="Who's that salmon ?">
        <span>{"WHO’S THAT "}</span>
        <strong>SALMON ?</strong>
      </figcaption>
    </figure>
  )
}
