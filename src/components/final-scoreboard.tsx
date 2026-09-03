import type { CSSProperties } from "react"
import { Crown, RotateCcw, Trophy } from "lucide-react"

import type { GameView } from "@shared/game"
import { AnimatedScore } from "@/components/animated-score"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

import "./final-scoreboard.css"

const CONFETTI = Array.from({ length: 28 }, (_, index) => ({
  id: `confetti-${index}`,
  left: `${(index * 37 + 7) % 101}%`,
  delay: `${-((index * 0.31) % 4.4)}s`,
  duration: `${3.6 + (index % 5) * 0.42}s`,
  color: ["#ffcd5d", "#ff6b61", "#a8eeff", "#d7f36b"][index % 4],
  drift: `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 4) * 9)}px`,
}))

const BUBBLES = Array.from({ length: 9 }, (_, index) => ({
  id: `bubble-${index}`,
  left: `${(index * 23 + 4) % 96}%`,
  size: `${10 + (index % 4) * 7}px`,
  delay: `${-(index * 0.73)}s`,
  duration: `${5.8 + (index % 3) * 1.4}s`,
}))

const FISH = [
  { id: "fish-1", glyph: "🐟", top: "12%", delay: "-1.4s", duration: "9s" },
  { id: "fish-2", glyph: "🐠", top: "44%", delay: "-5.2s", duration: "12s" },
  { id: "fish-3", glyph: "🐡", top: "76%", delay: "-3.3s", duration: "10.5s" },
] as const

type CelebrationStyle = CSSProperties & Record<`--${string}`, string>

function FinalCelebration() {
  return (
    <div
      className="final-celebration"
      data-testid="final-confetti"
      aria-hidden="true"
    >
      <div className="final-confetti-field">
        {CONFETTI.map((piece, index) => (
          <i
            className={`final-confetti-piece final-confetti-piece--${index % 3}`}
            key={piece.id}
            style={{
              "--confetti-left": piece.left,
              "--confetti-delay": piece.delay,
              "--confetti-duration": piece.duration,
              "--confetti-color": piece.color,
              "--confetti-drift": piece.drift,
            } as CelebrationStyle}
          />
        ))}
      </div>

      <div className="final-bubble-field">
        {BUBBLES.map((bubble) => (
          <i
            className="final-bubble"
            key={bubble.id}
            style={{
              "--final-bubble-left": bubble.left,
              "--final-bubble-size": bubble.size,
              "--final-bubble-delay": bubble.delay,
              "--final-bubble-duration": bubble.duration,
            } as CelebrationStyle}
          />
        ))}
      </div>

      <div className="final-fish-field">
        {FISH.map((fish) => (
          <span
            className="final-swimming-fish"
            key={fish.id}
            style={{
              "--final-fish-top": fish.top,
              "--final-fish-delay": fish.delay,
              "--final-fish-duration": fish.duration,
            } as CelebrationStyle}
          >
            {fish.glyph}
          </span>
        ))}
      </div>
    </div>
  )
}

export function FinalScoreboard({
  game,
  onLeave,
}: {
  game: GameView
  onLeave: () => void
}) {
  const ranking = [...game.teams].sort(
    (left, right) =>
      right.score - left.score || left.name.localeCompare(right.name),
  )
  const winner = ranking[0]

  return (
    <Card className="final-scoreboard my-auto">
      <FinalCelebration />

      <section className="final-poseithon" aria-label="Verdict de Poséithon">
        <img src="/poseithon.jpg" alt="Poséithon, dieu des océans" />
        <div className="final-poseithon-shade" />
        <div className="final-divine-seal">
          <Crown aria-hidden="true" />
        </div>
        <p className="final-poseithon-kicker">LE VERDICT DE POSÉITHON</p>
      </section>

      <header className="final-winner">
        <div className="final-winner-icon" aria-hidden="true">
          <Trophy />
        </div>
        <p>Le banc sacré champion des océans</p>
        <h1>{winner?.name ?? "Un banc mystérieux"}</h1>
        <div className="final-winner-score">
          <AnimatedScore points={winner?.score ?? 0} /> points divins
        </div>
        <p className="final-winner-message">
          Poséithon vous accorde sa faveur. Faites-en bon usage à la surface.
        </p>
      </header>

      <CardContent className="final-ranking">
        <div className="final-ranking-heading">
          <h2>Classement final</h2>
          <span>{ranking.length} bancs</span>
        </div>

        <ol>
          {ranking.map((team, index) => (
            <li
              className="final-ranking-row"
              data-rank={index + 1}
              key={team.id}
            >
              <span className="final-rank-number">
                {index === 0 ? <Crown aria-label="Champion" /> : index + 1}
              </span>
              <div className="final-team-avatars" aria-hidden="true">
                {team.memberIds.slice(0, 4).map((memberId) => {
                  const player = game.players.find(
                    (candidate) => candidate.id === memberId,
                  )

                  return (
                    <Avatar size="sm" key={memberId}>
                      {player?.totem ? (
                        <AvatarImage
                          src={player.totem.imageUrl}
                          alt={player.totem.name}
                        />
                      ) : null}
                      <AvatarFallback>🐟</AvatarFallback>
                    </Avatar>
                  )
                })}
              </div>
              <span className="final-team-name">{team.name}</span>
              <Badge variant={index === 0 ? "default" : "secondary"}>
                <AnimatedScore points={team.score} /> pts
              </Badge>
            </li>
          ))}
        </ol>
      </CardContent>

      <CardFooter className="final-footer">
        <Button size="lg" onClick={onLeave}>
          <RotateCcw data-icon="inline-start" /> Nouvelle partie
        </Button>
      </CardFooter>
    </Card>
  )
}
