import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  Anchor,
  ArrowRight,
  Copy,
  LoaderCircle,
  LogIn,
  Plus,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import type { GameView, PlayerSession } from "@shared/game"
import { gameApi } from "@/api"
import { useGame } from "@/hooks/use-game"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackgroundMusic } from "@/components/background-music"
import { isHostAudioEnabled } from "@/components/challenge-audio-control"
import { ChallengeScreen } from "@/components/challenge-screen"
import { FinalReveal } from "@/components/final-reveal"
import { HostSessionControls } from "@/components/host-session-controls"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { PlayerList } from "@/components/player-list"
import { PlayerIdentityPicker } from "@/components/player-identity-picker"
import { QuestionTimerAudio } from "@/components/question-timer-audio"
import { SalmonRoundAudio } from "@/components/salmon-round-audio"
import { SalmonDemoScreen } from "@/components/salmon-demo-screen"
import { TeamBoard } from "@/components/team-board"
import { TotemScan, type PlayerReveal } from "@/components/totem-scan"
import { ProjectorLaunchButton } from "@/projector/projector-launch-button"
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
    <header className="mb-6 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="brand-mark" aria-hidden="true">
          🐡
        </div>
        <div className="min-w-0">
          <p className="brand-kicker">L'AQUARIUM EN FOLIE</p>
          <p className="font-heading text-2xl leading-none font-black">Fish Tournament</p>
          <p className="mt-1 max-w-xs text-sm leading-snug text-muted-foreground">
            4 bancs de poissons s'affrontent à travers quatre épreuves consécutives légendaires.
          </p>
        </div>
      </div>
      <Badge
        variant="secondary"
        render={<a href="https://www.youtube.com/shorts/F3Rl8RRDq90" target="_blank" rel="noopener noreferrer" />}
      >
        Fish Party
      </Badge>
    </header>
  )
}

function HomeScreen({ onEnter }: { onEnter: (response: Awaited<ReturnType<typeof gameApi.create>>) => void }) {
  const initialCode = new URLSearchParams(window.location.search).get("code") ?? ""
  const [mode, setMode] = useState<HomeMode>(initialCode ? "join" : "choice")
  const [gameName, setGameName] = useState("L'aquarium de ce soir")
  const [hostName, setHostName] = useState("")
  const [prankPlayerName, setPrankPlayerName] = useState("")
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [playerIdentityId, setPlayerIdentityId] = useState("")
  const [playerNickname, setPlayerNickname] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoDemo = useRef(new URLSearchParams(window.location.search).get("demo") === "1")

  useEffect(() => {
    if (!autoDemo.current) return
    autoDemo.current = false
    window.history.replaceState({}, "", window.location.pathname)
    setBusy(true)
    gameApi.demo()
      .then(onEnter)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Démo impossible."))
      .finally(() => setBusy(false))
  }, [onEnter])

  async function launchDemo() {
    setBusy(true)
    setError(null)
    try {
      onEnter(await gameApi.demo())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Démo impossible.")
    } finally {
      setBusy(false)
    }
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onEnter(await gameApi.create(gameName, hostName, prankPlayerName))
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
      onEnter(await gameApi.join(code, {
        identityId: playerIdentityId,
        nickname: playerIdentityId === "anonymous" ? playerNickname : undefined,
      }))
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
        <h1 className="mt-4 max-w-md font-heading text-4xl leading-[0.95] font-black tracking-[-0.04em] text-balance sm:text-5xl">
          Quels poissons seront dignes de Poséithon ? 🔱
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          Merci de vous donner à fond marin et de ne pas crevette durant les épreuves. Les poissons victorieux seront récompensés d'une faveur divine.
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
            <Button size="lg" variant="outline" className="w-full text-white hover:text-white [&_svg]:text-white hover:[&_svg]:text-white" onClick={() => void launchDemo()} disabled={busy}>
              {busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Sparkles data-icon="inline-start" />}
              Lancer la démo
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
                <Field>
                  <FieldLabel htmlFor="prank-player-name">Pseudo à piéger</FieldLabel>
                  <Input
                    id="prank-player-name"
                    value={prankPlayerName}
                    maxLength={24}
                    onChange={(event) => setPrankPlayerName(event.target.value)}
                    autoComplete="off"
                    placeholder="Optionnel · pseudo exact"
                  />
                  <FieldDescription>Ce poisson recevra secrètement un totem spécial.</FieldDescription>
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
                <PlayerIdentityPicker
                  code={code}
                  identityId={playerIdentityId}
                  nickname={playerNickname}
                  onIdentityChange={(nextIdentityId) => {
                    setPlayerIdentityId(nextIdentityId)
                    if (nextIdentityId !== "anonymous") setPlayerNickname("")
                  }}
                  onNicknameChange={setPlayerNickname}
                />
                {error && <FieldError>{error}</FieldError>}
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="ghost" onClick={() => setMode("choice")}>Retour</Button>
            <Button
              form="join-game"
              type="submit"
              className="ml-auto"
              disabled={busy || !playerIdentityId || (playerIdentityId === "anonymous" && !playerNickname.trim())}
            >
              {busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}
              Plonger dans la partie
            </Button>
          </CardFooter>
        </Card>
      )}
      <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        <a
          className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          href="/prank/footer.png"
          target="_blank"
          rel="noreferrer"
        >
          Fabriqué dans les profondeurs · 🫧
        </a>
      </p>
    </>
  )
}

