import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"

const VIDEO_ID = "8g8Utx0gvv8"
const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"

type YouTubeCommand = "mute" | "playVideo" | "unMute"

export function BackgroundMusic() {
  const playerRef = useRef<HTMLIFrameElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isSuspended, setIsSuspended] = useState(false)
  const isMutedRef = useRef(true)
  const isSuspendedRef = useRef(false)

  const playerSource = useMemo(() => {
    const parameters = new URLSearchParams({
      autoplay: "1",
      controls: "0",
      enablejsapi: "1",
      loop: "1",
      mute: "1",
      origin: window.location.origin,
      playlist: VIDEO_ID,
      playsinline: "1",
      rel: "0",
    })

    return `${YOUTUBE_ORIGIN}/embed/${VIDEO_ID}?${parameters.toString()}`
  }, [])

  const sendCommand = useCallback((command: YouTubeCommand) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      YOUTUBE_ORIGIN,
    )
  }, [])

  const enableMusic = useCallback(() => {
    isMutedRef.current = false
    setIsMuted(false)
    if (isSuspendedRef.current) {
      sendCommand("mute")
      return
    }
    sendCommand("playVideo")
    sendCommand("unMute")
  }, [sendCommand])

  useEffect(() => {
    function handleAmbientSuspension(event: Event) {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean") return

      isSuspendedRef.current = event.detail
      setIsSuspended(event.detail)
      if (event.detail || isMutedRef.current) {
        sendCommand("mute")
        return
      }
      sendCommand("playVideo")
      sendCommand("unMute")
    }

    window.addEventListener("fish:set-ambient-suspended", handleAmbientSuspension)
    return () => window.removeEventListener("fish:set-ambient-suspended", handleAmbientSuspension)
  }, [sendCommand])

  useEffect(() => {
    function unlockOnFirstInteraction(event: MouseEvent) {
      const target = event.target
      if (target instanceof Element && target.closest("[data-music-control]")) {
        document.removeEventListener("click", unlockOnFirstInteraction)
        return
      }

      enableMusic()
      document.removeEventListener("click", unlockOnFirstInteraction)
    }

    document.addEventListener("click", unlockOnFirstInteraction)
    return () => document.removeEventListener("click", unlockOnFirstInteraction)
  }, [enableMusic])

  function toggleMusic() {
    if (isMuted) {
      enableMusic()
      return
    }

    isMutedRef.current = true
    sendCommand("mute")
    setIsMuted(true)
  }

  const controlLabel = isMuted ? "Activer la musique" : "Couper la musique"

  return (
    <>
      <iframe
        ref={playerRef}
        className="background-music-player"
        data-testid="background-music-player"
        data-suspended={String(isSuspended)}
        src={playerSource}
        title="Whale EDM — lecteur d'ambiance YouTube"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => {
          if (isSuspendedRef.current || isMutedRef.current) {
            sendCommand("mute")
            return
          }
          sendCommand("playVideo")
          sendCommand("unMute")
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] rounded-full shadow-2xl"
        data-music-control
        aria-label={controlLabel}
        aria-pressed={!isMuted}
        title={controlLabel}
        onClick={toggleMusic}
      >
        {isMuted ? <VolumeX data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
      </Button>
    </>
  )
}
