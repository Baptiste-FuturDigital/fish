import type { TotemView } from "../shared/game.js"

export type TotemCategory = "big" | "cool" | "joli" | "ugly"

export interface TotemDefinition extends TotemView {
  id: number
  category: TotemCategory
}

export const teams: Record<TotemCategory, string> = {
  ugly: "Les Abyssaux",
  joli: "Les Coralliens",
  cool: "Les Électriques",
  big: "Les Colosses",
}

export const teamIds: Record<TotemCategory, string> = {
  ugly: "abyssaux",
  joli: "coralliens",
  cool: "electriques",
  big: "colosses",
}

export const teamDefinitions = (Object.keys(teams) as TotemCategory[]).map((category) => ({
  id: teamIds[category],
  category,
  name: teams[category],
}))

function totem(id: number, category: TotemCategory, name: string, fact: string): TotemDefinition {
  return {
    id,
    category,
    name,
    fact,
    teamName: teams[category],
    imageUrl: `/totems/totem-${String(id).padStart(2, "0")}.jpg`,
  }
}

export const totems: TotemDefinition[] = [
  totem(1, "ugly", "le blobfish", "Dans les abysses, la pression lui donne une allure bien plus digne que sur les photos prises en surface."),
  totem(2, "ugly", "le poisson chauve-souris", "Très mauvais nageur, il préfère marcher sur le fond avec ses nageoires transformées en petites pattes."),
  totem(3, "ugly", "le steak de thon", "Le thon peut maintenir certains muscles plus chauds que l'eau pour nager vite. Toi, tu as déjà été cuit."),
  totem(4, "ugly", "le poisson-grenouille poilu", "Son leurre intégré ressemble à une canne à pêche et attire ses proies directement devant sa bouche."),
  totem(5, "ugly", "le labre à tête de mouton", "Ce poisson peut changer de sexe au cours de sa vie et développe une bosse frontale spectaculaire."),
  totem(6, "joli", "le néon bleu", "Sa bande bleue est iridescente : elle change d'éclat selon la lumière et l'angle de vue."),
  totem(7, "joli", "le scalaire", "Son corps haut et plat lui permet de se faufiler entre les plantes sans perdre son élégance."),
  totem(8, "joli", "le poisson-vache", "Sous ses airs mignons, il porte une véritable armure de plaques osseuses et deux cornes."),
  totem(9, "joli", "le poisson-perroquet", "Son bec râpe le corail et contribue à fabriquer une partie du sable des plages tropicales."),
  totem(10, "joli", "le poisson-mandarin", "Il n'a presque pas d'écailles : un mucus protecteur recouvre sa peau aux couleurs psychédéliques."),
  totem(11, "cool", "la pieuvre", "Elle possède trois cœurs, du sang bleu et des neurones jusque dans ses bras."),
  totem(12, "cool", "le béluga", "Surnommé le canari des mers, il produit un incroyable répertoire de sifflements et de clics."),
  totem(13, "cool", "la crevette-mante", "Son coup de poing est si rapide qu'il crée dans l'eau une bulle de cavitation lumineuse."),
  totem(14, "cool", "la raie manta", "Les motifs sous son ventre sont uniques, comme une empreinte digitale géante."),
  totem(15, "cool", "la tortue marine", "Elle utilise le champ magnétique terrestre comme une carte pour retrouver sa plage de naissance."),
  totem(16, "big", "le requin-baleine", "C'est le plus grand poisson du monde, mais il se nourrit surtout de plancton en filtrant l'eau."),
  totem(17, "big", "la baleine bleue", "Son cœur peut peser autant qu'une petite voiture et ses appels traversent des centaines de kilomètres."),
  totem(18, "big", "l'orque", "Chaque groupe possède ses propres techniques de chasse et des dialectes transmis entre générations."),
  totem(19, "big", "le morse", "Ses défenses sont des canines géantes qui l'aident à se hisser sur la glace."),
  totem(20, "big", "le kraken", "Cette légende de marins a probablement été nourrie par de rares rencontres avec des calmars géants."),
]

export function findTotem(id: number | null): TotemDefinition | null {
  return id === null ? null : (totems.find((candidate) => candidate.id === id) ?? null)
}

export function prankTotem(base: TotemDefinition): TotemDefinition {
  return {
    ...base,
    name: "l’axolotl glamour",
    fact: "Mutation abyssale rarissime : barbe, branchies et rouge à lèvres résistent ensemble à la pression.",
    imageUrl: "/totems/prank-axolotl-glamour.webp",
  }
}
