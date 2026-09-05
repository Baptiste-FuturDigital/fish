import { useEffect, useRef, useState } from "react"

import type { GameView, PlayerSession } from "@shared/game"
import { FinalScoreboard } from "./final-scoreboard.js"

import "./final-reveal.css"

const SUSPENSE_DURATION_MS = 7_000
const SUSPENSE_SILENCE_MS = 1_000
const VICTORY_MUSIC_DURATION_MS = 10_000
const SUSPENSE_VIDEO_ID = "wKw0pvc1HiE"
const AMBIENT_EVENT = "fish:set-ambient-suspended"
const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"

export function buildFinalRevealPlayerSource(origin: string) {
  const parameters = new URLSearchParams({
    autoplay: "0",
    controls: "0",
    disablekb: "1",
    enablejsapi: "1",
    end: "10",
    fs: "0",
    modestbranding: "1",
    mute: "0",
    origin,
    playsinline: "1",
    rel: "0",
    start: "0",
  })

  return `${YOUTUBE_ORIGIN}/embed/${SUSPENSE_VIDEO_ID}?${parameters.toString()}`
}

type SuspensePlayerCommand = "playVideo" | "unMute"

export function createSuspensePlayerController(
  sendCommand: (command: SuspensePlayerCommand) => void,
) {
  let loaded = false
  let playRequested = false
  let started = false

  const startWhenReady = () => {
    if (!loaded || !playRequested || started) return
    started = true
    sendCommand("playVideo")
    sendCommand("unMute")
  }

  return {
    markLoaded() {
      loaded = true
      startWhenReady()
    },
    requestPlay() {
      playRequested = true
      startWhenReady()
    },
  }
}

interface FinalRevealTransitionOptions {
  audioEnabled: boolean
  onReveal: () => void
  onPlayAudio?: () => void
  target?: EventTarget
}

export function beginFinalRevealTransition({
  audioEnabled,
  onReveal,
  onPlayAudio,
  target = window,
}: FinalRevealTransitionOptions) {
  let active = true
  let ambientSuspended = false

  const restoreAmbient = () => {
    if (!ambientSuspended) return
    ambientSuspended = false
    target.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: false }))
  }

  if (audioEnabled) {
    ambientSuspended = true
    target.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: true }))
  }

  const playTimer = audioEnabled
    ? setTimeout(() => {
        if (active) onPlayAudio?.()
      }, SUSPENSE_SILENCE_MS)
    : null

  const revealTimer = setTimeout(() => {
    if (!active) return
    onReveal()
  }, SUSPENSE_DURATION_MS)

  const restoreTimer = audioEnabled
    ? setTimeout(restoreAmbient, SUSPENSE_SILENCE_MS + VICTORY_MUSIC_DURATION_MS)
    : null

  return () => {
    active = false
    if (playTimer !== null) clearTimeout(playTimer)
    clearTimeout(revealTimer)
    if (restoreTimer !== null) clearTimeout(restoreTimer)
    restoreAmbient()
  }
}

export function FinalReveal({
  game,
  session = null,
  onLeave,
  audioEnabled = false,
}: {
  game: GameView
  session?: PlayerSession | null
  onLeave: () => void
  audioEnabled?: boolean
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const playerRef = useRef<HTMLIFrameElement>(null)
  const playerControllerRef = useRef<ReturnType<typeof createSuspensePlayerController> | null>(null)

  if (!playerControllerRef.current) {
    playerControllerRef.current = createSuspensePlayerController((command) => {
      playerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command, args: [] }),
        YOUTUBE_ORIGIN,
      )
    })
  }

  useEffect(() => {
    return beginFinalRevealTransition({
      audioEnabled,
      onPlayAudio: () => playerControllerRef.current?.requestPlay(),
      onReveal: () => setIsRevealed(true),
    })
  }, [audioEnabled])

  return (
    <>
      {audioEnabled ? (
        <iframe
          ref={playerRef}
          className="final-suspense-player"
          data-testid="final-suspense-player"
          src={buildFinalRevealPlayerSource(
            typeof window === "undefined" ? "http://localhost" : window.location.origin,
          )}
          title="Musique du suspense final"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
          onLoad={() => playerControllerRef.current?.markLoaded()}
        />
      ) : null}

      {isRevealed ? (
        <FinalScoreboard game={game} session={session} onLeave={onLeave} />
      ) : (
        <section
          className="final-suspense"
          data-testid="final-suspense"
          aria-live="polite"
          aria-label="Le verdict final arrive"
        >
          <div className="final-suspense-depth" aria-hidden="true" />
          <div className="final-suspense-sonar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="final-suspense-copy">
            <span className="final-suspense-trident" aria-hidden="true">🔱</span>
            <p>Silence dans l’aquarium</p>
            <h1>Poséithon délibère…</h1>
            <div className="final-suspense-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>
      )}
    </>
  )
}
