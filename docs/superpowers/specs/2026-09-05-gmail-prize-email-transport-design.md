# Gmail Prize Email Transport Design

## Goal

Permettre l’envoi des prix Fish Tournament à tous les invités sans nom de domaine, depuis le compte Gmail fourni et un mot de passe d’application Google.

## Decision

Ajouter un transport SMTP Gmail derrière l’interface existante `PrizeEmailSender`. Le transport SMTP est sélectionné automatiquement quand `SMTP_USER` et `SMTP_APP_PASSWORD` sont configurés ; Resend reste disponible comme fallback afin de ne pas casser la configuration existante.

## Configuration

- `SMTP_USER`: adresse Gmail expéditrice.
- `SMTP_APP_PASSWORD`: mot de passe d’application Google, stocké uniquement dans `.env` local.
- `FISH_EMAIL_FROM`: nom et adresse visibles par les invités.
- Connexion SMTP Gmail chiffrée sur `smtp.gmail.com:465` avec TLS implicite.

Le vrai mot de passe Google n’est jamais utilisé. Les secrets restent exclus de Git et ne sont jamais loggés.

## Implementation

- Utiliser Nodemailer pour la connexion SMTP et les pièces jointes.
- Convertir les pièces jointes base64 existantes en `Buffer` avant l’envoi.
- Ajouter une factory `createPrizeEmailSenderFromEnv()` utilisée par `server/index.ts`.
- Refuser une configuration SMTP partielle avec l’erreur sûre existante.
- Conserver l’idempotence et l’éligibilité dans `PrizeService` sans modification.

## Verification

- Test unitaire du mapping SMTP et des pièces jointes.
- Test de sélection Gmail/Resend et de configuration incomplète.
- Suite Vitest et build.
- Recréation Docker avec les variables SMTP.
- Email réel de test vers l’adresse expéditrice.
