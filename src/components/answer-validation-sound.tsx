import { useEffect, useMemo, useRef } from "react"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"
const VIDEO_ID = "sj_8f94zsUs"

export const ANSWER_VALIDATION_SOUND_EVENT = "fish:play-answer-validation-sound"

type AnswerValidationSoundCommand = {
  name: "playVideo" | "seekTo" | "unMute"
  args: readonly unknown[]
}

export function buildAnswerValidationSoundSource(origin: string) {
  const parameters = new URLSearchParams({
    autoplay: "0",
    controls: "0",
    disablekb: "1",
    enablejsapi: "1",
    mute: "0",
    origin,
    playsinline: "1",
    rel: "0",
  })

  return `${YOUTUBE_ORIGIN}/embed/${VIDEO_ID}?${parameters.toString()}`
}

export function createAnswerValidationSoundController(
  sendCommand: (command: AnswerValidationSoundCommand) => void,
) {
  let loaded = false
  let pendingPlay = false

  const play = () => {
    sendCommand({ name: "seekTo", args: [0, true] })
    sendCommand({ name: "unMute", args: [] })
    sendCommand({ name: "playVideo", args: [] })
  }

  return {
    markLoaded() {
      loaded = true
      if (!pendingPlay) return
      pendingPlay = false
      play()
    },
    requestPlay() {
      if (loaded) {
        play()
        return
      }
      pendingPlay = true
    },
  }
}

export function requestAnswerValidationSound(target: EventTarget = window) {
  target.dispatchEvent(new Event(ANSWER_VALIDATION_SOUND_EVENT))
}

export function AnswerValidationSound({ enabled }: { enabled: boolean }) {
  const playerRef = useRef<HTMLIFrameElement>(null)
  const source = useMemo(
    () => enabled ? buildAnswerValidationSoundSource(window.location.origin) : "",
    [enabled],
  )
  const controllerRef = useRef<ReturnType<typeof createAnswerValidationSoundController> | null>(null)

  if (!controllerRef.current) {
    controllerRef.current = createAnswerValidationSoundController(({ name, args }) => {
      playerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: name, args }),
        YOUTUBE_ORIGIN,
      )
    })
  }

  useEffect(() => {
    if (!enabled) return
    const play = () => controllerRef.current?.requestPlay()
    window.addEventListener(ANSWER_VALIDATION_SOUND_EVENT, play)
    return () => window.removeEventListener(ANSWER_VALIDATION_SOUND_EVENT, play)
  }, [enabled])

  if (!enabled) return null

  return (
    <iframe
      ref={playerRef}
      className="background-music-player"
      data-testid="answer-validation-sound-player"
      src={source}
      title="Effet sonore — réponse verrouillée"
      allow="autoplay; encrypted-media"
      aria-hidden="true"
      tabIndex={-1}
      onLoad={() => controllerRef.current?.markLoaded()}
    />
  )
}
