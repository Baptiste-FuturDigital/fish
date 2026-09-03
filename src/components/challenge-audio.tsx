import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  beginChallengeAudioSequence,
  buildChallengeAudioSource,
  createChallengePlayerController,
  type ChallengePlayerCommand,
} from "@/components/challenge-audio-control"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"

interface ChallengeAudioProps {
  videoId: string
  title: string
  startSeconds?: number
  endSeconds?: number
}

export function ChallengeAudio({ videoId, title, startSeconds, endSeconds }: ChallengeAudioProps) {
  const playerRef = useRef<HTMLIFrameElement>(null)
  const playerControllerRef = useRef<ReturnType<typeof createChallengePlayerController> | null>(null)
  const stopSequenceRef = useRef<(() => void) | null>(null)
  const [playbackState, setPlaybackState] = useState<"pending" | "playing" | "muted">("pending")
  const source = useMemo(() => {
    return buildChallengeAudioSource({
      videoId,
      startSeconds,
      endSeconds,
      origin: window.location.origin,
    })
  }, [endSeconds, startSeconds, videoId])

  if (!playerControllerRef.current) {
    playerControllerRef.current = createChallengePlayerController((name) => {
      playerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: name, args: [] }),
        YOUTUBE_ORIGIN,
      )
    })
  }

  const command = useCallback((name: ChallengePlayerCommand) => {
    playerControllerRef.current?.send(name)
  }, [])

  const clipDurationMs = useMemo(() => {
    if (endSeconds === undefined) return undefined
    const durationSeconds = endSeconds - (startSeconds ?? 0)
    return durationSeconds > 0 ? durationSeconds * 1_000 : undefined
  }, [endSeconds, startSeconds])

  const startSequence = useCallback(() => {
    stopSequenceRef.current?.()
    setPlaybackState("pending")
    stopSequenceRef.current = beginChallengeAudioSequence({
      clipDurationMs,
      sendCommand: command,
      onPlaybackStarted: () => setPlaybackState("playing"),
    })
  }, [clipDurationMs, command])

  useEffect(() => {
    startSequence()
    return () => {
      stopSequenceRef.current?.()
      stopSequenceRef.current = null
    }
  }, [startSequence])

  function toggle() {
    if (playbackState === "muted") {
      startSequence()
      return
    }

    stopSequenceRef.current?.()
    stopSequenceRef.current = null
    command("mute")
    setPlaybackState("muted")
  }

  const isMuted = playbackState === "muted"

  return (
    <div className="challenge-audio" data-state={playbackState}>
      <iframe
        ref={playerRef}
        data-testid="challenge-music-player"
        src={source}
        title={`Générique — ${title}`}
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => playerControllerRef.current?.markLoaded()}
      />
      <Button type="button" size="sm" variant="secondary" onClick={toggle}>
        {isMuted ? <VolumeX data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
        {isMuted ? "Lancer le générique" : "Couper le générique"}
      </Button>
    </div>
  )
}
