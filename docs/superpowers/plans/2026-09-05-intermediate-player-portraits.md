# Intermediate Player Portraits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir la même lightbox photo que le classement final lorsqu’un joueur est sélectionné dans un classement intermédiaire.

**Architecture:** La conversion de `PlayerView` vers le modèle de portrait est centralisée dans le module de lightbox. `PlayerLeaderboard` porte l’état local de sélection, transforme chaque ligne en bouton accessible et affiche la lightbox existante, sans modifier `LeaderboardScreen` ni les données métier.

**Tech Stack:** React, TypeScript, Vitest, Playwright, CSS, Docker Compose.

---

### Task 1: Centraliser le modèle de portrait

**Files:**
- Modify: `src/components/player-portrait-lightbox.test.tsx`
- Modify: `src/components/player-portrait-lightbox.tsx`
- Modify: `src/components/final-scoreboard.tsx`

- [ ] **Step 1: Écrire le test en échec**

Ajouter un test de `portraitPlayerFromView` couvrant la photo directe, le fallback du totem et l’absence de photo :

```tsx
expect(portraitPlayerFromView({ ...basePlayer, imageUrl: "/players/alice.jpg", animalName: "Raie manta" })).toEqual({
  name: "Alice",
  imageUrl: "/players/alice.jpg",
  animalName: "Raie manta",
})
expect(portraitPlayerFromView({ ...basePlayer, totem })).toEqual({
  name: "Alice",
  imageUrl: totem.imageUrl,
  animalName: totem.name,
})
expect(portraitPlayerFromView(basePlayer)).toBeNull()
```

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `npx vitest run src/components/player-portrait-lightbox.test.tsx`

Expected: FAIL car `portraitPlayerFromView` n’est pas exportée.

- [ ] **Step 3: Implémenter le mapping partagé**

Dans `player-portrait-lightbox.tsx`, importer `PlayerView` et exporter :

```ts
export function portraitPlayerFromView(player: PlayerView): PortraitPlayer | null {
  const imageUrl = player.imageUrl ?? player.totem?.imageUrl
  if (!imageUrl) return null
  return {
    name: player.name,
    imageUrl,
    animalName: player.animalName ?? player.totem?.name ?? "Poisson mystérieux",
  }
}
```

Remplacer le helper privé équivalent de `final-scoreboard.tsx` par cet import.

- [ ] **Step 4: Vérifier les tests concernés**

Run: `npx vitest run src/components/player-portrait-lightbox.test.tsx src/components/final-scoreboard.test.tsx`

Expected: PASS.

### Task 2: Rendre la grille intermédiaire interactive

**Files:**
- Modify: `src/components/player-leaderboard.test.tsx`
- Modify: `src/components/player-leaderboard.tsx`
- Modify: `src/components/player-leaderboard.css`
- Modify: `e2e/game.spec.ts`

- [ ] **Step 1: Écrire le test de rendu en échec**

Exiger des boutons nommés et une ligne désactivée sans photo :

```tsx
expect(markup).toContain('aria-label="Agrandir la photo de Alice"')
expect(markup).toContain('aria-label="Agrandir la photo de Zoé"')
expect(markup).toContain('aria-label="Photo indisponible pour Émile"')
expect(markup).toContain('disabled=""')
```

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `npx vitest run src/components/player-leaderboard.test.tsx`

Expected: FAIL car les lignes sont encore des éléments statiques.

- [ ] **Step 3: Implémenter la sélection et la lightbox**

Dans `PlayerLeaderboard`, ajouter un état `PortraitPlayer | null`, calculer le portrait avec `portraitPlayerFromView`, rendre `li > button.player-leaderboard__row`, puis afficher :

```tsx
{selectedPlayer ? (
  <PlayerPortraitLightbox
    player={selectedPlayer}
    onClose={() => setSelectedPlayer(null)}
  />
) : null}
```

Le bouton utilise `disabled={!portrait}` et un label distinct lorsque la photo est indisponible.

- [ ] **Step 4: Ajouter les affordances CSS**

Réinitialiser le style natif du bouton, préserver la grille et ajouter `:hover`, `:focus-visible` et `:disabled` sans modifier le thème existant.

- [ ] **Step 5: Vérifier le test unitaire**

Run: `npx vitest run src/components/player-leaderboard.test.tsx`

Expected: PASS.

- [ ] **Step 6: Ajouter le parcours end-to-end**

Dans le scénario principal, après la première épreuve, cliquer sur « Agrandir la photo de {joueur} », vérifier le dialogue et le fermer :

```ts
await host.getByRole("button", { name: /Agrandir la photo de/ }).first().click()
await expect(host.getByRole("dialog", { name: /Portrait de/ })).toBeVisible()
await host.getByRole("button", { name: "Fermer le portrait" }).click()
await expect(host.getByRole("dialog", { name: /Portrait de/ })).not.toBeVisible()
```

- [ ] **Step 7: Valider et publier**

Run: `npm test`

Expected: toute la suite Vitest passe.

Run: `npm run build`

Expected: build de production réussi.

Run: `npm run test:e2e -- --grep "full tournament"`

Expected: le parcours ciblé passe.

Commit et déploiement :

```bash
git add src/components/player-portrait-lightbox.tsx src/components/player-portrait-lightbox.test.tsx src/components/final-scoreboard.tsx src/components/player-leaderboard.tsx src/components/player-leaderboard.test.tsx src/components/player-leaderboard.css e2e/game.spec.ts
git commit -m "feat: open player portraits from intermediate rankings"
git push origin main
./scripts/pi/push.sh baptiste@192.168.1.15
```

Expected: santé locale et publique OK, puis clic public vérifié dans une nouvelle démo.
