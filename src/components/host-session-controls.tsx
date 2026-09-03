import { useState } from "react"
import { Home, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "./ui/button.js"
import {
  runHostSessionAction,
  type RunHostSessionActionOptions,
} from "./host-session-action.js"

export function HostSessionControls({
  status,
  onFinish,
  onLeave,
}: RunHostSessionActionOptions) {
  const [pending, setPending] = useState(false)

  async function returnHome() {
    setPending(true)
    try {
      await runHostSessionAction({ status, onFinish, onLeave })
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Commande perdue en mer.")
      setPending(false)
    }
  }

  return (
    <nav className="host-session-controls" aria-label="Navigation du maître du jeu">
      <Button size="sm" variant="secondary" onClick={() => void returnHome()} disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Home data-icon="inline-start" />}
        Accueil · nouvelle partie
      </Button>
    </nav>
  )
}
