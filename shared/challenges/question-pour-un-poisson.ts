import type { ChallengeDefinition } from "./types.js"

const buzzerRound = (
  id: string,
  kicker: string,
  answerLabel: string,
  correctAnswer: string,
  imageUrl: string,
  hostClues: readonly [string, string, string, string],
  fact: string,
  sourceUrl: string,
) => ({
  id,
  kicker,
  question: "Quel animal marin se cache derrière ces indices ?",
  durationSeconds: 40,
  kind: "buzzer" as const,
  hostClues,
  correctAnswer,
  answerLabel,
  fact,
  imageUrl,
  sourceUrl,
})

export const questionPourUnPoisson = {
  id: "question-pour-un-poisson",
  title: "Question pour un poisson",
  shortTitle: "Question pour un poisson",
  emoji: "🐠",
  introImageUrl: "/game/Question pour un poisson/question-pour-un-poisson.png",
  description: "Cinq animaux à identifier : Poséithon lit des indices de plus en plus précis, le premier banc qui buzze prend la parole.",
  rules: [
    "Un membre buzze pour tout son banc et bloque immédiatement le chrono.",
    "Une erreur interdit temporairement ce banc, jusqu’à la tentative d’un autre banc.",
    "Plus vous trouvez tôt, plus vous marquez : 40, 30, 20 ou 10 points.",
  ],
  introMusicYoutubeId: "Zcl98Bguq7k",
  scoring: { kind: "buzzer-countdown", points: [4, 3, 2, 1] },
  rounds: [
    buzzerRound("buzzer-hippocampe", "Animal 1 · Grossesse renversée", "L’hippocampe", "hippocampe", "/game/Le juste poisson/poids-hippocampe.avif", [
      "Mon genre appartient à une famille de poissons osseux dont la locomotion est peu performante et la posture inhabituelle.",
      "Je possède une armure de plaques dermiques, une petite nageoire dorsale et une queue capable de s’agripper.",
      "Chez moi, la femelle confie ses œufs au mâle, qui les incube dans une poche ventrale.",
      "Ma tête rappelle celle d’un cheval et je nage debout.",
    ], "Le mâle porte les embryons dans une poche incubatrice puis expulse les petits lors de la mise bas.", "https://oceanservice.noaa.gov/facts/seahorse.html"),
    buzzerRound("buzzer-poulpe", "Animal 2 · Intelligence tentaculaire", "Le poulpe", "poulpe", "/totems/totem-11.jpg", [
      "Je suis un mollusque céphalopode dépourvu de squelette interne et doté d’un système nerveux très distribué.",
      "Mon sang utilise l’hémocyanine et circule grâce à trois cœurs.",
      "Je peux modifier rapidement couleur et texture pour me camoufler, puis projeter de l’encre.",
      "Mes huit bras portent des ventouses.",
    ], "Deux cœurs alimentent les branchies et le troisième distribue le sang au reste du corps.", "https://ocean.si.edu/ocean-life/invertebrates/octopuses-squids-and-relatives"),
    buzzerRound("buzzer-beluga", "Animal 3 · Canari des mers", "Le béluga", "beluga", "/teams/12-cool-le-beluga.jpg", [
      "Je vis dans les eaux arctiques, je suis très sociable et je communique avec un répertoire impressionnant de sons.",
      "Contrairement à beaucoup de cétacés, mes vertèbres cervicales ne sont pas soudées et je peux tourner la tête.",
      "À l’âge adulte, ma peau devient blanche et mon front présente un melon très arrondi.",
      "On me surnomme le canari des mers.",
    ], "Le béluga module la forme de son melon pour focaliser les sons utilisés en écholocation.", "https://www.fisheries.noaa.gov/species/beluga-whale"),
    buzzerRound("buzzer-crevette-mante", "Animal 4 · Coup supersonique", "La crevette-mante", "crevette-mante", "/totems/totem-13.jpg", [
      "Je suis un stomatopode dont la vision analyse davantage de canaux de couleur que celle des humains.",
      "Mes bras frappent si vite qu'ils créent dans l'eau des bulles qui implosent avec un éclair et une seconde onde de choc.",
      "Mon coup peut briser une coquille dure, voire le verre fin d’un aquarium.",
      "Je ressemble à une crevette multicolore équipée de gants de boxe.",
    ], "La cavitation provoquée par son coup produit une seconde onde de choc quand la bulle implose.", "https://ocean.si.edu/ocean-life/invertebrates/mantis-shrimp"),
    buzzerRound("buzzer-kraken", "Animal 5 · Légende des profondeurs", "Le Kraken", "kraken", "/teams/20-big-le-kraken.jpg", [
      "Depuis des siècles, les marins racontent qu’une créature gigantesque se cacherait dans les profondeurs.",
      "Je viens des légendes scandinaves et l’on me prête la force de faire sombrer des navires.",
      "Mes immenses tentacules surgiraient de l’eau pour encercler les coques.",
      "On me représente comme un calmar gigantesque : je suis le Kraken.",
    ], "Cette légende scandinave est aujourd’hui associée au calmar géant, observé très rarement dans les profondeurs.", "https://www.amnh.org/explore/ology/ology-cards/285-kraken"),
  ],
} satisfies ChallengeDefinition
