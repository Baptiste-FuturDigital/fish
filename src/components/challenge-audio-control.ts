const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"
const AMBIENT_EVENT = "fish:set-ambient-suspended"
const INTRO_PAUSE_MS = 1_000

export type ChallengePlayerCommand = "mute" | "playVideo" | "unMute"

export function createChallengePlayerController(
  sendCommand: (command: ChallengePlayerCommand) => void,
) {
  let loaded = false
  const pendingCommands: ChallengePlayerCommand[] = []

  return {
    markLoaded() {
      loaded = true
      pendingCommands.splice(0).forEach(sendCommand)
    },
    send(command: ChallengePlayerCommand) {
      if (loaded) {
        sendCommand(command)
        return
      }
      pendingCommands.push(command)
    },
  }
}

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
    autoplay: "0",
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

interface ChallengeAudioSequenceOptions {
  clipDurationMs?: number
  sendCommand: (command: ChallengePlayerCommand) => void
  target?: EventTarget
  onPlaybackStarted?: () => void
}

export function beginChallengeAudioSequence({
  clipDurationMs,
  sendCommand,
  target = window,
  onPlaybackStarted,
}: ChallengeAudioSequenceOptions) {
  let restored = false
  const restore = () => {
    if (restored) return
    restored = true
    setAmbientSuspended(target, false)
  }

  setAmbientSuspended(target, true)
  const playTimer = setTimeout(() => {
    sendCommand("playVideo")
    sendCommand("unMute")
    onPlaybackStarted?.()
  }, INTRO_PAUSE_MS)

  const restoreTimer = clipDurationMs === undefined
    ? undefined
    : setTimeout(restore, INTRO_PAUSE_MS + clipDurationMs)

  return () => {
    clearTimeout(playTimer)
    if (restoreTimer !== undefined) clearTimeout(restoreTimer)
    restore()
  }
}

export type QuestionAudioCommand = {
  name: "mute" | "pauseVideo" | "playVideo" | "seekTo" | "unMute"
  args: readonly unknown[]
}

interface QuestionTimerAudioSequenceOptions {
  deadlineMs: number
  now?: number
  endSoundDurationMs: number
  sendTimerCommand: (command: QuestionAudioCommand) => void
  sendEndCommand: (command: QuestionAudioCommand) => void
  target?: EventTarget
}

export function beginQuestionTimerAudioSequence({
  deadlineMs,
  now = Date.now(),
  endSoundDurationMs,
  sendTimerCommand,
  sendEndCommand,
  target = window,
}: QuestionTimerAudioSequenceOptions) {
  let expired = false
  let stopped = false
  let restoreTimer: ReturnType<typeof setTimeout> | undefined

  const restore = () => {
    if (stopped) return
    stopped = true
    sendTimerCommand({ name: "pauseVideo", args: [] })
    if (expired) sendEndCommand({ name: "pauseVideo", args: [] })
    setAmbientSuspended(target, false)
  }

  const expire = () => {
    if (stopped || expired) return
    expired = true
    sendTimerCommand({ name: "pauseVideo", args: [] })
    sendEndCommand({ name: "seekTo", args: [0, true] })
    sendEndCommand({ name: "unMute", args: [] })
    sendEndCommand({ name: "playVideo", args: [] })
    restoreTimer = setTimeout(restore, endSoundDurationMs)
  }

  setAmbientSuspended(target, true)
  sendTimerCommand({ name: "seekTo", args: [0, true] })
  sendTimerCommand({ name: "unMute", args: [] })
  sendTimerCommand({ name: "playVideo", args: [] })
  const expiryTimer = setTimeout(expire, Math.max(0, deadlineMs - now))

  return {
    hasExpired: () => expired,
    expireNow: expire,
    stop() {
      clearTimeout(expiryTimer)
      if (restoreTimer !== undefined) clearTimeout(restoreTimer)
      restore()
    },
  }
}
