import { leJustePoisson } from "./le-juste-poisson.js"
import { questionPourUnPoisson } from "./question-pour-un-poisson.js"
import { quiVeutGagnerDesPoissons } from "./qui-veut-gagner-des-poissons.js"
import { whosDatSalmon } from "./whos-dat-salmon.js"
import type { ChallengeDefinition, ChallengeId } from "./types.js"

export const challenges: readonly ChallengeDefinition[] = [
  leJustePoisson,
  questionPourUnPoisson,
  whosDatSalmon,
  quiVeutGagnerDesPoissons,
]

export function findChallenge(id: ChallengeId): ChallengeDefinition {
  const challenge = challenges.find((candidate) => candidate.id === id)
  if (!challenge) throw new Error(`Épreuve introuvable : ${id}`)
  return challenge
}
