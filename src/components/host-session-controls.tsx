import { useState } from "react"
import { FastForward, Home, LoaderCircle, SkipForward, Smartphone } from "lucide-react"
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
  canSkipRound,
  canOpenDemoPlayer = false,
  onFinish,
  onLeave,
  onSkipChallenge,
  onSkipRound,
  onOpenDemoPlayer = () => undefined,
}: RunHostSessionActionOptions & {
  isDemo: boolean
  canSkipChallenge: boolean
  canSkipRound: boolean
  canOpenDemoPlayer?: boolean
  onSkipChallenge: () => Promise<unknown>
  onSkipRound: () => Promise<unknown>
  onOpenDemoPlayer?: () => void
}) {
  const [pending, setPending] = useState<"home" | "skip-challenge" | "skip-round" | null>(null)

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
    setPending("skip-challenge")
    try {
      await onSkipChallenge()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Impossible de changer d'épreuve.")
    } finally {
      setPending(null)
    }
  }

  async function skipRound() {
    setPending("skip-round")
    try {
      await onSkipRound()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Impossible de changer de manche.")
    } finally {
      setPending(null)
    }
  }

  function openDemoPlayer() {
    try {
      onOpenDemoPlayer()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Impossible d'ouvrir la vue joueur.")
    }
  }

  return (
    <nav className="host-session-controls" aria-label="Navigation du maître du jeu">
      <Button size="sm" variant="secondary" onClick={() => void returnHome()} disabled={Boolean(pending)}>
        {pending === "home" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Home data-icon="inline-start" />}
        Accueil · nouvelle partie
      </Button>
      {isDemo && canOpenDemoPlayer ? (
        <Button size="sm" variant="secondary" onClick={openDemoPlayer} disabled={Boolean(pending)}>
          <Smartphone data-icon="inline-start" />
          Ouvrir la vue joueur
        </Button>
      ) : null}
      {isDemo && status === "running" && canSkipChallenge ? (
        <Button size="sm" onClick={() => void skipChallenge()} disabled={Boolean(pending)}>
          {pending === "skip-challenge" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <SkipForward data-icon="inline-start" />}
          Épreuve suivante
        </Button>
      ) : null}
      {isDemo && status === "running" && canSkipRound ? (
        <Button size="sm" variant="secondary" onClick={() => void skipRound()} disabled={Boolean(pending)}>
          {pending === "skip-round" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <FastForward data-icon="inline-start" />}
          Manche suivante
        </Button>
      ) : null}
    </nav>
  )
}
