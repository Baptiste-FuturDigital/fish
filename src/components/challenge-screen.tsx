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
import { AnimatedScore } from "@/components/animated-score"
import { AnswerValidationSound, requestAnswerValidationSound } from "@/components/answer-validation-sound"
import { MillionaireAnswerPanel } from "@/components/millionaire-answer-panel"
import { SalmonAnswerProgress } from "@/components/salmon-answer-progress"
import { ScoreRevealSound } from "@/components/score-reveal-sound"
import { WhosThatSalmonStage } from "@/components/whos-that-salmon-stage"
import { QuestionBuzzerScreen } from "@/components/question-buzzer-screen"
import { formatWeightEstimate } from "@/components/weight-estimate"

interface ChallengeScreenProps {
  game: GameView
  session: PlayerSession
  onAdvance: () => Promise<GameView>
  onFinish: () => Promise<GameView>
  onSubmit: (answer: string, locked: boolean) => Promise<GameView>
  onUseFiftyFifty: () => Promise<GameView>
  onBuzz: () => Promise<GameView>
  onToggleQuestionTimer: () => Promise<GameView>
  onResolveBuzz: (correct: boolean) => Promise<GameView>
}

const CHALLENGE_INTRO_LABELS = [
  "PREMIÈRE ÉPREUVE",
  "DEUXIÈME ÉPREUVE",
  "TROISIÈME ÉPREUVE",
  "QUATRIÈME ÉPREUVE",
] as const

const RULE_EMOJIS = ["🐋", "🐢", "🐙", "🦈", "🐠", "🐡", "🦀"] as const
const QUESTION_CHAMPION_EMOJIS = ["🐋", "🐢", "🐙", "🦈", "🐠"] as const

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
          <strong><AnimatedScore points={team.score} /></strong>
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
        <span className="round-counter">Manche {tournament.roundIndex + 1} / {tournament.roundCount}</span>
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

