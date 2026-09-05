export interface RankablePlayer {
  id: string
  name: string
  score: number
}

export function comparePlayerRanking(left: RankablePlayer, right: RankablePlayer): number {
  return right.score - left.score
    || left.name.localeCompare(right.name, "fr")
    || left.id.localeCompare(right.id)
}