function GameHeader({ game }: { game: GameView }) {
  const title = game.status === "running" && game.tournament
    ? game.tournament.challenge.title
    : game.name
  return (
    <>
      <Brand />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">Aquarium actif</p>
          <h1 className="truncate font-heading text-2xl font-black" data-testid="game-context-title">{title}</h1>
        </div>
        <Badge variant="outline">#{game.code}</Badge>
      </div>
    </>
  )
}

function LobbyScreen({ game, session, onStart, onClaimTotem, onRenameTeam, onKickPlayer }: { game: GameView; session: PlayerSession; onStart: () => Promise<void>; onClaimTotem: () => Promise<GameView>; onRenameTeam: (teamId: string, name: string) => Promise<GameView>; onKickPlayer: (playerId: string) => Promise<GameView> }) {
  const [busy, setBusy] = useState(false)
  const isHost = Boolean(session.hostToken)
  const currentPlayer = game.players.find((player) => player.id === session.playerId)
  const currentTeam = game.teams.find((team) => team.id === currentPlayer?.teamId)
  const unassignedPlayers = game.players.filter((player) => !player.totem)

  function revealFor(gameState: GameView): PlayerReveal | null {
    const player = gameState.players.find((candidate) => candidate.id === session.playerId)
    if (!player?.totem || !player.teamId) return null
    const team = gameState.teams.find((candidate) => candidate.id === player.teamId)
    if (!team) return null
    return { name: player.name, imageUrl: player.imageUrl ?? player.totem.imageUrl, teamName: team.name }
  }

  async function claimCurrentTotem() {
    const nextGame = await onClaimTotem()
    const assigned = revealFor(nextGame)
    if (!assigned) throw new Error("Banc introuvable.")
    return assigned
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(game.code)
      toast.success("Code copié. Fais entrer le banc !")
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
      {isHost ? (
        <Alert className="host-orchestrator-card mb-4">
          <Anchor />
          <AlertTitle>Maître du jeu · hors compétition</AlertTitle>
          <AlertDescription>Tu gardes le rythme et les commandes ; seuls les invités rejoignent les bancs.</AlertDescription>
        </Alert>
      ) : (
        <TotemScan
          identity={currentPlayer?.totem && currentTeam
            ? { name: currentPlayer.name, imageUrl: currentPlayer.imageUrl ?? currentPlayer.totem.imageUrl, teamName: currentTeam.name }
            : null}
          onClaim={claimCurrentTotem}
        />
      )}
      <TeamBoard game={game} session={session} onRename={onRenameTeam} />
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>En attente du banc</CardTitle>
          <CardDescription>Partage ce code aux poissons présents.</CardDescription>
          <CardAction><Badge variant="secondary">LOBBY</Badge></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-4">
          <p data-testid="game-code" className="game-code">{game.code}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={copyCode}>
              <Copy data-icon="inline-start" /> Copier le code
            </Button>
            {isHost ? <ProjectorLaunchButton code={game.code} /> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{game.players.length} {game.players.length === 1 ? "poisson à bord" : "poissons à bord"}</CardTitle>
          <CardDescription>La liste se met à jour automatiquement.</CardDescription>
        </CardHeader>
        <CardContent><PlayerList game={game} session={session} onKick={onKickPlayer} /></CardContent>
      </Card>

      <div className="mt-auto pt-3">
        {isHost ? (
          <Button size="lg" className="w-full" onClick={start} disabled={busy || game.players.length < 2 || unassignedPlayers.length > 0}>
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
        {isHost && game.players.length >= 2 && unassignedPlayers.length > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            En attente de {unassignedPlayers.map((player) => player.name).join(", ")}.
          </p>
        )}
      </div>
    </>
  )
}

function GameScreen({ game, session, onAdvance, onFinish, onSubmit, onUseFiftyFifty, onBuzz, onResolveBuzz, onBonus }: { game: GameView; session: PlayerSession; onAdvance: () => Promise<GameView>; onFinish: () => Promise<GameView>; onSubmit: (answer: string, locked: boolean) => Promise<GameView>; onUseFiftyFifty: () => Promise<GameView>; onBuzz: () => Promise<GameView>; onResolveBuzz: (correct: boolean) => Promise<GameView>; onBonus: () => Promise<GameView> }) {
  const isSalmon = game.tournament?.challenge.id === "whos-dat-salmon"
  const questionAudio = game.tournament && game.tournament.challenge.id !== "question-pour-un-poisson" && !isSalmon ? (
    <QuestionTimerAudio
      enabled={isHostAudioEnabled(session)}
      phase={game.tournament.phase}
      roundId={game.tournament.round.id}
      endsAt={game.tournament.endsAt}
      timerVideoId={game.tournament.challenge.answeringMusicYoutubeId}
      endVideoId={game.tournament.challenge.timerEndSoundYoutubeId}
    />
  ) : null
  const salmonAudio = game.tournament && isSalmon ? (
    <SalmonRoundAudio
      enabled={isHostAudioEnabled(session) && game.tournament.phase !== "challenge-intro"}
      phase={game.tournament.phase}
      roundId={game.tournament.round.id}
      backgroundVideoId={game.tournament.challenge.answeringMusicYoutubeId}
      cueVideoId={game.tournament.challenge.introMusicYoutubeId}
    />
  ) : null
  if (game.tournament?.phase === "leaderboard") {
    return (
      <>
        {questionAudio}
        {salmonAudio}
        <GameHeader game={game} />
        <LeaderboardScreen game={game} session={session} onAdvance={onAdvance} onFinish={onFinish} onBonus={onBonus} />
      </>
    )
  }
  return (
    <>
      {questionAudio}
      {salmonAudio}
      <GameHeader game={game} />
      <ChallengeScreen
        key={`${game.tournament?.challenge.id}-${game.tournament?.round.id}-${game.tournament?.phase}`}
        game={game}
        session={session}
        onAdvance={onAdvance}
        onFinish={onFinish}
        onSubmit={onSubmit}
        onUseFiftyFifty={onUseFiftyFifty}
        onBuzz={onBuzz}
        onResolveBuzz={onResolveBuzz}
      />
    </>
  )
}

function EndScreen({ game, session, onLeave }: { game: GameView; session: PlayerSession; onLeave: () => void }) {
  return <FinalReveal game={game} onLeave={onLeave} audioEnabled={isHostAudioEnabled(session)} />
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
  const { session, game, loading, error, enter, leave, hostAction, claimTotem, renameTeam, kickPlayer, submitAnswer, useFiftyFifty, buzz, resolveBuzz, applyBonus, skipChallenge } = useGame()
  const isSalmonDemo = new URLSearchParams(window.location.search).get("salmon-demo") === "1"
  const audioEnabled = isSalmonDemo || (session ? isHostAudioEnabled(session) : false)
  const screen = useMemo(() => {
    if (isSalmonDemo) return <SalmonDemoScreen />
    if (!session) return <HomeScreen onEnter={enter} />
    if (loading || !game) return <LoadingScreen />
    if (game.status === "lobby") return <LobbyScreen game={game} session={session} onStart={() => hostAction("start").then(() => undefined)} onClaimTotem={claimTotem} onRenameTeam={renameTeam} onKickPlayer={kickPlayer} />
    if (game.status === "running") return <GameScreen game={game} session={session} onAdvance={() => hostAction("advance")} onFinish={() => hostAction("finish")} onSubmit={submitAnswer} onUseFiftyFifty={useFiftyFifty} onBuzz={buzz} onResolveBuzz={resolveBuzz} onBonus={applyBonus} />
    return <EndScreen game={game} session={session} onLeave={leave} />
  }, [applyBonus, buzz, claimTotem, enter, game, hostAction, isSalmonDemo, kickPlayer, leave, loading, renameTeam, resolveBuzz, session, submitAnswer, useFiftyFifty])

  return (
    <OceanShell>
      {audioEnabled ? <BackgroundMusic /> : null}
      {error && session && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Connexion perdue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {session?.hostToken && game && game.status !== "finished" ? (
        <HostSessionControls
          status={game.status}
          isDemo={game.isDemo}
          canSkipChallenge={Boolean(
            game.tournament &&
            game.tournament.challengeIndex < game.tournament.challengeCount - 1
          )}
          onFinish={() => hostAction("finish")}
          onLeave={leave}
          onSkipChallenge={skipChallenge}
        />
      ) : null}
      {screen}
      <Toaster position="top-center" richColors />
    </OceanShell>
  )
}
