import { Anchor } from "lucide-react"

import { ProjectorLaunchButton } from "@/projector/projector-launch-button"
import { ProjectorShareButton } from "@/projector/projector-share-button"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.js"

export function HostLobbyTools({ code }: { code: string }) {
  return (
    <Alert className="host-orchestrator-card mb-4">
      <Anchor aria-hidden="true" />
      <AlertTitle>Maître du jeu · hors compétition</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>
          <strong>Cet appareil est ta console maître.</strong>{" "}
          Reviens sur l’adresse Fish Tournament avec ce même navigateur pour reprendre la partie.
        </p>
        <div className="flex flex-wrap gap-2">
          <ProjectorLaunchButton code={code} />
          <ProjectorShareButton code={code} />
        </div>
      </AlertDescription>
    </Alert>
  )
}
