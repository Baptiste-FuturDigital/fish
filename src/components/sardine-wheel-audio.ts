export interface SardineWheelNote {
  phase: "spin" | "fanfare"
  atMs: number
  durationMs: number
  frequency: number
  gain: number
  waveform: OscillatorType
}

const SPIN_FREQUENCIES = [220, 277.18, 329.63, 277.18] as const
const FANFARE_CHORDS = [
  [392, 493.88, 587.33],
  [440, 554.37, 659.25],
  [523.25, 659.25, 783.99],
] as const

export function buildSardineWheelScore(): SardineWheelNote[] {
  const spin = Array.from({ length: 16 }, (_, index): SardineWheelNote => ({
    phase: "spin",
    atMs: index * 310,
    durationMs: Math.max(90, 230 - index * 7),
    frequency: SPIN_FREQUENCIES[index % SPIN_FREQUENCIES.length],
    gain: 0.035,
    waveform: index % 2 === 0 ? "square" : "triangle",
  }))
  const fanfare = FANFARE_CHORDS.flatMap((chord, chordIndex) =>
    chord.map((frequency): SardineWheelNote => ({
      phase: "fanfare",
      atMs: 5_050 + chordIndex * 300,
      durationMs: chordIndex === FANFARE_CHORDS.length - 1 ? 720 : 260,
      frequency,
      gain: 0.055,
      waveform: "triangle",
    })),
  )
  return [...spin, ...fanfare]
}

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

let wheelAudioContext: AudioContext | null = null

function audioContext() {
  if (typeof window === "undefined") return null
  const audioWindow = window as AudioWindow
  const Context = audioWindow.AudioContext ?? audioWindow.webkitAudioContext
  if (!Context) return null
  wheelAudioContext ??= new Context()
  return wheelAudioContext
}

export function primeSardineWheelAudio() {
  const context = audioContext()
  if (!context) return
  void context.resume().catch(() => undefined)
}

export function playSardineWheelAudio(progressMs = 0) {
  const context = audioContext()
  if (!context) return () => undefined

  void context.resume().catch(() => undefined)
  const sources: OscillatorNode[] = []
  const offsetMs = Math.max(0, progressMs)

  for (const note of buildSardineWheelScore()) {
    const remainingMs = note.atMs + note.durationMs - offsetMs
    if (remainingMs <= 0) continue

    const delayMs = Math.max(0, note.atMs - offsetMs)
    const durationMs = Math.min(note.durationMs, remainingMs)
    const startsAt = context.currentTime + delayMs / 1_000
    const endsAt = startsAt + durationMs / 1_000
    const attackSeconds = Math.min(0.018, durationMs / 3_000)
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = note.waveform
    oscillator.frequency.setValueAtTime(note.frequency, startsAt)
    gain.gain.setValueAtTime(0.0001, startsAt)
    gain.gain.exponentialRampToValueAtTime(note.gain, startsAt + attackSeconds)
    gain.gain.exponentialRampToValueAtTime(0.0001, endsAt)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startsAt)
    oscillator.stop(endsAt + 0.02)
    sources.push(oscillator)
  }

  return () => {
    for (const source of sources) {
      try {
        source.stop()
      } catch {
        // The source may already have completed naturally.
      }
    }
  }
}
