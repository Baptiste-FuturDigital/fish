import { useEffect, useState, type FormEvent } from "react"
import { LoaderCircle, Pencil } from "lucide-react"
import { toast } from "sonner"

import type { GameView, PlayerSession } from "@shared/game"
import { AnimatedScore } from "@/components/animated-score"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface TeamBoardProps {
  game: GameView
  session: PlayerSession
  onRename: (teamId: string, name: string) => Promise<GameView>
}

export function TeamBoard({ game, session, onRename }: TeamBoardProps) {
  const currentPlayer = game.players.find((player) => player.id === session.playerId)
  const currentTeam = game.teams.find((team) => team.id === currentPlayer?.teamId)
  const [name, setName] = useState(currentTeam?.name ?? "")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(currentTeam?.name ?? "")
  }, [currentTeam?.name])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!currentTeam) return
    setBusy(true)
    try {
      await onRename(currentTeam.id, name)
      toast.success("Nom du banc mis à jour.")
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Le banc refuse ce nom.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle><h2>Les 4 bancs</h2></CardTitle>
        <CardDescription>Retrouvez vos partenaires et nagez côte à côte.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {game.teams.map((team) => {
            const members = game.players.filter((player) => team.memberIds.includes(player.id))
            const isCurrent = team.id === currentTeam?.id
            return (
              <section className="team-card" data-current={isCurrent || undefined} key={team.id}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base leading-tight font-black">{team.name}</h3>
                  <Badge variant={isCurrent ? "default" : "secondary"}>
                    <AnimatedScore points={team.score} /> pts
                  </Badge>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {members.length > 0 ? members.map((player) => (
                    <div className="flex min-w-0 items-center gap-2" key={player.id}>
                      <Avatar size="sm">
                        {player.totem ? <AvatarImage src={player.totem.imageUrl} alt={player.totem.name} /> : null}
                        <AvatarFallback>🐟</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs font-bold">{player.name}</span>
                    </div>
                  )) : <p className="text-xs text-muted-foreground">Banc en formation…</p>}
                </div>
              </section>
            )
          })}
        </div>

        {currentTeam ? (
          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="team-name">Nom de ton banc</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="team-name"
                    value={name}
                    maxLength={32}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <Button type="submit" variant="secondary" disabled={busy || !name.trim()}>
                    {busy ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Pencil data-icon="inline-start" />}
                    Renommer mon banc
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
