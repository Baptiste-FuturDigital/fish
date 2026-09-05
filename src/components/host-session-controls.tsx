import { useState } from "react"
import { Home, LoaderCircle, SkipForward } from "lucide-react"
import { toast } from "sonner"

import { Button } from "./ui/button.js"
import {
  runHostSessionAction,
  type RunHostSessionActionOptions,
} from "./host-session-action.js"

export function HostSessionControls({
  status,
  isDemo,
  canSkipChallenge,
  onFinish,
  onLeave,
  onSkipChallenge,
}: RunHostSessionActionOptions & {
  isDemo: boolean
  canSkipChallenge: boolean
  onSkipChallenge: () => Promise<unknown>
}) {
  const [pending, setPending] = useState<"home" | "skip" | null>(null)

  async function returnHome() {
    setPending("home")
    try {
      await runHostSessionAction({ status, onFinish, onLeave })
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Commande perdue en mer.")
      setPending(null)
    }
  }

  async function skipChallenge() {
    setPending("skip")
    try {
      await onSkipChallenge()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Impossible de changer d'épreuve.")
    } finally {
      setPending(null)
    }
  }

  return (
    <nav className="host-session-controls" aria-label="Navigation du maître du jeu">
      <Button size="sm" variant="secondary" onClick={() => void returnHome()} disabled={Boolean(pending)}>
        {pending === "home" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Home data-icon="inline-start" />}
        Accueil · nouvelle partie
      </Button>
      {isDemo && status === "running" && canSkipChallenge ? (
        <Button size="sm" onClick={() => void skipChallenge()} disabled={Boolean(pending)}>
          {pending === "skip" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <SkipForward data-icon="inline-start" />}
          Épreuve suivante
        </Button>
      ) : null}
    </nav>
  )
}
