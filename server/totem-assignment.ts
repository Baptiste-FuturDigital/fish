import type { TotemCategory, TotemDefinition } from "./totems.js"

const categories: readonly TotemCategory[] = ["ugly", "joli", "cool", "big"]

export function selectBalancedTotem(
  available: readonly TotemDefinition[],
  assignedCategories: readonly TotemCategory[],
  pickIndex: (length: number) => number,
): TotemDefinition {
  if (available.length === 0) throw new Error("Aucun totem disponible.")
  const counts = new Map<TotemCategory, number>(categories.map((category) => [category, 0]))
  for (const category of assignedCategories) {
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }
  const availableCategories = categories.filter((category) =>
    available.some((totem) => totem.category === category),
  )
  const minimum = Math.min(...availableCategories.map((category) => counts.get(category) ?? 0))
  const leastPopulated = availableCategories.filter((category) => counts.get(category) === minimum)
  const category = leastPopulated[pickIndex(leastPopulated.length)] ?? leastPopulated[0]
  const candidates = available.filter((totem) => totem.category === category)
  return candidates[pickIndex(candidates.length)] ?? candidates[0]
}
