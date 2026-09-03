const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"
const AMBIENT_EVENT = "fish:set-ambient-suspended"

interface ChallengeAudioSourceOptions {
  videoId: string
  startSeconds?: number
  endSeconds?: number
  origin: string
}

interface HostAudioSession {
  hostToken?: string
}

export function isHostAudioEnabled(session: HostAudioSession) {
  return Boolean(session.hostToken)
}

export function buildChallengeAudioSource({
  videoId,
  startSeconds,
  endSeconds,
  origin,
}: ChallengeAudioSourceOptions) {
  const parameters = new URLSearchParams({
    autoplay: "1",
    controls: "0",
    disablekb: "1",
    enablejsapi: "1",
    mute: "0",
    origin,
    playsinline: "1",
    rel: "0",
  })

  if (startSeconds !== undefined) parameters.set("start", String(startSeconds))
  if (endSeconds !== undefined) parameters.set("end", String(endSeconds))

  return `${YOUTUBE_ORIGIN}/embed/${videoId}?${parameters.toString()}`
}

function setAmbientSuspended(target: EventTarget, suspended: boolean) {
  target.dispatchEvent(new CustomEvent<boolean>(AMBIENT_EVENT, { detail: suspended }))
}

export function beginAmbientSuspension(durationMs: number, target: EventTarget = window) {
  let restored = false
  const restore = () => {
    if (restored) return
    restored = true
    setAmbientSuspended(target, false)
  }

  setAmbientSuspended(target, true)
  const timer = setTimeout(restore, durationMs)

  return () => {
    clearTimeout(timer)
    restore()
  }
}
