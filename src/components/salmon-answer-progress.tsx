import { CheckCircle2, CircleDashed } from "lucide-react"

import type { PlayerAnswerView, PlayerView } from "@shared/game"

interface SalmonAnswerProgressProps {
  players: readonly PlayerView[]
  answers: readonly PlayerAnswerView[]
}

export function SalmonAnswerProgress({ players, answers }: SalmonAnswerProgressProps) {
  const participatingPlayers = players.filter((player) => !player.isHost)
  const lockedPlayerIds = new Set(
    answers.filter((answer) => answer.locked).map((answer) => answer.playerId),
  )
  const lockedCount = participatingPlayers.filter((player) => lockedPlayerIds.has(player.id)).length
  const total = participatingPlayers.length
  const complete = total > 0 && lockedCount === total

  return (
    <section
      className="my-4 rounded-2xl border border-white/20 bg-white/10 p-4"
      data-complete={complete}
      aria-labelledby="salmon-answer-progress-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="salmon-answer-progress-title" className="text-sm font-black tracking-wide uppercase">
          Réponses des poissons
        </h2>
        <strong className="text-sm text-secondary" aria-live="polite">
          {complete ? "Tous les poissons ont répondu" : `${lockedCount} / ${total} poissons ont répondu`}
        </strong>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-label={`${lockedCount} poissons sur ${total} ont répondu`}
        aria-valuemin={0}
        aria-valuenow={lockedCount}
        aria-valuemax={total}
      >
        <span
          className="block h-full rounded-full bg-secondary transition-[width] duration-300"
          style={{ width: total > 0 ? `${(lockedCount / total) * 100}%` : "0%" }}
        />
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {participatingPlayers.map((player) => {
          const locked = lockedPlayerIds.has(player.id)
          return (
            <li className="flex min-w-0 items-center gap-2 text-sm" key={player.id}>
              {locked
                ? <CheckCircle2 className="size-4 shrink-0 text-secondary" aria-hidden="true" />
                : <CircleDashed className="size-4 shrink-0 text-white/55" aria-hidden="true" />}
              <span className="min-w-0 flex-1 truncate font-bold">{player.name}</span>
              <span className="text-xs text-white/65">{locked ? "Réponse verrouillée" : "En réflexion"}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
