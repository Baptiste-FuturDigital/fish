import { useEffect, useState, type FormEvent } from "react"
import { CheckCircle2, Eye, Flag, LoaderCircle, LockKeyhole, Play, Trophy } from "lucide-react"
import { toast } from "sonner"

import type { WeightEstimateRange } from "@shared/challenges/types"
import type { GameView, PlayerSession, TournamentView } from "@shared/game"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { ChallengeAudio } from "@/components/challenge-audio"
import { isHostAudioEnabled } from "@/components/challenge-audio-control"
import { SalmonAnswerProgress } from "@/components/salmon-answer-progress"
import { WhosThatSalmonStage } from "@/components/whos-that-salmon-stage"
import { formatWeightEstimate } from "@/components/weight-estimate"

interface ChallengeScreenProps {
  game: GameView
  session: PlayerSession
  onAdvance: () => Promise<GameView>
  onFinish: () => Promise<GameView>
  onSubmit: (answer: string, locked: boolean) => Promise<GameView>
}

function Countdown({ endsAt, durationSeconds }: { endsAt: string | null; durationSeconds: number }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])
  const milliseconds = endsAt ? Math.max(0, Date.parse(endsAt) - now) : 0
  const seconds = Math.ceil(milliseconds / 1_000)
  const percent = Math.min(100, (milliseconds / (durationSeconds * 1_000)) * 100)
  return (
    <div className="countdown" aria-live="polite">
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs font-black tracking-[0.15em] uppercase">Temps restant</span>
        <strong className="font-heading text-4xl leading-none tabular-nums">{seconds}s</strong>
      </div>
      <Progress value={percent} aria-label={`${seconds} secondes restantes`} />
    </div>
  )
}

function ScoreStrip({ game }: { game: GameView }) {
  return (
    <div className="score-strip" aria-label="Scores des bancs">
      {[...game.teams].sort((left, right) => right.score - left.score).map((team) => (
        <div className="score-pill" key={team.id}>
          <span>{team.name}</span>
          <strong>{team.score}</strong>
        </div>
      ))}
    </div>
  )
}

function TournamentHeader({ tournament }: { tournament: TournamentView }) {
  const progress = ((tournament.challengeIndex + (tournament.roundIndex + 1) / tournament.roundCount) / tournament.challengeCount) * 100
  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">ÉPREUVE {tournament.challengeIndex + 1} / {tournament.challengeCount}</Badge>
        <span className="text-sm font-black">Manche {tournament.roundIndex + 1} / {tournament.roundCount}</span>
      </div>
      <Progress value={progress} aria-label="Progression du tournoi" />
    </div>
  )
}

function WeightEstimateField({
  answer,
  range,
  onChange,
}: {
  answer: string
  range: WeightEstimateRange
  onChange: (answer: string) => void
}) {
  const value = answer ? Number(answer) : range.min

  return (
    <Field className="weight-estimate-field">
      <div className="weight-estimate-heading">
        <FieldLabel>Estimation du poids</FieldLabel>
        <output className="weight-estimate-value" aria-live="polite">
          {answer ? formatWeightEstimate(value, range.displayUnit) : "Glisse ton pouce"}
        </output>
      </div>
      <Slider
        className="weight-estimate-slider"
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        getAriaLabel={() => "Estimation du poids"}
        getAriaValueText={(_formattedValue, kilograms) => formatWeightEstimate(kilograms, range.displayUnit)}
        onValueChange={(values) => {
          const nextValue = Array.isArray(values) ? values[0] : values
          onChange(String(nextValue ?? range.min))
        }}
      />
      <div className="weight-estimate-limits" aria-hidden="true">
        <span>{formatWeightEstimate(range.min, range.displayUnit)}</span>
        <span>{formatWeightEstimate(range.max, range.displayUnit)}</span>
      </div>
    </Field>
  )
}

