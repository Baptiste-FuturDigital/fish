# Le juste poisson — 25 Seconds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire durer chacune des cinq manches de « Le juste poisson » 25 secondes au lieu de 20.

**Architecture:** Le catalogue partagé reste la source de vérité de la durée. Le moteur serveur calcule l’échéance depuis `durationSeconds`, tandis que les interfaces maître, joueur et projecteur affichent la même valeur ; aucun override spécifique n’est ajouté.

**Tech Stack:** TypeScript, Vitest, React, Express, Docker Compose, Raspberry Pi.

---

### Task 1: Verrouiller et modifier la durée du catalogue

**Files:**
- Modify: `shared/challenges/le-juste-poisson.test.ts`
- Modify: `shared/challenges/le-juste-poisson.ts`

- [ ] **Step 1: Écrire le test en échec**

Modifier le test pour exiger cinq manches de 25 secondes et la règle mise à jour :

```ts
it("propose exactement cinq manches numeriques de 25 secondes en kilogrammes", () => {
  expect(leJustePoisson.rounds).toHaveLength(5)
  for (const round of leJustePoisson.rounds) {
    expect(round.durationSeconds).toBe(25)
  }
  expect(leJustePoisson.introRules).toContain("25 secondes par manche")
})
```

- [ ] **Step 2: Vérifier l’échec attendu**

Run: `npm test -- --run shared/challenges/le-juste-poisson.test.ts`

Expected: FAIL car les manches et le texte déclarent encore 20 secondes.

- [ ] **Step 3: Appliquer l’implémentation minimale**

Dans `shared/challenges/le-juste-poisson.ts`, remplacer la règle par :

```ts
"25 secondes par manche"
```

Puis définir `durationSeconds: 25` sur chacune des cinq manches.

- [ ] **Step 4: Vérifier le test ciblé**

Run: `npm test -- --run shared/challenges/le-juste-poisson.test.ts`

Expected: PASS.

- [ ] **Step 5: Valider la régression**

Run: `npm test -- --run`

Expected: toute la suite passe.

Run: `npm run build`

Expected: build de production réussi.

- [ ] **Step 6: Commit, push et déploiement**

```bash
git add shared/challenges/le-juste-poisson.ts shared/challenges/le-juste-poisson.test.ts
git commit -m "feat: extend weight rounds to 25 seconds"
git push origin main
./scripts/pi/push.sh baptiste@192.168.1.15
```

Expected: le conteneur est sain sur le Raspberry Pi.

- [ ] **Step 7: Vérifier les endpoints servis**

```bash
curl -fsS http://192.168.1.15:8787/api/health
curl -fsS https://acm-tooth-harris-medline.trycloudflare.com/api/health
```

Expected: les deux réponses sont `{"status":"ok"}` et le bundle public correspond au bundle du Pi.
