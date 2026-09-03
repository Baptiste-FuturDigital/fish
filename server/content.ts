import type { PromptKind } from "../shared/game.js"

export interface PromptDefinition {
  id: string
  kind: PromptKind
  kicker: string
  title: string
  instruction: string
  emoji: string
  targetCount: number | "all"
}

export const prompts: PromptDefinition[] = [
  {
    id: "fish-name",
    kind: "question",
    kicker: "Confession abyssale",
    title: "Ton nom de poisson louche ?",
    instruction:
      "Invente ton nom scientifique de créature marine et explique pourquoi les biologistes te craignent.",
    emoji: "🐡",
    targetCount: 1,
  },
  {
    id: "shrimp-duel",
    kind: "duel",
    kicker: "Duel de crustacés",
    title: "La guerre des crevettes",
    instruction:
      "Vous avez 20 secondes chacun pour vendre une crevette comme si c'était une voiture de luxe. Le banc choisit le meilleur vendeur.",
    emoji: "🦐",
    targetCount: 2,
  },
  {
    id: "suspect-vote",
    kind: "vote",
    kicker: "Conseil du récif",
    title: "Qui survivrait dans une épave ?",
    instruction:
      "À trois, tout le monde pointe la personne la plus susceptible de créer une civilisation dans une épave de bateau.",
    emoji: "⚓",
    targetCount: "all",
  },
  {
    id: "octopus-mime",
    kind: "mime",
    kicker: "Documentaire animalier",
    title: "Poulpe en entretien d'embauche",
    instruction:
      "Mime un poulpe qui tente de convaincre un recruteur que huit bras ne sont pas un problème d'organisation.",
    emoji: "🐙",
    targetCount: 1,
  },
  {
    id: "whale-message",
    kind: "action",
    kicker: "Communication inter-espèces",
    title: "Appel longue distance",
    instruction:
      "Envoie un message vocal de baleine à la personne de ton choix. Elle doit traduire ton message avec beaucoup de sérieux.",
    emoji: "🐋",
    targetCount: 2,
  },
  {
    id: "fish-trial",
    kind: "duel",
    kicker: "Tribunal sous-marin",
    title: "Le poisson rouge est innocent",
    instruction:
      "L'un accuse le poisson rouge d'avoir vidé l'aquarium, l'autre le défend. Plaidoirie de 20 secondes chacun.",
    emoji: "🐠",
    targetCount: 2,
  },
  {
    id: "ocean-conspiracy",
    kind: "question",
    kicker: "Théorie très sérieuse",
    title: "Ce que les dauphins nous cachent",
    instruction:
      "Révèle la véritable raison pour laquelle les dauphins sourient tout le temps. Aucun fait réel n'est autorisé.",
    emoji: "🐬",
    targetCount: 1,
  },
  {
    id: "crab-walk",
    kind: "action",
    kicker: "Migration annuelle",
    title: "Déplacement homologué crabe",
    instruction:
      "Traverse la pièce comme un crabe très pressé qui vient de rater son train. Le banc note l'élégance.",
    emoji: "🦀",
    targetCount: 1,
  },
  {
    id: "mermaid-vote",
    kind: "vote",
    kicker: "Élection municipale",
    title: "Maire de l'Atlantide",
    instruction:
      "Votez pour la personne qui ferait le meilleur maire de l'Atlantide. L'élu prononce un discours de 15 secondes.",
    emoji: "🧜",
    targetCount: "all",
  },
  {
    id: "jellyfish-dance",
    kind: "mime",
    kicker: "Chorégraphie toxique",
    title: "La danse de la méduse",
    instruction:
      "Invente une danse de méduse en trois mouvements. Tout le monde doit la reproduire immédiatement.",
    emoji: "🪼",
    targetCount: 1,
  },
  {
    id: "sardine-pitch",
    kind: "duel",
    kicker: "Startup du large",
    title: "Sardines as a Service",
    instruction:
      "Pitchez chacun une startup inutile liée aux sardines. Le groupe investit un milliard de coquillages dans la pire idée.",
    emoji: "🐟",
    targetCount: 2,
  },
  {
    id: "captain-order",
    kind: "action",
    kicker: "Mutinerie douce",
    title: "Ordre du capitaine",
    instruction:
      "Donne au groupe un ordre absurde mais inoffensif. Tout le monde doit l'exécuter avec une discipline militaire.",
    emoji: "🫡",
    targetCount: 1,
  },
]
