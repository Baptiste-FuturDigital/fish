import { useCallback, useMemo, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"

interface ChallengeAudioProps {
  videoId: string
  title: string
}

export function ChallengeAudio({ videoId, title }: ChallengeAudioProps) {
  const playerRef = useRef<HTMLIFrameElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const source = useMemo(() => {
    const parameters = new URLSearchParams({
      autoplay: "1",
      controls: "0",
      enablejsapi: "1",
      mute: "0",
      origin: window.location.origin,
      playsinline: "1",
      rel: "0",
    })
    return `${YOUTUBE_ORIGIN}/embed/${videoId}?${parameters.toString()}`
  }, [videoId])

  const command = useCallback((name: "mute" | "playVideo" | "unMute") => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: name, args: [] }),
      YOUTUBE_ORIGIN,
    )
  }, [])

  function toggle() {
    if (isMuted) {
      command("playVideo")
      command("unMute")
    } else {
      command("mute")
    }
    setIsMuted((current) => !current)
  }

  return (
    <div className="challenge-audio">
      <iframe
        ref={playerRef}
        data-testid="challenge-music-player"
        src={source}
        title={`Générique — ${title}`}
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => {
          command("playVideo")
          command(isMuted ? "mute" : "unMute")
        }}
      />
      <Button type="button" size="sm" variant="secondary" onClick={toggle}>
        {isMuted ? <VolumeX data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
        {isMuted ? "Lancer le générique" : "Couper le générique"}
      </Button>
    </div>
  )
}
