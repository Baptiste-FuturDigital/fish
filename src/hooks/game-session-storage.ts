import type { PlayerSession } from "@shared/game"

export const GAME_SESSION_KEY = "fish-tournament-session"
export const DEMO_PLAYER_LAUNCH_KEY = "fish-tournament-demo-player-session"

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface DemoPlayerWindow {
  sessionStorage: StorageLike
  location: { assign(path: string): void }
  close(): void
}

export interface GameSessionEnvironment {
  location: { pathname: string; search: string }
  history: { replaceState(data: unknown, unused: string, url?: string | URL | null): void }
  localStorage: StorageLike
  sessionStorage: StorageLike
  open(url?: string | URL, target?: string): DemoPlayerWindow | null
}

function currentEnvironment(): GameSessionEnvironment {
  return window as unknown as GameSessionEnvironment
}

function parseSession(value: string | null): PlayerSession | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<PlayerSession>
    if (
      typeof parsed.gameCode !== "string" ||
      typeof parsed.playerId !== "string" ||
      typeof parsed.playerToken !== "string"
    ) return null
    return parsed as PlayerSession
  } catch {
    return null
  }
}

export function isDemoPlayerView(search = window.location.search): boolean {
  return new URLSearchParams(search).get("demo-player") === "1"
}

export function readGameSession(
  environment: GameSessionEnvironment = currentEnvironment(),
): PlayerSession | null {
  const query = new URLSearchParams(environment.location.search)
  if (query.get("salmon-demo") === "1") return null
  if (query.get("demo") === "1") {
    environment.localStorage.removeItem(GAME_SESSION_KEY)
    environment.localStorage.removeItem(DEMO_PLAYER_LAUNCH_KEY)
    return null
  }
  const storage = isDemoPlayerView(environment.location.search)
    ? environment.sessionStorage
    : environment.localStorage
  return parseSession(storage.getItem(GAME_SESSION_KEY))
}

export function writeHostSession(
  session: PlayerSession,
  environment: GameSessionEnvironment = currentEnvironment(),
): void {
  environment.localStorage.setItem(GAME_SESSION_KEY, JSON.stringify(session))
}

export function writeDemoPlayerLaunchSession(
  session: PlayerSession,
  environment: GameSessionEnvironment = currentEnvironment(),
): void {
  environment.localStorage.setItem(DEMO_PLAYER_LAUNCH_KEY, JSON.stringify(session))
}

export function readDemoPlayerLaunchSession(
  environment: GameSessionEnvironment = currentEnvironment(),
): PlayerSession | null {
  return parseSession(environment.localStorage.getItem(DEMO_PLAYER_LAUNCH_KEY))
}

export function clearCurrentGameSession(
  environment: GameSessionEnvironment = currentEnvironment(),
): void {
  const storage = isDemoPlayerView(environment.location.search)
    ? environment.sessionStorage
    : environment.localStorage
  storage.removeItem(GAME_SESSION_KEY)
}

export function clearDemoPlayerLaunchSession(
  environment: GameSessionEnvironment = currentEnvironment(),
): void {
  environment.localStorage.removeItem(DEMO_PLAYER_LAUNCH_KEY)
}

export function openDemoPlayerTab(
  session: PlayerSession,
  environment: GameSessionEnvironment = currentEnvironment(),
): boolean {
  const playerTab = environment.open("about:blank", "_blank")
  if (!playerTab) return false
  try {
    playerTab.sessionStorage.setItem(GAME_SESSION_KEY, JSON.stringify(session))
    playerTab.location.assign(`${environment.location.pathname}?demo-player=1`)
    return true
  } catch {
    playerTab.close()
    return false
  }
}
