import { useState, type FormEvent } from "react"
import { Gift, LoaderCircle, MailCheck, Waves } from "lucide-react"

import type {
  GameView,
  PlayerSession,
  PrizeClaimResult,
  PrizeType,
} from "@shared/game"
import { gameApi } from "@/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const PRIZE_CONTENT: Record<PrizeType, {
  emoji: string
  title: string
  description: string
}> = {
  "best-player": {
    emoji: "👑",
    title: "Champion individuel",
    description: "Le meilleur poisson repart explorer Aquatis.",
  },
  "worst-player": {
    emoji: "🍤",
    title: "Poisson pané",
    description: "Même les profondeurs ont besoin d’un dernier. Ton lot consolation t’attend.",
  },
  "winning-team": {
    emoji: "🏆",
    title: "Banc champion",
    description: "La faveur collective de Poséithon arrive dans ta boîte mail.",
  },
}

const frenchNameCollator = new Intl.Collator("fr", {
  sensitivity: "base",
  usage: "sort",
})

function compareScoreThenIdentity(
  left: { id: string; name: string; score: number },
  right: { id: string; name: string; score: number },
) {
  return right.score - left.score
    || frenchNameCollator.compare(left.name, right.name)
    || left.id.localeCompare(right.id)
}

export type PrizeClaim = (
  prizeType: PrizeType,
  email: string,
) => Promise<PrizeClaimResult>

export function isValidPrizeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function eligiblePrizeTypes(game: GameView, playerId: string): PrizeType[] {
  if (game.status !== "finished") return []
  const currentPlayer = game.players.find((player) => player.id === playerId && !player.isHost)
  if (!currentPlayer) return []

  const players = game.players
    .filter((player) => !player.isHost)
    .sort(compareScoreThenIdentity)
  const teams = [...game.teams].sort(compareScoreThenIdentity)
  if (players.length === 0 || teams.length === 0) return []

  const prizes: PrizeType[] = []
  if (players[0]?.id === currentPlayer.id) prizes.push("best-player")
  if (players.at(-1)?.id === currentPlayer.id) prizes.push("worst-player")
  if (teams[0]?.id === currentPlayer.teamId) prizes.push("winning-team")
  return prizes
}

export function PrizeClaimCard({
  prizeType,
  onClaim,
  result: initialResult = null,
  initialError = null,
}: {
  prizeType: PrizeType
  onClaim: PrizeClaim
  result?: PrizeClaimResult | null
  initialError?: string | null
}) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [result, setResult] = useState<PrizeClaimResult | null>(initialResult)
  const content = PRIZE_CONTENT[prizeType]
  const formId = `prize-claim-${prizeType}`
  const emailId = `prize-email-${prizeType}`

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!isValidPrizeEmail(normalizedEmail)) {
      setError("Entre une adresse email valide.")
      return
    }
    setPending(true)
    setError(null)
    try {
      setResult(await onClaim(prizeType, normalizedEmail))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La mouette postale est indisponible.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="prize-claim-card" data-prize={prizeType} size="sm">
      <CardHeader>
        <CardTitle><span aria-hidden="true">{content.emoji}</span> {content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>

      {result ? (
        <CardContent>
          <Alert className="prize-claim-success">
            <MailCheck aria-hidden="true" />
            <AlertTitle>Prix envoyé</AlertTitle>
            <AlertDescription>
              {result.alreadySent
                ? "Cette faveur avait déjà pris le large vers ta boîte mail."
                : "Surveille ta boîte mail, y compris les courants indésirables."}
            </AlertDescription>
          </Alert>
        </CardContent>
      ) : (
        <>
          <CardContent>
            <form id={formId} onSubmit={submit}>
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor={emailId}>Adresse email du gagnant</FieldLabel>
                <Input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="poisson@ocean.fr"
                  value={email}
                  required
                  aria-invalid={Boolean(error) || undefined}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) setError(null)
                  }}
                />
                <FieldDescription>Utilisée uniquement pour livrer ce prix.</FieldDescription>
              </Field>
              {error ? (
                <Alert variant="destructive" className="mt-3">
                  <Waves aria-hidden="true" />
                  <AlertTitle>Envoi échoué</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </form>
          </CardContent>
          <CardFooter>
            <Button
              form={formId}
              type="submit"
              className="w-full"
              disabled={pending || !isValidPrizeEmail(email)}
            >
              {pending
                ? <LoaderCircle className="animate-spin" data-icon="inline-start" />
                : <Gift data-icon="inline-start" />}
              {pending ? "Envoi par les courants…" : error ? "Réessayer l’envoi" : "Recevoir mon prix"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}

export function PrizeClaims({
  game,
  session,
  onClaim,
}: {
  game: GameView
  session: PlayerSession | null
  onClaim?: PrizeClaim
}) {
  if (!session || session.hostToken) return null
  const prizeTypes = eligiblePrizeTypes(game, session.playerId)
  if (prizeTypes.length === 0) return null
  const claim = onClaim ?? ((prizeType: PrizeType, email: string) =>
    gameApi.claimPrize(
      session.gameCode,
      prizeType,
      session.playerId,
      session.playerToken,
      email,
    ))

  return (
    <section className="prize-claims" aria-labelledby="prize-claims-title">
      <header className="prize-claims-heading">
        <span aria-hidden="true">🎁</span>
        <div>
          <p>TRÉSOR DES ABYSSES</p>
          <h2 id="prize-claims-title">Réclame tes prix</h2>
        </div>
      </header>
      <div className="prize-claims-grid">
        {prizeTypes.map((prizeType) => (
          <PrizeClaimCard key={prizeType} prizeType={prizeType} onClaim={claim} />
        ))}
      </div>
    </section>
  )
}
