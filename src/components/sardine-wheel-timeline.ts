const FULL_TURNS = 7
const SARDINE_SEGMENT_CENTER_DEGREES = 22.5

export const SARDINE_FINAL_ROTATION_DEGREES =
  FULL_TURNS * 360 + (360 - SARDINE_SEGMENT_CENTER_DEGREES)

export function wheelProgress(startedAt: string, durationMs: number, now = Date.now()) {
  if (durationMs <= 0) return 1
  const elapsed = now - Date.parse(startedAt)
  if (!Number.isFinite(elapsed)) return 0
  return Math.min(1, Math.max(0, elapsed / durationMs))
}

export function wheelRotation(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress))
  const eased = 1 - (1 - clamped) ** 5
  return SARDINE_FINAL_ROTATION_DEGREES * eased
}
