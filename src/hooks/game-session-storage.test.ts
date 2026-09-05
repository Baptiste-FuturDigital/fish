import { describe, expect, it, vi } from "vitest"

import type { PlayerSession } from "@shared/game"
import {
  DEMO_PLAYER_LAUNCH_KEY,
  GAME_SESSION_KEY,
  clearCurrentGameSession,
  openDemoPlayerTab,
  readDemoPlayerLaunchSession,
  readGameSession,
  writeDemoPlayerLaunchSession,
  writeHostSession,
  type GameSessionEnvironment,
  type StorageLike,
} from "./game-session-storage.js"

const hostSession: PlayerSession = {
  gameCode: "ABCD",
  playerId: "host",
  playerToken: "host-player-token",
  hostToken: "host-token",
}

const playerSession: PlayerSession = {
  gameCode: "ABCD",
  playerId: "ariel",
  playerToken: "player-token",
}

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

function environment(search = ""): GameSessionEnvironment & {
  localStorage: ReturnType<typeof memoryStorage>
  sessionStorage: ReturnType<typeof memoryStorage>
} {
  return {
    location: { pathname: "/", search },
    history: { replaceState: vi.fn() },
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    open: vi.fn(() => null),
  }
}

describe("game session storage", () => {
  it("keeps the host in localStorage and reads a demo player only from sessionStorage", () => {
    const browser = environment()
    writeHostSession(hostSession, browser)
    browser.sessionStorage.setItem(GAME_SESSION_KEY, JSON.stringify(playerSession))

    expect(readGameSession(browser)).toEqual(hostSession)

    browser.location.search = "?demo-player=1"
    expect(readGameSession(browser)).toEqual(playerSession)
  })

  it("retains the launch capability separately and clears only the active player tab", () => {
    const browser = environment("?demo-player=1")
    writeHostSession(hostSession, browser)
    writeDemoPlayerLaunchSession(playerSession, browser)
    browser.sessionStorage.setItem(GAME_SESSION_KEY, JSON.stringify(playerSession))

    expect(readDemoPlayerLaunchSession(browser)).toEqual(playerSession)
    clearCurrentGameSession(browser)

    expect(browser.sessionStorage.getItem(GAME_SESSION_KEY)).toBeNull()
    expect(browser.localStorage.getItem(GAME_SESSION_KEY)).toBe(JSON.stringify(hostSession))
    expect(browser.localStorage.getItem(DEMO_PLAYER_LAUNCH_KEY)).toBe(JSON.stringify(playerSession))
  })

  it("seeds a same-origin tab without putting a capability in its URL", () => {
    const browser = environment()
    const playerTabStorage = memoryStorage()
    const assign = vi.fn()
    browser.open = vi.fn(() => ({
      sessionStorage: playerTabStorage,
      location: { assign },
      close: vi.fn(),
    }))

    expect(openDemoPlayerTab(playerSession, browser)).toBe(true)
    expect(playerTabStorage.getItem(GAME_SESSION_KEY)).toBe(JSON.stringify(playerSession))
    expect(assign).toHaveBeenCalledWith("/?demo-player=1")
    expect(assign.mock.calls.flat().join(" ")).not.toContain(playerSession.playerToken)
  })

  it("reports a blocked popup without mutating either current-tab store", () => {
    const browser = environment()
    browser.open = vi.fn(() => null)

    expect(openDemoPlayerTab(playerSession, browser)).toBe(false)
    expect(browser.localStorage.values.size).toBe(0)
    expect(browser.sessionStorage.values.size).toBe(0)
  })
})
