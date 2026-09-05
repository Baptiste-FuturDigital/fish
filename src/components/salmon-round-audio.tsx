import { useEffect, useMemo, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

import type { TournamentPhase } from "@shared/game"
import {
  beginSalmonRoundAudioSession,
  buildChallengeAudioSource,
  type QuestionAudioCommand,
} from "@/components/challenge-audio-control"
import { Button } from "@/components/ui/button"

import "./salmon-round-audio.css"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"
const CUE_DURATION_MS = 5_000

interface SalmonRoundAudioProps {
  enabled: boolean
  phase: TournamentPhase
  roundId: string
  backgroundVideoId?: string
  cueVideoId: string
}

function createQueuedController(sendNow: (command: QuestionAudioCommand) => void) {
  let loaded = false
  const queue: QuestionAudioCommand[] = []
  return {
    markLoaded() {
      loaded = true
      queue.splice(0).forEach(sendNow)
    },
    send(command: QuestionAudioCommand) {
      if (loaded) sendNow(command)
      else queue.push(command)
    },
  }
}

export function SalmonRoundAudio({
  enabled,
  phase,
  roundId,
  backgroundVideoId,
  cueVideoId,
}: SalmonRoundAudioProps) {
  const backgroundRef = useRef<HTMLIFrameElement>(null)
  const cueRef = useRef<HTMLIFrameElement>(null)
  const audioSessionRef = useRef<ReturnType<typeof beginSalmonRoundAudioSession> | null>(null)
  const lastCueRoundRef = useRef<string | null>(null)
  const backgroundControllerRef = useRef<ReturnType<typeof createQueuedController> | null>(null)
  const cueControllerRef = useRef<ReturnType<typeof createQueuedController> | null>(null)
  const [musicMuted, setMusicMuted] = useState(false)

  if (!backgroundControllerRef.current) {
    backgroundControllerRef.current = createQueuedController((command) => {
      backgroundRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command.name, args: command.args }),
        YOUTUBE_ORIGIN,
      )
    })
  }
  if (!cueControllerRef.current) {
    cueControllerRef.current = createQueuedController((command) => {
      cueRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command.name, args: command.args }),
        YOUTUBE_ORIGIN,
      )
    })
  }

  const backgroundSource = useMemo(() => {
    if (!enabled || !backgroundVideoId) return ""
    return buildChallengeAudioSource({
      videoId: backgroundVideoId,
      origin: window.location.origin,
      loop: true,
    })
  }, [backgroundVideoId, enabled])
  const cueSource = useMemo(() => {
    if (!enabled) return ""
    return buildChallengeAudioSource({
      videoId: cueVideoId,
      startSeconds: 0,
      endSeconds: 5,
      origin: window.location.origin,
    })
  }, [cueVideoId, enabled])

  useEffect(() => {
    if (!enabled || !backgroundVideoId) return
    const audioSession = beginSalmonRoundAudioSession({
      cueDurationMs: CUE_DURATION_MS,
      sendBackgroundCommand: (command) => backgroundControllerRef.current?.send(command),
      sendCueCommand: (command) => cueControllerRef.current?.send(command),
    })
    audioSessionRef.current = audioSession
    return () => {
      audioSession.stop()
      audioSessionRef.current = null
      lastCueRoundRef.current = null
    }
  }, [backgroundVideoId, enabled])

  useEffect(() => {
    if (!enabled || phase !== "answering" || lastCueRoundRef.current === roundId) return
    lastCueRoundRef.current = roundId
    audioSessionRef.current?.playCue()
  }, [enabled, phase, roundId])

  if (!enabled || !backgroundVideoId) return null

  function toggleBackgroundMusic() {
    if (musicMuted) {
      audioSessionRef.current?.resumeBackground()
      setMusicMuted(false)
      return
    }

    audioSessionRef.current?.muteBackground()
    setMusicMuted(true)
  }

  return (
    <>
      <iframe
        ref={backgroundRef}
        className="background-music-player"
        data-testid="salmon-background-music-player"
        src={backgroundSource}
        title="Musique épique de Who's that salmon"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => backgroundControllerRef.current?.markLoaded()}
      />
      <iframe
        ref={cueRef}
        className="background-music-player"
        data-testid="salmon-guess-jingle-player"
        src={cueSource}
        title="Jingle Who's that Pokémon"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => cueControllerRef.current?.markLoaded()}
      />
      <div className="salmon-music-control">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-pressed={musicMuted}
          onClick={toggleBackgroundMusic}
        >
          {musicMuted ? <Volume2 data-icon="inline-start" /> : <VolumeX data-icon="inline-start" />}
          {musicMuted ? "Relancer la musique Pokémon" : "Couper la musique Pokémon"}
        </Button>
      </div>
    </>
  )
}