export function ChallengeScreen({ game, session, onAdvance, onFinish, onSubmit, onUseFiftyFifty, onBuzz, onToggleQuestionTimer, onResolveBuzz }: ChallengeScreenProps) {
  const tournament = game.tournament
  const [answer, setAnswer] = useState("")
  const [busy, setBusy] = useState<"advance" | "answer" | "joker" | "finish" | null>(null)
  if (!tournament) return null
  const isHost = Boolean(session.hostToken)
  const isMillionaire = tournament.challenge.id === "qui-veut-gagner-des-poissons"
  const currentPlayer = game.players.find((player) => player.id === session.playerId)
  const teamId = currentPlayer?.teamId
  const playerAnswer = tournament.answers.find((entry) => entry.playerId === session.playerId)
  const isLocked = Boolean(playerAnswer?.locked)
  const playerResult = tournament.results.find((result) => result.playerId === session.playerId)
  const millionaireAnswer = tournament.phase === "reveal"
    ? String(playerAnswer?.answer ?? answer)
    : answer
  const highestAward = Math.max(0, ...tournament.results.map((result) => result.points))
  const teamJoker = tournament.fiftyFiftyJokers.find((entry) => entry.teamId === teamId)
  const currentKeptChoiceIds = teamJoker?.roundIndex === tournament.roundIndex
    ? teamJoker.keptChoiceIds
    : null

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
    requestAnswerValidationSound()
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

  async function useFiftyFifty() {
    setBusy("joker")
    try {
      await onUseFiftyFifty()
      toast.success("Deux mauvaises réponses coulent à pic.")
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Le joker s'est noyé.")
    } finally {
      setBusy(null)
    }
  }

  if (tournament.phase === "challenge-intro") {
    return (
      <>
        <TournamentHeader tournament={tournament} />
        <Card className={cn(
          "challenge-intro-card my-auto text-center",
          tournament.challenge.id === "qui-veut-gagner-des-poissons" && "millionaire-intro-card",
          tournament.challenge.id === "question-pour-un-poisson" && "question-champion-intro-card",
        )}>
          {tournament.challenge.introImageUrl ? (
            <img
              className="challenge-intro-image"
              src={tournament.challenge.introImageUrl}
              alt={`Présentation de ${tournament.challenge.title}`}
            />
          ) : tournament.challenge.id === "question-pour-un-poisson" ? (
            <div className="question-champion-hero">
              <img className="question-champion-reference" src="/references/questions-pour-un-poisson.jpg" alt="" />
              <div className="question-champion-logo" aria-hidden="true">
                <span>Question</span>
                <small>pour un</small>
                <strong>poisson</strong>
              </div>
              <div className="question-champion-fish" aria-hidden="true">
                {QUESTION_CHAMPION_EMOJIS.map((emoji) => <span key={emoji}>{emoji}</span>)}
              </div>
            </div>
          ) : tournament.challenge.presenterImageUrl ? (
            <img className="presenter-image" src={tournament.challenge.presenterImageUrl} alt="Jean-Pierre Foucault requin, présentateur" />
          ) : <p className="challenge-emoji" aria-hidden="true">{tournament.challenge.emoji}</p>}
          <CardHeader>
            <CardDescription>{CHALLENGE_INTRO_LABELS[tournament.challengeIndex] ?? `ÉPREUVE ${tournament.challengeIndex + 1}`}</CardDescription>
            <CardTitle>
              <h2 className="font-heading text-4xl font-black">{tournament.challenge.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-base leading-relaxed">{tournament.challenge.description}</p>
            <ul className="rules-list">
              {tournament.challenge.rules.map((rule, index) => (
                <li key={rule}>
                  <span className="rule-emoji" aria-hidden="true">{RULE_EMOJIS[index % RULE_EMOJIS.length]}</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
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
        {isHost ? <Button className="finish-tournament-button mt-3" variant="ghost" onClick={() => void act("finish")}>Terminer le tournoi</Button> : null}
      </>
    )
  }

  if (tournament.challenge.id === "question-pour-un-poisson" && tournament.phase === "answering") {
    return (
      <>
        <TournamentHeader tournament={tournament} />
        <ScoreStrip game={game} />
        <QuestionBuzzerScreen
          game={game}
          session={session}
          isHost={isHost}
          onBuzz={onBuzz}
          onToggleTimer={onToggleQuestionTimer}
          onResolve={onResolveBuzz}
        />
        {isHost ? <Button className="finish-tournament-button mt-3" variant="ghost" onClick={() => void act("finish")}>Terminer le tournoi</Button> : null}
      </>
    )
  }

  return (
    <>
      <AnswerValidationSound enabled={!isHost && Boolean(teamId) && tournament.challenge.id !== "question-pour-un-poisson"} />
      <ScoreRevealSound
        enabled={isHost && tournament.phase === "reveal" && !tournament.challenge.timerEndSoundYoutubeId}
        points={highestAward}
        roundId={tournament.round.id}
      />
      <TournamentHeader tournament={tournament} />
      <ScoreStrip game={game} />
      {tournament.phase === "answering" ? (
        <>
          <Countdown endsAt={tournament.endsAt} durationSeconds={tournament.round.durationSeconds} />
          {tournament.challenge.id === "whos-dat-salmon" ? (
            <SalmonAnswerProgress players={game.players} answers={tournament.answers} />
          ) : null}
          <Card className={cn(
            "my-4",
            tournament.challenge.id === "qui-veut-gagner-des-poissons" && "millionaire-stage-card",
            tournament.challenge.id === "whos-dat-salmon" && "salmon-game-card",
          )}>
            {tournament.round.imageUrl ? (
              tournament.challenge.id === "whos-dat-salmon" ? (
                <WhosThatSalmonStage
                  imageUrl={tournament.round.imageUrl}
                  imageAlt="Silhouette marine mystérieuse"
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
            <CardHeader className={cn("text-center", tournament.challenge.id === "qui-veut-gagner-des-poissons" && "millionaire-question-shell")}>
              <CardDescription>{tournament.round.kicker}</CardDescription>
              <CardTitle className="font-heading text-3xl font-black">{tournament.round.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {!teamId ? (
                <Alert>
                  <Trophy />
                  <AlertTitle>Maître du jeu · hors compétition</AlertTitle>
                  <AlertDescription>Cadre les réponses des poissons puis révèle la solution au bon moment.</AlertDescription>
                </Alert>
              ) : isLocked && !isMillionaire ? (
                <Alert>
                  <LockKeyhole />
                  <AlertTitle>Réponse verrouillée</AlertTitle>
                  <AlertDescription>Ton dernier mot est enregistré. Tes coéquipiers jouent encore.</AlertDescription>
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
                    ) : tournament.challenge.id === "qui-veut-gagner-des-poissons" ? (
                      <MillionaireAnswerPanel
                        choices={tournament.round.choices ?? []}
                        value={millionaireAnswer}
                        confirmationLabel={tournament.challenge.confirmationLabel ?? "C’est mon dernier mot"}
                        busy={busy === "answer"}
                        locked={isLocked}
                        verdict={null}
                        joker={{
                          available: !teamJoker,
                          keptChoiceIds: currentKeptChoiceIds,
                        }}
                        jokerBusy={busy === "joker"}
                        onUseFiftyFifty={() => void useFiftyFifty()}
                        onValueChange={setAnswer}
                      />
                    ) : (
                      <Field>
                        <FieldLabel>Ta réponse</FieldLabel>
                        <ToggleGroup
                          className={cn(
                            "grid w-full grid-cols-1",
                            tournament.challenge.id === "whos-dat-salmon" && "salmon-choice-grid",
                          )}
                          variant="outline"
                          value={answer ? [answer] : []}
                          onValueChange={(values) => setAnswer((values as string[])[0] ?? "")}
                        >
                          {tournament.round.choices?.map((choice, index) => (
                            <ToggleGroupItem
                              className={cn(
                                "h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left",
                                tournament.challenge.id === "whos-dat-salmon" && "salmon-choice-card",
                              )}
                              value={choice.id}
                              key={choice.id}
                            >
                              <strong>{String.fromCharCode(65 + index)}</strong><span>— {choice.label}</span>
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </Field>
                    )}
                    {tournament.challenge.id !== "qui-veut-gagner-des-poissons" ? (
                      <Button size="lg" type="submit" disabled={!answer || Boolean(busy)}>
                        {busy === "answer" ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
                        {tournament.challenge.confirmationLabel ?? "Valider la réponse"}
                      </Button>
                    ) : null}
                  </FieldGroup>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      ) : isMillionaire && teamId ? (
        <Card className="millionaire-stage-card my-4">
          <CardHeader className="millionaire-question-shell text-center">
            <CardDescription>{tournament.round.kicker}</CardDescription>
            <CardTitle className="font-heading text-3xl font-black">{tournament.round.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <MillionaireAnswerPanel
              choices={tournament.round.choices ?? []}
              value={millionaireAnswer}
              confirmationLabel={tournament.challenge.confirmationLabel ?? "C’est mon dernier mot"}
              busy={false}
              locked
              verdict={playerResult ? (playerResult.isCorrect ? "correct" : "wrong") : null}
              joker={{ available: !teamJoker, keptChoiceIds: currentKeptChoiceIds }}
              jokerBusy={false}
              onUseFiftyFifty={() => undefined}
              onValueChange={() => undefined}
            />
            {tournament.round.fact ? <p className="mt-4 text-center leading-relaxed">{tournament.round.fact}</p> : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="my-4 overflow-hidden">
          {tournament.round.imageUrl ? (
            tournament.challenge.id === "whos-dat-salmon" ? (
              <WhosThatSalmonStage
                imageUrl={tournament.round.imageUrl}
                imageAlt={tournament.round.answerLabel ?? "L’hippocampe"}
                revealed
                playerResult={!isHost && playerResult
                  ? { isCorrect: playerResult.isCorrect, points: playerResult.points }
                  : undefined}
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
                const player = game.players.find((candidate) => candidate.id === result.playerId)
                const team = game.teams.find((candidate) => candidate.id === result.teamId)
                return (
                  <div className="result-row" key={result.playerId}>
                    <span className="truncate font-bold">{player?.name ?? result.playerName}</span>
                    <span className="text-xs text-muted-foreground">{result.answer ?? "Pas de réponse"}</span>
                    <Badge variant={result.points > 0 ? "default" : "secondary"}>
                      <AnimatedScore points={result.points} prefix="+" />
                    </Badge>
                    <span className="sr-only">{team?.name}</span>
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
              ? tournament.challenge.id === "whos-dat-salmon" ? "Révéler la réponse" : "Révéler maintenant"
              : tournament.roundIndex < tournament.roundCount - 1
                ? tournament.challenge.id === "whos-dat-salmon" ? "Image suivante" : "Manche suivante"
                : tournament.challengeIndex < tournament.challengeCount - 1
                  ? "Voir le classement"
                  : "Voir les résultats"}
          </Button>
          <Button className="finish-tournament-button" size="lg" variant="outline" onClick={() => void act("finish")} disabled={Boolean(busy)}>
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
