import type { TvGameView } from "@shared/tv"

export type ProjectorSceneKind =
  | "lobby"
  | "intro"
  | "gameplay"
  | "reveal"
  | "leaderboard"
  | "sardine-wheel"
  | "final"

function normalizeGameCode(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() ?? ""
  return /^[A-Z0-9]{1,12}$/.test(code) ? code : null
}

export function parseProjectorLocation(pathname: string, search: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments[0]?.toLowerCase() !== "tv") {
    return { active: false, code: null } as const
  }

  let pathCode: string | null = null
  if (segments[1]) {
    try {
      pathCode = decodeURIComponent(segments[1])
    } catch {
      pathCode = null
    }
  }
  const queryCode = new URLSearchParams(search).get("code")
  return { active: true, code: normalizeGameCode(pathCode ?? queryCode) } as const
}

export function buildProjectorJoinUrl(origin: string, code: string) {
  const url = new URL("/", origin)
  url.searchParams.set("code", code)
  return url.toString()
}

export function buildProjectorPath(code: string) {
  return `/tv/${encodeURIComponent(code.trim().toUpperCase())}`
}

export function projectorSceneKind(game: TvGameView): ProjectorSceneKind {
  if (game.status === "lobby") return "lobby"
  if (game.status === "finished") return "final"
  if (game.tournament?.sardineWheel) return "sardine-wheel"
  if (game.tournament?.phase === "challenge-intro") return "intro"
  if (game.tournament?.phase === "reveal") return "reveal"
  if (game.tournament?.phase === "leaderboard") return "leaderboard"
  return "gameplay"
}
