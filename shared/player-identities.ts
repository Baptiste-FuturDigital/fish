export interface PlayerIdentityDefinition {
  id: string
  displayName: string
  imageUrl: string
  anonymous: boolean
  animalName: string
  animalFact: string
}

function invited(
  id: string,
  displayName: string,
  filename: string,
  animalName: string,
  animalFact: string,
): PlayerIdentityDefinition {
  return {
    id,
    displayName,
    imageUrl: `/players/${filename}`,
    anonymous: false,
    animalName,
    animalFact,
  }
}

export const invitedPlayerIdentities: readonly PlayerIdentityDefinition[] = [
  invited("agathe", "Agathe", "agathe-poisson-globe.png", "le poisson-globe", "Face au danger, il peut se gonfler d’eau jusqu’à paraître plusieurs fois plus imposant."),
  invited("bastien", "Bastien", "bastien-requin.png", "le requin", "Son squelette n’est pas fait d’os : il est entièrement constitué de cartilage, comme ton nez."),
  invited("daniel", "Daniel", "daniel-orque.png", "l’orque", "Chaque clan possède ses propres appels appris en famille, une sorte de dialecte transmis entre générations."),
  invited("dimitri", "Dimitri", "dimitri-morse.png", "le morse", "Ses défenses sont deux canines géantes qui l’aident notamment à se hisser hors de l’eau."),
  invited("fabien", "Fabien", "fabien-axolotl.webp", "l’axolotl", "Il peut régénérer des membres entiers ainsi que des parties de son cœur et de sa moelle épinière."),
  invited("florian", "Florian", "florian-loutre.png", "la loutre de mer", "Elle utilise des pierres comme outils pour ouvrir les coquillages les plus résistants."),
  invited("jeremy", "Jeremy", "jeremy-phoque.png", "le phoque", "Ses moustaches détectent les minuscules turbulences laissées dans l’eau par les poissons qui nagent."),
  invited("laura", "Laura", "laura-tortue.png", "la tortue marine", "Elle perçoit le champ magnétique terrestre et s’en sert comme d’une carte pour traverser les océans."),
  invited("margaux", "Margaux", "margaux-sirene.png", "la sirène", "Des marins auraient pris des lamantins aperçus de loin pour des sirènes : la fatigue fait des miracles."),
  invited("marie", "Marie", "marie-meduse.png", "la méduse", "Elle nage sans cerveau, sans cœur et sans os grâce à un simple réseau de cellules nerveuses."),
  invited("nixon", "Nixon", "nixon-baleine.png", "la baleine bleue", "Sa langue peut peser autant qu’un éléphant, alors que son régime est composé presque uniquement de krill."),
  invited("olivia", "Olivia", "olivia-crevette.png", "la crevette", "Son cœur se trouve dans le céphalothorax, la partie du corps que l’on appelle souvent sa tête."),
  invited("pauline", "Pauline", "pauline-beluga.png", "le béluga", "On le surnomme le canari des mers tant son répertoire de sifflements et de clics est varié."),
  invited("thierry", "Thierry", "thierry-thon.png", "le thon", "Il peut maintenir certains muscles plus chauds que l’eau, un avantage précieux pour nager vite."),
  invited("vic", "Vic", "vic-raie-manta.png", "la raie manta", "Elle possède le plus grand cerveau proportionnellement au corps parmi tous les poissons connus."),
  invited("victoria", "Victoria", "victoria-hippocampe.png", "l’hippocampe", "Chez lui, c’est le mâle qui porte les embryons dans une poche et donne naissance aux petits."),
  invited("vincent", "Vincent", "vincent-pieuvre.png", "la pieuvre", "Elle possède trois cœurs et un sang bleu, riche en cuivre plutôt qu’en fer."),
]

export const anonymousPlayerIdentity: PlayerIdentityDefinition = {
  id: "anonymous",
  displayName: "Autre invité",
  imageUrl: "/players/anonyme-poisson-clown.png",
  anonymous: true,
  animalName: "le poisson-clown",
  animalFact: "Si la femelle dominante disparaît, le mâle principal change de sexe et prend sa place.",
}

export const playerIdentities: readonly PlayerIdentityDefinition[] = [
  ...invitedPlayerIdentities,
  anonymousPlayerIdentity,
]

export function findPlayerIdentity(id: string): PlayerIdentityDefinition | null {
  return playerIdentities.find((identity) => identity.id === id) ?? null
}