export function ChallengeScreen({ game, session, onAdvance, onFinish, onSubmit }: ChallengeScreenProps) {
  const tournament = game.tournament
  const [answer, setAnswer] = useState("")
  const [busy, setBusy] = useState<"advance" | "answer" | "finish" | null>(null)
  if (!tournament) return null
  const isHost = isHostAudioEnabled(session)
  const currentPlayer = game.players.find((player) => player.id === session.playerId)
  const teamId = currentPlayer?.teamId
  const teamAnswer = tournament.answers.find((entry) => entry.teamId === teamId)
  const isLocked = Boolean(teamAnswer?.locked)

  async function act(action: "advance" | "finish") {
    setBusy(action)
    try {
      if (action === "advance") await onAdvance()
      else await onFinish()
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Commande perdue en mer.")
    } finally {
      setBusy(null)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!answer || isLocked) return
    setBusy("answer")
    try {
      await onSubmit(answer, true)
      toast.success("Dernier mot enregistré.")
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Réponse perdue en mer.")
    } finally {
      setBusy(null)
    }
  }

  if (tournament.phase === "challenge-intro") {
    return (
      <>
        <TournamentHeader tournament={tournament} />
        <Card className="challenge-intro-card my-auto text-center">
          {tournament.challenge.presenterImageUrl ? (
            <img className="presenter-image" src={tournament.challenge.presenterImageUrl} alt="Georges Clownez, présentateur" />
          ) : <p className="challenge-emoji" aria-hidden="true">{tournament.challenge.emoji}</p>}
          <CardHeader>
            <CardDescription>PROCHAINE ÉPREUVE</CardDescription>
            <CardTitle>
              <h2 className="font-heading text-4xl font-black">{tournament.challenge.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-base leading-relaxed">{tournament.challenge.description}</p>
            <ul className="rules-list">
              {tournament.challenge.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
            {isHost ? (
              <ChallengeAudio
                videoId={tournament.challenge.introMusicYoutubeId}
                title={tournament.challenge.title}
                startSeconds={tournament.challenge.introMusicStartSeconds}
                endSeconds={tournament.challenge.introMusicEndSeconds}
              />
            ) : null}
          </CardContent>
          <CardFooter className="justify-center">
            {isHost ? (
              <Button size="lg" onClick={() => void act("advance")} disabled={Boolean(busy)}>
                {busy === "advance" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Play data-icon="inline-start" />}
                Lancer l'épreuve
              </Button>
            ) : <p className="text-sm font-bold">Poséithon prépare le chronomètre…</p>}
          </CardFooter>
        </Card>
        {isHost ? <Button className="mt-3" variant="ghost" onClick={() => void act("finish")}>Terminer le tournoi</Button> : null}
      </>
    )
  }

  return (
    <>
      <TournamentHeader tournament={tournament} />
      <ScoreStrip game={game} />
      {tournament.phase === "answering" ? (
        <>
          <Countdown endsAt={tournament.endsAt} durationSeconds={tournament.round.durationSeconds} />
          {tournament.challenge.id === "whos-dat-salmon" ? (
            <SalmonAnswerProgress teams={game.teams} answers={tournament.answers} />
          ) : null}
          <Card className="my-4">
            {tournament.round.imageUrl ? (
              tournament.round.id === "salmon-1-hippocampe" ? (
                <WhosThatSalmonStage
                  imageUrl={tournament.round.imageUrl}
                  imageAlt="L’hippocampe"
                  revealed={false}
                />
              ) : (
                <div className="challenge-image-wrap">
                  <img
                    className={cn("challenge-image", tournament.round.maskImage && "is-masked")}
                    src={tournament.round.imageUrl}
                    alt={tournament.round.maskImage ? "Silhouette mystérieuse" : tournament.round.question}
                  />
                  {tournament.round.maskImage ? <span className="mystery-mark" aria-hidden="true">?</span> : null}
                </div>
              )
            ) : null}
            <CardHeader className="text-center">
              <CardDescription>{tournament.round.kicker}</CardDescription>
              <CardTitle className="font-heading text-3xl font-black">{tournament.round.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {!teamId ? (
                <Alert>
                  <Trophy />
                  <AlertTitle>Maître du jeu · hors compétition</AlertTitle>
                  <AlertDescription>Cadre les réponses des bancs puis révèle la solution au bon moment.</AlertDescription>
                </Alert>
              ) : isLocked ? (
                <Alert>
                  <LockKeyhole />
                  <AlertTitle>Réponse verrouillée</AlertTitle>
                  <AlertDescription>Votre banc a donné son dernier mot.</AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={submit}>
                  <FieldGroup>
                    {tournament.round.kind === "number" ? (
                      <WeightEstimateField
                        answer={answer}
                        range={tournament.round.estimateRange!}
                        onChange={setAnswer}
                      />
                    ) : (
                      <Field>
                        <FieldLabel>Réponse de votre banc</FieldLabel>
                        <ToggleGroup
                          className="grid w-full grid-cols-1"
                          variant="outline"
                          value={answer ? [answer] : []}
                          onValueChange={(values) => setAnswer((values as string[])[0] ?? "")}
                        >
                          {tournament.round.choices?.map((choice, index) => (
                            <ToggleGroupItem className="h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left" value={choice.id} key={choice.id}>
                              <strong>{String.fromCharCode(65 + index)}</strong> — {choice.label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </Field>
                    )}
                    <Button size="lg" type="submit" disabled={!answer || Boolean(busy)}>
                      {busy === "answer" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
                      {tournament.challenge.confirmationLabel ?? "Valider la réponse"}
                    </Button>
                  </FieldGroup>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="my-4 overflow-hidden">
          {tournament.round.imageUrl ? (
            tournament.round.id === "salmon-1-hippocampe" ? (
              <WhosThatSalmonStage
                imageUrl={tournament.round.imageUrl}
                imageAlt={tournament.round.answerLabel ?? "L’hippocampe"}
                revealed
              />
            ) : (
              <div className="challenge-image-wrap"><img className="challenge-image" src={tournament.round.imageUrl} alt={tournament.round.answerLabel} /></div>
            )
          ) : null}
          <CardHeader className="text-center">
            <CardDescription>LA RÉPONSE ÉTAIT</CardDescription>
            <CardTitle className="font-heading text-3xl font-black">{tournament.round.answerLabel}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-center leading-relaxed">{tournament.round.fact}</p>
            <Separator />
            <div className="flex flex-col gap-2">
              {tournament.results.map((result) => {
                const team = game.teams.find((candidate) => candidate.id === result.teamId)
                return (
                  <div className="result-row" key={result.teamId}>
                    <span className="truncate font-bold">{team?.name}</span>
                    <span className="text-xs text-muted-foreground">{result.answer ?? "Pas de réponse"}</span>
                    <Badge variant={result.points > 0 ? "default" : "secondary"}>+{result.points}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isHost ? (
        <div className="host-controls">
          <Button size="lg" onClick={() => void act("advance")} disabled={Boolean(busy)}>
            {busy === "advance" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
            {tournament.phase === "answering"
              ? "Révéler maintenant"
              : tournament.roundIndex < tournament.roundCount - 1
                ? "Manche suivante"
                : tournament.challengeIndex < tournament.challengeCount - 1
                  ? "Voir le classement"
                  : "Voir les résultats"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => void act("finish")} disabled={Boolean(busy)}>
            {busy === "finish" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Flag data-icon="inline-start" />}
            Terminer le tournoi
          </Button>
        </div>
      ) : (
        <Alert className="mb-[env(safe-area-inset-bottom)]">
          <Trophy />
          <AlertTitle>Le maître du jeu garde le rythme</AlertTitle>
          <AlertDescription>L’écran changera automatiquement.</AlertDescription>
        </Alert>
      )}
    </>
  )
}
