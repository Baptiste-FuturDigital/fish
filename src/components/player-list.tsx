import { useState } from "react"
import { LoaderCircle, UserMinus } from "lucide-react"
import { toast } from "sonner"

import type { GameView, PlayerSession, PlayerView } from "@shared/game"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const FALLBACK_FISH = ["🐟", "🐡", "🦐", "🐙"] as const

function PlayerProfile({ player, index }: { player: PlayerView; index: number }) {
  return (
    <>
      <Avatar size="sm">
        {player.totem ? (
          <AvatarImage src={player.imageUrl ?? player.totem.imageUrl} alt={player.name} />
        ) : null}
        <AvatarFallback>{FALLBACK_FISH[index % FALLBACK_FISH.length]}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-left font-semibold">{player.name}</span>
    </>
  )
}

export function PlayerList({
  game,
  session,
  onKick,
}: {
  game: GameView
  session: PlayerSession
  onKick: (playerId: string) => Promise<unknown>
}) {
  const isHost = Boolean(session.hostToken)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerView | null>(null)
  const [pending, setPending] = useState(false)

  async function confirmKick() {
    if (!selectedPlayer) return
    setPending(true)
    try {
      await onKick(selectedPlayer.id)
      toast.success(`${selectedPlayer.name} doit replonger dans le lobby.`)
      setSelectedPlayer(null)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Exclusion impossible.")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {game.players.map((player, index) => isHost ? (
          <Button
            key={player.id}
            type="button"
            variant="secondary"
            className="player-chip player-chip-action h-auto w-full justify-start"
            aria-label={`Exclure ${player.name}`}
            title="Cliquer pour exclure"
            onClick={() => setSelectedPlayer(player)}
          >
            <PlayerProfile player={player} index={index} />
            <UserMinus data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : (
          <div className="player-chip" key={player.id}>
            <PlayerProfile player={player} index={index} />
            {player.id === session.playerId ? <span className="sr-only">(toi)</span> : null}
          </div>
        ))}
      </div>

      <AlertDialog
        open={Boolean(selectedPlayer)}
        onOpenChange={(open) => {
          if (!open && !pending) setSelectedPlayer(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia><UserMinus aria-hidden="true" /></AlertDialogMedia>
            <AlertDialogTitle>Exclure {selectedPlayer?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce poisson quittera le lobby et devra saisir à nouveau son pseudo pour revenir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmKick()}
            >
              {pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <UserMinus data-icon="inline-start" />}
              Exclure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
