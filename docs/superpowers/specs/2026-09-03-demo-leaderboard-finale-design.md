# Demo, Leaderboard et Finale — Design

## Objectif

Ajouter un accès de démonstration immédiatement jouable, un classement de transition entre chaque épreuve et une finale spectaculaire, sans casser le flux multijoueur ni ralentir le maître du jeu.

## Décisions

- « Fish Party » devient un lien easter egg vers `https://www.youtube.com/shorts/F3Rl8RRDq90`, ouvert dans un nouvel onglet avec `noopener noreferrer`.
- Le mode démo utilise une vraie partie SQLite : huit joueurs simulés, deux par banc, totems attribués et partie démarrée au premier écran d’introduction.
- En démo, le serveur complète les réponses manquantes des quatre bancs avant chaque révélation. Les scores et classements restent donc représentatifs du vrai jeu.
- L’URL `/?demo=1` efface uniquement la session locale courante, crée une nouvelle démo, puis nettoie le paramètre pour éviter les recréations au rechargement.
- La phase `leaderboard` est persistée côté serveur après les épreuves 1, 2 et 3. L’hôte déclenche ensuite l’introduction de l’épreuve suivante.
- Le leaderboard affiche le rang, le nom du banc, les avatars, le score et une barre relative au leader.
- La dernière épreuve mène directement à la finale.
- La finale affiche Poséithon, le banc vainqueur, le classement, des confettis, des bulles et des poissons animés. `prefers-reduced-motion` désactive les mouvements décoratifs.

## Validation

- Tests service : transition révélation → leaderboard → prochaine introduction et réponses automatiques du mode démo.
- Tests API : création d’une démo prête à jouer.
- Playwright mobile : easter egg, accès démo, leaderboard intermédiaire, finale et décor animé.
- Build TypeScript, Docker, healthcheck et contrôle console.
