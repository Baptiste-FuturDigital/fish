import type { WeightDisplayUnit } from "@shared/challenges/types"

const displayFactor: Record<WeightDisplayUnit, number> = {
  g: 1_000,
  kg: 1,
  t: 0.001,
}

const formatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 3,
})

export function formatWeightEstimate(kilograms: number, unit: WeightDisplayUnit) {
  return `${formatter.format(kilograms * displayFactor[unit])} ${unit}`
}
