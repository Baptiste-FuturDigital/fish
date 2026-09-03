import { LoaderCircle, Sparkles, Waves } from "lucide-react"

import type { PoseithonBonusView } from "@shared/game"
import { AnimatedScore } from "./animated-score.js"
import { Button } from "./ui/button.js"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card.js"

interface PoseithonBonusProps {
  isHost: boolean
  available: boolean
  pending: boolean
  bonus: PoseithonBonusView | null
  onApply: () => void
}

export function PoseithonBonus({ isHost, available, pending, bonus, onApply }: PoseithonBonusProps) {
  return (
    <Card className="overflow-hidden border-secondary/60 bg-card shadow-xl">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Waves aria-hidden="true" /> RÈGLE BONUS
        </CardDescription>
        <CardTitle className="font-heading text-2xl font-black">Marée de Poséithon</CardTitle>
      </CardHeader>
      <CardContent>
        {bonus ? (
          <p className="text-sm leading-relaxed" role="status" aria-live="polite">
            🌊 Le banc <strong>{bonus.teamName}</strong> reçoit une faveur divine de{" "}
            <strong><AnimatedScore points={bonus.points} prefix="+" /></strong>.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Poséithon peut offrir <strong className="text-foreground">+20 points</strong> au banc dernier pour relancer la course.
          </p>
        )}
      </CardContent>
      {isHost && available && !bonus ? (
        <CardFooter>
          <Button className="w-full" size="lg" variant="secondary" onClick={onApply} disabled={pending}>
            {pending
              ? <LoaderCircle className="animate-spin" data-icon="inline-start" />
              : <Sparkles data-icon="inline-start" />}
            Déchaîner la faveur
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
