import { useEffect, useState, type FormEvent } from "react"
import { MonitorPlay, Radio, Waves } from "lucide-react"

import type { TvGameView } from "@shared/tv"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fetchTvGame } from "./projector-client.js"
import { ProjectorScreen } from "./projector-screen.js"
import { buildProjectorJoinUrl, buildProjectorPath } from "./projector-route.js"

const POLL_INTERVAL_MS = 1_000

function ProjectorSetup() {
  const [gameCode, setGameCode] = useState("")
  const valid = /^[A-Z0-9]{4}$/.test(gameCode)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    window.location.assign(buildProjectorPath(gameCode))
  }

  return (
    <main className="projector-viewport">
      <section className="projector-stage projector-setup-stage">
        <div className="projector-caustics" aria-hidden="true" />
        <Card className="projector-setup-card">
          <form onSubmit={submit}>
            <CardHeader>
              <div className="projector-setup-icon" aria-hidden="true"><MonitorPlay /></div>
              <CardTitle>Écran TV</CardTitle>
              <CardDescription>Entre le code affiché sur le téléphone du maître du jeu.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="projector-game-code">Code de la partie</FieldLabel>
                  <Input
                    id="projector-game-code"
                    value={gameCode}
                    maxLength={4}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    inputMode="text"
                    placeholder="FISH"
                    onChange={(event) => {
                      setGameCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))
                    }}
                  />
                  <FieldDescription>Quatre lettres ou chiffres.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter>
              <Button size="lg" type="submit" disabled={!valid}>
                <MonitorPlay data-icon="inline-start" />
                Lancer l’écran TV
              </Button>
            </CardFooter>
          </form>
        </Card>
      </section>
    </main>
  )
}

function ProjectorConnectionState({ message }: { message?: string }) {
  return (
    <main className="projector-viewport">
      <section className="projector-stage projector-connection-stage">
        <div className="projector-caustics" aria-hidden="true" />
        <div className="projector-connection-state" role="status" aria-live="polite">
          {message ? <Waves aria-hidden="true" /> : <Radio aria-hidden="true" />}
          <h1>{message ? "Aquarium inaccessible" : "Connexion à l’aquarium…"}</h1>
          <p>{message ?? "Le projecteur récupère l’état public du tournoi."}</p>
        </div>
      </section>
    </main>
  )
}

export function ProjectorApp({ code }: { code: string | null }) {
  const [game, setGame] = useState<TvGameView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    let stopped = false
    let nextPoll: number | undefined

    const poll = async () => {
      try {
        const nextGame = await fetchTvGame(code)
        if (stopped) return
        setGame(nextGame)
        setError(null)
      } catch (caught) {
        if (stopped) return
        setError(caught instanceof Error ? caught.message : "Écran TV déconnecté de l’aquarium.")
      } finally {
        if (!stopped) nextPoll = window.setTimeout(() => void poll(), POLL_INTERVAL_MS)
      }
    }

    void poll()
    return () => {
      stopped = true
      if (nextPoll !== undefined) window.clearTimeout(nextPoll)
    }
  }, [code])

  if (!code) return <ProjectorSetup />
  if (!game) return <ProjectorConnectionState message={error ?? undefined} />

  return (
    <>
      <ProjectorScreen game={game} joinUrl={buildProjectorJoinUrl(window.location.origin, game.code)} />
      {error ? <p className="projector-sync-warning" role="status">Synchronisation interrompue · nouvelle tentative…</p> : null}
    </>
  )
}
