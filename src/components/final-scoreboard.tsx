import { Crown, RotateCcw } from "lucide-react"

import type { GameView } from "@shared/game"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function FinalScoreboard({ game, onLeave }: { game: GameView; onLeave: () => void }) {
  const ranking = [...game.teams].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
  const winner = ranking[0]

  return (
    <Card className="my-auto overflow-hidden text-center">
      <div className="final-hero">
        <img src="/poseithon.jpg" alt="Poséithon, dieu des océans" />
        <div><Crown aria-hidden="true" /></div>
      </div>
      <CardHeader>
        <CardDescription>LE VERDICT DE POSÉITHON</CardDescription>
        <CardTitle><h1 className="font-heading text-4xl font-black">Classement final</h1></CardTitle>
        <p className="text-base">Les poissons victorieux sont <strong>{winner?.name}</strong>.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ranking.map((team, index) => (
          <div className="final-ranking-row" key={team.id}>
            <span className="font-heading text-2xl font-black">{index + 1}</span>
            <div className="flex -space-x-2">
              {team.memberIds.slice(0, 4).map((memberId) => {
                const player = game.players.find((candidate) => candidate.id === memberId)
                return (
                  <Avatar size="sm" key={memberId}>
                    {player?.totem ? <AvatarImage src={player.totem.imageUrl} alt={player.totem.name} /> : null}
                    <AvatarFallback>🐟</AvatarFallback>
                  </Avatar>
                )
              })}
            </div>
            <span className="min-w-0 flex-1 truncate text-left font-bold">{team.name}</span>
            <Badge variant={index === 0 ? "default" : "secondary"}>{team.score} pts</Badge>
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-center">
        <Button size="lg" onClick={onLeave}>
          <RotateCcw data-icon="inline-start" /> Nouvelle partie
        </Button>
      </CardFooter>
    </Card>
  )
}
