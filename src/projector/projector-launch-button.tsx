import { MonitorUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildProjectorPath } from "./projector-route.js"

export function ProjectorLaunchButton({ code }: { code: string }) {
  return (
    <Button
      variant="outline"
      render={(
        <a
          href={buildProjectorPath(code)}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
    >
      <MonitorUp data-icon="inline-start" />
      Ouvrir l’écran TV
    </Button>
  )
}
