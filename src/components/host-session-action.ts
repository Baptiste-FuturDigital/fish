import type { GameStatus } from "@shared/game"

export interface RunHostSessionActionOptions {
  status: GameStatus
  onFinish: () => Promise<unknown>
  onLeave: () => void
}

export async function runHostSessionAction({
  status,
  onFinish,
  onLeave,
}: RunHostSessionActionOptions) {
  if (status === "running") await onFinish()
  onLeave()
}
