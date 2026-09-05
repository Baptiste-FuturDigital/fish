import { useEffect, useState } from "react"
import { Play, RotateCcw, ScanSearch } from "lucide-react"

import { ChallengeAudio } from "./challenge-audio.js"
import { Button } from "./ui/button.js"
import { WhosThatSalmonStage } from "./whos-that-salmon-stage.js"

import "./salmon-demo-screen.css"

type DemoPhase = "idle" | "playing" | "revealed"

const REVEAL_DELAY_MS = 6_000

export function SalmonDemoScreen() {
  const [phase, setPhase] = useState<DemoPhase>("idle")

  useEffect(() => {
    if (phase !== "playing") return
    const timer = window.setTimeout(() => setPhase("revealed"), REVEAL_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  const revealed = phase === "revealed"

  return (
    <section className="salmon-demo" aria-labelledby="salmon-demo-title">
      <header className="salmon-demo-header">
        <p>Prototype de l’épreuve</p>
        <h1 id="salmon-demo-title">Who&apos;s that salmon ?</h1>
        <span>Mode test direct · aucun serveur requis</span>
      </header>

      <div className="salmon-demo-stage-card">
        <WhosThatSalmonStage
          imageUrl={revealed
            ? "/game/Who's that salmon/1-reveal-whale.png"
            : "/game/Who's that salmon/1-guess-whale.png"}
          imageAlt="Pikachu"
          revealed={revealed}
        />

        <div className="salmon-demo-status" aria-live="polite">
          {phase === "idle" ? (
            <>
              <ScanSearch aria-hidden="true" />
              <div>
                <strong>Silhouette prête</strong>
                <p>Lance la séquence pour tester le générique et la révélation.</p>
              </div>
            </>
          ) : phase === "playing" ? (
            <>
              <span className="salmon-demo-pulse" aria-hidden="true" />
              <div>
                <strong>Générique en cours…</strong>
                <p>Une seconde de silence, puis révélation après le générique.</p>
              </div>
            </>
          ) : (
            <div className="salmon-demo-answer">
              <p>La réponse était…</p>
              <h2>C’est Pikachu !</h2>
            </div>
          )}
        </div>
      </div>

      {phase === "playing" ? (
        <ChallengeAudio
          videoId="FsvGm4pqlW8"
          title="Who's that salmon ?"
          startSeconds={0}
          endSeconds={5}
        />
      ) : null}

      <div className="salmon-demo-actions">
        {revealed ? (
          <Button size="lg" variant="secondary" onClick={() => setPhase("idle")}>
            <RotateCcw data-icon="inline-start" />
            Rejouer
          </Button>
        ) : (
          <Button size="lg" onClick={() => setPhase("playing")} disabled={phase === "playing"}>
            <Play data-icon="inline-start" />
            {phase === "playing" ? "Séquence en cours…" : "Lancer la séquence"}
          </Button>
        )}
      </div>
    </section>
  )
}
