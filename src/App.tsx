import { useMemo, useState, type FormEvent } from "react"
import {
  Anchor,
  ArrowRight,
  Copy,
  Flag,
  LoaderCircle,
  LogIn,
  Plus,
  RotateCcw,
  SkipForward,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import type { GameView, PlayerSession } from "@shared/game"
import { gameApi } from "@/api"
import { useGame } from "@/hooks/use-game"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"

type HomeMode = "choice" | "create" | "join"

const BUBBLE_COUNT = 12

function OceanShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="ocean-shell">
      <div className="bubble-field" data-testid="bubble-field" aria-hidden="true">
        {Array.from({ length: BUBBLE_COUNT }, (_, index) => (
          <span className="bubble" key={index} />
        ))}
      </div>
      <div className="relative mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </div>
    </main>
  )
}

function Brand() {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="brand-mark" aria-hidden="true">
          🐟
        </div>
        <div>
          <p className="brand-kicker">JEU DE SOIRÉE</p>
          <p className="font-heading text-xl leading-none font-black">Poisson chelou</p>
        </div>
      </div>
          <Badge variant="secondary">Fish Party</Badge>
    </header>
  )
}

function HomeScreen({ onEnter }: { onEnter: (response: Awaited<ReturnType<typeof gameApi.create>>) => void }) {
  const initialCode = new URLSearchParams(window.location.search).get("code") ?? ""
  const [mode, setMode] = useState<HomeMode>("choice")
  const [gameName, setGameName] = useState("L'aquarium de ce soir")
  const [hostName, setHostName] = useState("")
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [playerName, setPlayerName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onEnter(await gameApi.create(gameName, hostName))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Création impossible.")
    } finally {
      setBusy(false)
    }
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onEnter(await gameApi.join(code, playerName))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Plongée impossible.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Brand />
      <section className="mb-7 pt-5">
        <Badge variant="outline">C'EST L'HEURE DU DUEL</Badge>
        <h1 className="mt-4 max-w-md font-heading text-5xl leading-[0.92] font-black tracking-[-0.045em] text-balance sm:text-6xl">
          Quels poissons seront dignes de Poséidon ? 🔱
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          Merci de vous donner à fond, marins, les champions seront dignement récompensés.
        </p>
      </section>

      {mode === "choice" && (
        <Card>
          <CardHeader>
            <CardTitle>Choisis ton plongeon</CardTitle>
            <CardDescription>Une partie se lance en moins d'une minute.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button size="lg" className="w-full" onClick={() => setMode("create")}>
              <Plus data-icon="inline-start" />
              Créer une partie
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => setMode("join")}>
              <LogIn data-icon="inline-start" />
              Rejoindre une partie
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-center text-xs text-muted-foreground">Aucun compte · Aucun téléchargement · Beaucoup de branchies</p>
          </CardFooter>
        </Card>
      )}

      {mode === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Ouvre ton aquarium</CardTitle>
            <CardDescription>Tu seras le capitaine de cette étrange expédition.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="create-game" onSubmit={submitCreate}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="game-name">Nom de la partie</FieldLabel>
                  <Input id="game-name" value={gameName} maxLength={40} onChange={(event) => setGameName(event.target.value)} autoComplete="off" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="host-name">Ton pseudo d'hôte</FieldLabel>
                  <Input id="host-name" value={hostName} maxLength={24} onChange={(event) => setHostName(event.target.value)} autoComplete="nickname" autoFocus />
                  <FieldDescription>Le banc saura qui tient la barre.</FieldDescription>
                </Field>
                {error && <FieldError>{error}</FieldError>}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="ghost" onClick={() => setMode("choice")}>Retour</Button>
            <Button form="create-game" type="submit" className="ml-auto" disabled={busy}>
              {busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Anchor data-icon="inline-start" />}
              Créer l'aquarium
            </Button>
          </CardFooter>
        </Card>
      )}

      {mode === "join" && (
        <Card>
          <CardHeader>
            <CardTitle>Rejoins le banc</CardTitle>
            <CardDescription>Demande le code à la personne qui a créé la partie.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="join-game" onSubmit={submitJoin}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="game-code">Code de partie</FieldLabel>
                  <Input id="game-code" className="uppercase" value={code} minLength={4} maxLength={4} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="off" inputMode="text" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="player-name">Ton pseudo</FieldLabel>
                  <Input id="player-name" value={playerName} maxLength={24} onChange={(event) => setPlayerName(event.target.value)} autoComplete="nickname" autoFocus />
                </Field>
                {error && <FieldError>{error}</FieldError>}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="ghost" onClick={() => setMode("choice")}>Retour</Button>
            <Button form="join-game" type="submit" className="ml-auto" disabled={busy}>
              {busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}
              Plonger dans la partie
            </Button>
          </CardFooter>
        </Card>
      )}
      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">Fabriqué dans les profondeurs · 🫧</p>
    </>
  )
}

