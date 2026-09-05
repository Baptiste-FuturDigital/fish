# Téléphone maître et bancs TV rainbow — Design

## Décision

La partie est créée depuis le téléphone du maître du jeu. Ce navigateur conserve la session dans `localStorage` et reprend automatiquement la partie quand l’URL de base est rouverte. Le rôle maître n’est jamais inclus dans un lien partagé.

## Expérience maître

- La carte maître indique clairement que cet appareil est la console de commande persistante.
- Un bouton « Partager l’écran TV » utilise le partage natif du téléphone quand il existe, puis copie le lien TV dans le presse-papiers en fallback.
- Le lien partagé est uniquement `/tv/{CODE}` : il ne contient aucun jeton et n’accorde aucune commande.
- Le bouton existant « Ouvrir l’écran TV » reste disponible pour tester localement.

## Expérience TV

Les quatre cartes d’équipe conservent leur fond clair. Une fine bordure conique arc-en-ciel tourne autour de chaque carte, avec des décalages d’animation pour éviter un mouvement parfaitement synchronisé. Le contenu et la lisibilité restent inchangés.

## Limites explicites

- La reprise automatique fonctionne sur le même navigateur et hors navigation privée.
- Changer de téléphone ne transfère pas le rôle maître. Ce choix évite d’exposer un secret d’administration dans un QR code ou un lien.
- Le tunnel ngrok peut changer après redémarrage; le lien TV est construit depuis l’origine courante au moment du partage.

## Validation

- Tests unitaires du lien TV absolu et des branches partage/copie.
- Test de rendu du lobby maître.
- Test de présence des classes rainbow sur chaque banc TV.
- Build, suite Vitest, Docker et contrôle navigateur sans erreur console.
