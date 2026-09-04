# Millionaire Shark Joker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer une épreuve « Qui veut gagner des poissons ? » visuellement cohérente et un joker 50/50 unique par banc.

**Architecture:** SQLite reste l’autorité. Une mutation authentifiée consomme le joker dans une transaction, calcule les deux choix conservés et renvoie la projection de partie. Le client affiche uniquement le joker de l’équipe du joueur et masque les choix éliminés.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Express, SQLite, Vitest, Playwright.

---

### Task 1: Contrat et persistance

**Files:**
- Modify: `shared/game.ts`
- Modify: `server/db.ts`
- Test: `server/db.test.ts`

- [x] Ajouter un test de migration qui exige la table et sa clé unique.
- [x] Exécuter `npm test -- server/db.test.ts` et vérifier l’échec.
- [x] Ajouter la table `team_fifty_fifty_jokers` et le type de projection.
- [x] Relancer le test et vérifier le succès.

### Task 2: Règle serveur 50/50

**Files:**
- Modify: `server/game-service.ts`
- Test: `server/game-service.test.ts`

- [x] Tester qu’un joueur de l’épreuve finale conserve la bonne réponse et une mauvaise.
- [x] Tester qu’une seconde activation du même banc retourne un conflit et qu’un autre banc reste éligible.
- [x] Exécuter le test ciblé et vérifier l’échec.
- [x] Implémenter `useFiftyFifty` dans une transaction SQLite avec choix déterministe.
- [x] Relancer les tests et vérifier le succès.

### Task 3: Route et client

**Files:**
- Modify: `server/app.ts`
- Modify: `server/app.test.ts`
- Modify: `src/api.ts`
- Modify: `src/hooks/use-game.ts`

- [x] Tester `POST /api/games/:code/jokers/fifty-fifty` avec identité joueur.
- [x] Exécuter le test API et vérifier l’échec.
- [x] Ajouter la route, l’appel client et le hook `useFiftyFifty`.
- [x] Relancer le test et vérifier le succès.

### Task 4: Plateau mobile

**Files:**
- Modify: `src/components/millionaire-answer-panel.tsx`
- Modify: `src/components/millionaire-answer-panel.css`
- Modify: `src/components/challenge-screen.tsx`
- Modify: `shared/challenges/qui-veut-gagner-des-poissons.ts`
- Modify: `shared/challenges/qui-veut-gagner-des-poissons.test.ts`
- Create: `public/jean-pierre-foucault-requin.webp`
- Test: `src/components/millionaire-answer-panel.test.tsx`

- [x] Tester le bouton joker et l’affichage de deux choix après activation.
- [x] Exécuter le test ciblé et vérifier l’échec.
- [x] Brancher le joker, la nouvelle image et le plateau bleu/or responsive.
- [x] Relancer les tests et vérifier le succès.

### Task 5: Vérification et livraison

**Files:**
- Modify: `README.md`

- [x] Exécuter `npm test`.
- [x] Exécuter `npm run build`.
- [x] Exécuter `npm run test:e2e` sur le conteneur local.
- [x] Reconstruire Docker, vérifier `/api/health`, inspecter le rendu mobile et les erreurs console.
- [ ] Committer uniquement les fichiers du feature et pousser `main`.
