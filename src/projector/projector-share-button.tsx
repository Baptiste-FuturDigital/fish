import { Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { buildProjectorPath } from "./projector-route.js"

interface ProjectorShareDependencies {
  share?: (data: ShareData) => Promise<void>
  writeText?: (text: string) => Promise<void>
}

export type ProjectorShareResult = "shared" | "copied"

export function buildProjectorUrl(code: string, origin: string) {
  return new URL(buildProjectorPath(code), origin).toString()
}

export async function shareProjectorUrl(
  code: string,
  dependencies: ProjectorShareDependencies,
  origin: string,
): Promise<ProjectorShareResult> {
  const url = buildProjectorUrl(code, origin)
  if (dependencies.share) {
    await dependencies.share({
      title: "Fish Tournament · écran TV",
      text: "Ouvre cette vue sur la télévision.",
      url,
    })
    return "shared"
  }
  if (!dependencies.writeText) throw new Error("Partage indisponible sur ce navigateur.")
  await dependencies.writeText(url)
  return "copied"
}

export function ProjectorShareButton({ code }: { code: string }) {
  async function share() {
    try {
      const result = await shareProjectorUrl(
        code,
        {
          share: navigator.share?.bind(navigator),
          writeText: navigator.clipboard?.writeText.bind(navigator.clipboard),
        },
        window.location.origin,
      )
      toast.success(result === "shared" ? "Lien TV partagé." : "Lien TV copié.")
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return
      toast.error(caught instanceof Error ? caught.message : "Partage impossible.")
    }
  }

  return (
    <Button variant="secondary" onClick={() => void share()}>
      <Share2 data-icon="inline-start" />
      Partager l’écran TV
    </Button>
  )
}
