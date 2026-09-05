export interface PlayerIdentityDefinition {
  id: string
  displayName: string
  imageUrl: string
  anonymous: boolean
}

function invited(id: string, displayName: string, filename: string): PlayerIdentityDefinition {
  return {
    id,
    displayName,
    imageUrl: `/players/${filename}`,
    anonymous: false,
  }
}

export const invitedPlayerIdentities: readonly PlayerIdentityDefinition[] = [
  invited("agathe", "Agathe", "agathe-poisson-globe.png"),
  invited("bastien", "Bastien", "bastien-requin.png"),
  invited("daniel", "Daniel", "daniel-orque.png"),
  invited("dimitri", "Dimitri", "dimitri-morse.png"),
  invited("fabien", "Fabien", "fabien-axolotl.webp"),
  invited("florian", "Florian", "florian-loutre.png"),
  invited("jeremy", "Jeremy", "jeremy-phoque.png"),
  invited("laura", "Laura", "laura-tortue.png"),
  invited("margaux", "Margaux", "margaux-sirene.png"),
  invited("marie", "Marie", "marie-meduse.png"),
  invited("nixon", "Nixon", "nixon-baleine.png"),
  invited("olivia", "Olivia", "olivia-crevette.png"),
  invited("pauline", "Pauline", "pauline-beluga.png"),
  invited("thierry", "Thierry", "thierry-thon.png"),
  invited("vic", "Vic", "vic-raie-manta.png"),
  invited("victoria", "Victoria", "victoria-hippocampe.png"),
  invited("vincent", "Vincent", "vincent-pieuvre.png"),
]

export const anonymousPlayerIdentity: PlayerIdentityDefinition = {
  id: "anonymous",
  displayName: "Autre invité",
  imageUrl: "/players/anonyme-poisson-clown.png",
  anonymous: true,
}

export const playerIdentities: readonly PlayerIdentityDefinition[] = [
  ...invitedPlayerIdentities,
  anonymousPlayerIdentity,
]

export function findPlayerIdentity(id: string): PlayerIdentityDefinition | null {
  return playerIdentities.find((identity) => identity.id === id) ?? null
}
