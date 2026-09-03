import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { beginAmbientSuspension, buildChallengeAudioSource } from "@/components/challenge-audio-control"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"

interface ChallengeAudioProps {
  videoId: string
  title: string
  startSeconds?: number
  endSeconds?: number
}

export function ChallengeAudio({ videoId, title, startSeconds, endSeconds }: ChallengeAudioProps) {
  const playerRef = useRef<HTMLIFrameElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const source = useMemo(() => {
    return buildChallengeAudioSource({
      videoId,
      startSeconds,
      endSeconds,
      origin: window.location.origin,
    })
  }, [endSeconds, startSeconds, videoId])

  useEffect(() => {
    if (endSeconds === undefined) return
    const durationSeconds = endSeconds - (startSeconds ?? 0)
    if (durationSeconds <= 0) return
    return beginAmbientSuspension(durationSeconds * 1_000)
  }, [endSeconds, startSeconds])

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
