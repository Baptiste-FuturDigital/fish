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
      "Je suis un odontocète arctique très social dont les vocalisations couvrent un registre exceptionnellement varié.",
      "Contrairement à beaucoup de cétacés, mes vertèbres cervicales ne sont pas soudées et je peux tourner la tête.",
      "À l’âge adulte, ma peau devient blanche et mon front présente un melon très arrondi.",
      "On me surnomme le canari des mers.",
    ], "Le béluga module la forme de son melon pour focaliser les sons utilisés en écholocation.", "https://www.fisheries.noaa.gov/species/beluga-whale"),
    buzzerRound("buzzer-crevette-mante", "Animal 4 · Coup supersonique", "La crevette-mante", "crevette-mante", "/totems/totem-13.jpg", [
      "Je suis un stomatopode dont la vision analyse davantage de canaux de couleur que celle des humains.",
      "Mes appendices ravisseurs accélèrent si brutalement qu’ils créent des bulles de cavitation.",
      "Mon coup peut briser une coquille dure, voire le verre fin d’un aquarium.",
      "Je ressemble à une crevette multicolore équipée de gants de boxe.",
    ], "La cavitation provoquée par son coup produit une seconde onde de choc quand la bulle implose.", "https://ocean.si.edu/ocean-life/invertebrates/mantis-shrimp"),
    buzzerRound("buzzer-tortue-luth", "Animal 5 · Géante souple", "La tortue luth", "tortue-luth", "/game/Le juste poisson/poids-tortue-luth.jpg", [
      "Je suis un reptile pélagique capable de migrations transocéaniques et de plongées dépassant parfois mille mètres.",
      "Mon corps maintient une température supérieure à celle de l’eau grâce à ma taille et à des adaptations circulatoires.",
      "Ma dossière souple porte sept crêtes longitudinales au lieu d’écailles cornées.",
      "Je suis la plus grande tortue marine vivante.",
    ], "La tortue luth peut dépasser 500 kg et parcourt des milliers de kilomètres entre alimentation et ponte.", "https://www.fisheries.noaa.gov/species/leatherback-turtle"),
  ],
} satisfies ChallengeDefinition
