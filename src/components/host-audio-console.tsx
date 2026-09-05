import { useState } from "react"
import { Music2 } from "lucide-react"

import type { GameView, PlayerSession } from "@shared/game"

import "./host-audio-console.css"

const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com"
const AMBIENT_VIDEO_ID = "8g8Utx0gvv8"
const FINAL_SUSPENSE_VIDEO_ID = "wKw0pvc1HiE"

export type HostAudioTrackKind =
  | "ambient"
  | "challenge-intro"
  | "answering"
  | "timer-end"
  | "salmon-cue"
  | "final-suspense"

export interface HostAudioTrack {
  kind: HostAudioTrackKind
  label: string
  videoId: string
  startSeconds?: number
  endSeconds?: number
}

const AMBIENT_TRACK: HostAudioTrack = {
  kind: "ambient",
  label: "Ambiance",
  videoId: AMBIENT_VIDEO_ID,
}

const FINAL_SUSPENSE_TRACK: HostAudioTrack = {
  kind: "final-suspense",
  label: "Suspense final",
  videoId: FINAL_SUSPENSE_VIDEO_ID,
  startSeconds: 0,
  endSeconds: 10,
}

export function selectHostAudioTracks(game: GameView): HostAudioTrack[] {
  if (game.status === "finished") return [FINAL_SUSPENSE_TRACK, AMBIENT_TRACK]
  if (game.status !== "running" || !game.tournament) return [AMBIENT_TRACK]

  const { challenge, phase } = game.tournament
  if (phase === "challenge-intro") {
    return [{
      kind: "challenge-intro",
      label: `Générique · ${challenge.shortTitle}`,
      videoId: challenge.introMusicYoutubeId,
      startSeconds: challenge.introMusicStartSeconds,
      endSeconds: challenge.introMusicEndSeconds,
    }, AMBIENT_TRACK]
  }

  if (phase === "answering") {
    const tracks: HostAudioTrack[] = []
    if (challenge.answeringMusicYoutubeId) {
      tracks.push({
        kind: "answering",
        label: challenge.id === "whos-dat-salmon" ? "Fond Pokémon" : "Musique de manche",
        videoId: challenge.answeringMusicYoutubeId,
      })
    }
    if (challenge.id === "whos-dat-salmon") {
      tracks.push({
        kind: "salmon-cue",
        label: "Jingle Pokémon",
        videoId: challenge.introMusicYoutubeId,
        startSeconds: 0,
        endSeconds: 5,
      })
    }
    if (challenge.timerEndSoundYoutubeId) {
      tracks.push({
        kind: "timer-end",
        label: "Effet fin chrono",
        videoId: challenge.timerEndSoundYoutubeId,
      })
    }
    return [...tracks, AMBIENT_TRACK]
  }

  if (phase === "reveal" && challenge.timerEndSoundYoutubeId) {
    return [{
      kind: "timer-end",
      label: "Effet fin chrono",
      videoId: challenge.timerEndSoundYoutubeId,
    }, AMBIENT_TRACK]
  }

  return [AMBIENT_TRACK]
}

export function buildHostAudioPlayerSource(track: HostAudioTrack, origin: string) {
  const parameters = new URLSearchParams({
    autoplay: "0",
    controls: "1",
    disablekb: "0",
    fs: "0",
    playsinline: "1",
    rel: "0",
    origin,
  })
  if (track.startSeconds !== undefined) parameters.set("start", String(track.startSeconds))
  if (track.endSeconds !== undefined) parameters.set("end", String(track.endSeconds))
  return `${YOUTUBE_ORIGIN}/embed/${track.videoId}?${parameters.toString()}`
}

export function HostAudioConsole({ game, session }: { game: GameView; session: PlayerSession }) {
  const tracks = selectHostAudioTracks(game)
  const [selectedKind, setSelectedKind] = useState<HostAudioTrackKind | null>(null)
  if (!session.hostToken) return null

  const selectedTrack = tracks.find((track) => track.kind === selectedKind) ?? tracks[0]
  const source = buildHostAudioPlayerSource(
    selectedTrack,
    typeof window === "undefined" ? "http://localhost" : window.location.origin,
  )

  return (
    <details className="host-audio-console" data-testid="host-audio-console">
      <summary>
        <Music2 aria-hidden="true" />
        <span>Régie son</span>
        <small>lecture manuelle</small>
      </summary>
      <div className="host-audio-console-panel">
        <p>Choisis une piste, puis appuie sur lecture dans le player.</p>
        <div className="host-audio-track-list" role="group" aria-label="Pistes disponibles">
          {tracks.map((track) => (
            <button
              type="button"
              key={track.kind}
              data-active={track.kind === selectedTrack.kind ? "true" : "false"}
              aria-pressed={track.kind === selectedTrack.kind}
              onClick={() => setSelectedKind(track.kind)}
            >
              {track.label}
            </button>
          ))}
        </div>
        <iframe
          key={selectedTrack.kind}
          data-testid="host-audio-player"
          src={source}
          title={`Régie son — ${selectedTrack.label}`}
          allow="autoplay; encrypted-media"
          loading="eager"
        />
      </div>
    </details>
  )
}