function GameHeader({ game }: { game: GameView }) {
  return (
    <>
      <Brand />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">Aquarium actif</p>
          <h1 className="truncate font-heading text-2xl font-black">{game.name}</h1>
        </div>
        <Badge variant="outline">#{game.code}</Badge>
      </div>
    </>
  )
}

function PlayerList({ game, session }: { game: GameView; session: PlayerSession }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {game.players.map((player, index) => (
        <div className="player-chip" key={player.id}>
          <Avatar size="sm">
            <AvatarFallback>{["🐟", "🐡", "🦐", "🐙"][index % 4]}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate font-semibold">{player.name}</span>
          {player.isHost && <span title="Capitaine">⚓</span>}
          {player.id === session.playerId && <span className="sr-only">(toi)</span>}
        </div>
      ))}
    </div>
  )
}

function LobbyScreen({ game, session, onStart }: { game: GameView; session: PlayerSession; onStart: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const isHost = Boolean(session.hostToken)

  async function copyInvite() {
    const url = `${window.location.origin}/?code=${game.code}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Lien copié. Fais entrer le banc !")
    } catch {
      toast.info(`Code de partie : ${game.code}`)
    }
  }

  async function start() {
    setBusy(true)
    try {
      await onStart()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Départ impossible.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <GameHeader game={game} />
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>En attente du banc</CardTitle>
          <CardDescription>Partage ce code aux poissons présents.</CardDescription>
          <CardAction><Badge variant="secondary">LOBBY</Badge></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-4">
          <p data-testid="game-code" className="game-code">{game.code}</p>
          <Button variant="secondary" onClick={copyInvite}>
            <Copy data-icon="inline-start" /> Copier le lien
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{game.players.length} {game.players.length === 1 ? "poisson à bord" : "poissons à bord"}</CardTitle>
          <CardDescription>La liste se met à jour automatiquement.</CardDescription>
        </CardHeader>
        <CardContent><PlayerList game={game} session={session} /></CardContent>
      </Card>

      <div className="mt-auto pt-3">
        {isHost ? (
          <Button size="lg" className="w-full" onClick={start} disabled={busy || game.players.length < 2}>
            {busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Users data-icon="inline-start" />}
            Lancer la partie
          </Button>
        ) : (
          <Alert>
            <Anchor />
            <AlertTitle>Le capitaine prépare le départ</AlertTitle>
            <AlertDescription>Reste ici, la première manche apparaîtra toute seule.</AlertDescription>
          </Alert>
        )}
        {isHost && game.players.length < 2 && <p className="mt-2 text-center text-xs text-muted-foreground">Il faut au moins un autre poisson.</p>}
      </div>
    </>
  )
}

const kindLabels = {
  question: "Question",
  duel: "Duel",
  vote: "Vote du banc",
  mime: "Mime",
  action: "Action",
}

function GameScreen({ game, session, onAction }: { game: GameView; session: PlayerSession; onAction: (action: "next" | "finish") => Promise<void> }) {
  const [busy, setBusy] = useState<"next" | "finish" | null>(null)
  const prompt = game.currentPrompt
  if (!prompt) return null
  const isHost = Boolean(session.hostToken)

  async function act(action: "next" | "finish") {
    setBusy(action)
    try {
      await onAction(action)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Commande perdue en mer.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <GameHeader game={game} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge variant="secondary">{kindLabels[prompt.kind]}</Badge>
        <p className="text-sm font-bold">Manche {game.currentRound} / {game.totalRounds}</p>
      </div>
      <div className="round-track" aria-hidden="true"><span style={{ width: `${(game.currentRound / game.totalRounds) * 100}%` }} /></div>

      <Card className="my-4 flex-1 justify-center">
        <CardHeader className="text-center">
          <p className="prompt-emoji" aria-hidden="true">{prompt.emoji}</p>
          <CardDescription>{prompt.kicker}</CardDescription>
          <CardTitle className="font-heading text-3xl leading-tight font-black text-balance">{prompt.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          <p className="text-base leading-relaxed text-balance">{prompt.instruction}</p>
          <Separator />
          <div className="flex flex-wrap justify-center gap-2">
            {prompt.players.map((player) => <Badge key={player} variant="secondary">🐠 {player}</Badge>)}
          </div>
        </CardContent>
      </Card>

      {isHost ? (
        <div className="grid grid-cols-[1fr_auto] gap-2 pb-[env(safe-area-inset-bottom)]">
          <Button size="lg" onClick={() => act("next")} disabled={Boolean(busy)}>
            {busy === "next" ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <SkipForward data-icon="inline-start" />}
            Défi suivant
          </Button>
          <Button size="lg" variant="outline" onClick={() => act("finish")} disabled={Boolean(busy)}>
            <Flag data-icon="inline-start" /> Terminer
          </Button>
        </div>
      ) : (
        <p className="pb-[env(safe-area-inset-bottom)] text-center text-sm text-muted-foreground">Le capitaine fera apparaître le prochain défi.</p>
      )}
    </>
  )
}

function EndScreen({ game, session, onLeave }: { game: GameView; session: PlayerSession; onLeave: () => void }) {
  return (
    <>
      <GameHeader game={game} />
      <Card className="my-auto text-center">
        <CardHeader>
          <p className="prompt-emoji" aria-hidden="true">🏝️</p>
          <CardDescription>Expédition terminée</CardDescription>
          <CardTitle className="font-heading text-4xl font-black">Retour au port</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <p className="text-base text-muted-foreground">Vous avez officiellement rendu l'océan plus étrange.</p>
          <PlayerList game={game} session={session} />
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onLeave}>
            <RotateCcw data-icon="inline-start" /> Nouvelle partie
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}

function LoadingScreen() {
  return (
    <>
      <Brand />
      <Card className="my-auto">
        <CardHeader><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-64" /></CardHeader>
        <CardContent className="flex flex-col gap-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
      </Card>
    </>
  )
}

export default function App() {
  const { session, game, loading, error, enter, leave, hostAction } = useGame()
  const screen = useMemo(() => {
    if (!session) return <HomeScreen onEnter={enter} />
    if (loading || !game) return <LoadingScreen />
    if (game.status === "lobby") return <LobbyScreen game={game} session={session} onStart={() => hostAction("start").then(() => undefined)} />
    if (game.status === "running") return <GameScreen game={game} session={session} onAction={(action) => hostAction(action).then(() => undefined)} />
    return <EndScreen game={game} session={session} onLeave={leave} />
  }, [enter, game, hostAction, leave, loading, session])

  return (
    <OceanShell>
      {error && session && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Connexion perdue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {screen}
      <Toaster position="top-center" richColors />
    </OceanShell>
  )
}
