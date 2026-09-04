import { useEffect, useMemo, useRef } from "react"

import type { TournamentPhase } from "@shared/game"
import {
  beginQuestionTimerAudioSequence,
  buildChallengeAudioSource,
  type QuestionAudioCommand,
} from "@/components/challenge-audio-control"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"
const END_SOUND_DURATION_MS = 6_000

interface QuestionTimerAudioProps {
  enabled: boolean
  phase: TournamentPhase
  roundId: string
  endsAt: string | null
  timerVideoId?: string
  endVideoId?: string
}

interface QueuedPlayerController {
  markLoaded: () => void
  send: (command: QuestionAudioCommand) => void
}

function createQueuedPlayerController(
  sendCommand: (command: QuestionAudioCommand) => void,
): QueuedPlayerController {
  let loaded = false
  const pendingCommands: QuestionAudioCommand[] = []

  return {
    markLoaded() {
      loaded = true
      pendingCommands.splice(0).forEach(sendCommand)
    },
    send(command) {
      if (loaded) {
        sendCommand(command)
        return
      }
      pendingCommands.push(command)
    },
  }
}

export function QuestionTimerAudio({
  enabled,
  phase,
  roundId,
  endsAt,
  timerVideoId,
  endVideoId,
}: QuestionTimerAudioProps) {
  const timerPlayerRef = useRef<HTMLIFrameElement>(null)
  const endPlayerRef = useRef<HTMLIFrameElement>(null)
  const timerControllerRef = useRef<QueuedPlayerController | null>(null)
  const endControllerRef = useRef<QueuedPlayerController | null>(null)
  const activeRef = useRef<{
    key: string
    deadlineMs: number
    sequence: ReturnType<typeof beginQuestionTimerAudioSequence>
  } | null>(null)

  if (!timerControllerRef.current) {
    timerControllerRef.current = createQueuedPlayerController(({ name, args }) => {
      timerPlayerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: name, args }),
        YOUTUBE_ORIGIN,
      )
    })
  }
  if (!endControllerRef.current) {
    endControllerRef.current = createQueuedPlayerController(({ name, args }) => {
      endPlayerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: name, args }),
        YOUTUBE_ORIGIN,
      )
    })
  }

  const timerSource = useMemo(() => {
    if (!enabled || !timerVideoId) return ""
    return buildChallengeAudioSource({
      videoId: timerVideoId,
      origin: window.location.origin,
    })
  }, [enabled, timerVideoId])
  const endSource = useMemo(() => {
    if (!enabled || !endVideoId) return ""
    return buildChallengeAudioSource({
      videoId: endVideoId,
      origin: window.location.origin,
    })
  }, [enabled, endVideoId])

  useEffect(() => {
    const canPlay = enabled && phase === "answering" && endsAt && timerVideoId && endVideoId
    if (canPlay) {
      const key = `${roundId}:${endsAt}`
      if (activeRef.current?.key === key) return

      activeRef.current?.sequence.stop()
      const deadlineMs = Date.parse(endsAt)
      activeRef.current = {
        key,
        deadlineMs,
        sequence: beginQuestionTimerAudioSequence({
          deadlineMs,
          endSoundDurationMs: END_SOUND_DURATION_MS,
          sendTimerCommand: (command) => timerControllerRef.current?.send(command),
          sendEndCommand: (command) => endControllerRef.current?.send(command),
        }),
      }
      return
    }

    const active = activeRef.current
    if (!active || active.sequence.hasExpired()) return
    if (Date.now() >= active.deadlineMs) {
      active.sequence.expireNow()
      return
    }
    active.sequence.stop()
    activeRef.current = null
  }, [enabled, endVideoId, endsAt, phase, roundId, timerVideoId])

  useEffect(() => {
    return () => {
      activeRef.current?.sequence.stop()
      activeRef.current = null
    }
  }, [])

  if (!enabled || !timerVideoId || !endVideoId) return null

  return (
    <>
      <iframe
        ref={timerPlayerRef}
        className="background-music-player"
        data-testid="question-timer-music-player"
        data-active={String(phase === "answering")}
        src={timerSource}
        title="Musique du chronomètre"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => timerControllerRef.current?.markLoaded()}
      />
      <iframe
        ref={endPlayerRef}
        className="background-music-player"
        data-testid="question-timer-end-player"
        src={endSource}
        title="Effet sonore de fin du chronomètre"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        onLoad={() => endControllerRef.current?.markLoaded()}
      />
    </>
  )
}
