# MealCard Africa — MVP Option 3

Plateforme logicielle B2B de gestion d'avantages repas en Afrique, conçue comme une solution de **wallet fermé / semi-fermé** sans conservation directe des fonds par la plateforme. La conservation, le cantonnement et les flux financiers réels doivent être opérés avec un partenaire réglementé: banque, établissement de monnaie électronique, établissement de paiement ou PSP agréé.

## Ce que contient cette base

- API Node.js / Express / TypeScript.
- PostgreSQL + Prisma.
- Ledger interne en double entrée.
- Authentification JWT.
- Back-office admin.
- Portail entreprise.
- Espace salarié avec carte virtuelle interne et paiement.
- Espace marchand avec génération de demande de paiement QR.
- Docker Compose pour PostgreSQL et Redis.
- Seed de démonstration.

## Ce que cette base ne fait pas encore

- Ne détient pas réellement les fonds clients.
- Ne remplace pas un agrément de monnaie électronique ou de paiement.
- Ne se connecte pas encore à un PSP/mobile money.
- Ne doit pas être utilisée en production sans audit sécurité, juridique, conformité et financier.

## Démarrage local

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Front-end: http://localhost:3000  
API: http://localhost:4000  
Healthcheck: http://localhost:4000/health

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@mealcard.africa | AdminPassword123! |
| Entreprise | company@mealcard.africa | CompanyPassword123! |
| Salarié | employee@mealcard.africa | EmployeePassword123! |
| Marchand | merchant@mealcard.africa | MerchantPassword123! |

## Parcours de paiement MVP

1. Le marchand se connecte sur `/merchant`.
2. Il crée une demande de paiement.
3. Le salarié se connecte sur `/employee`.
4. Il saisit l'identifiant de demande de paiement.
5. Le backend vérifie le solde, le marchand, les statuts et les règles.
6. Le ledger débite le wallet salarié et crédite le wallet marchand.
7. Les deux parties voient la transaction dans leur historique.

## Modèle réglementaire recommandé

Cette plateforme correspond à l'Option 3: **outil logiciel B2B**. Le projet doit être exploité avec un partenaire réglementé pour les flux financiers réels:

- compte de cantonnement;
- émission ou gestion de monnaie électronique;
- règlement marchand;
- conformité LBC/FT;
- supervision des flux;
- reporting réglementaire.

## Structure

```text
apps/api      API Express + Prisma
apps/web      Interface Next.js
docs          Documentation produit, technique et conformité
```

## Commandes utiles

```bash
npm run dev          # lance API + web
npm run build        # build monorepo
npm run lint         # lint monorepo
npm run db:migrate   # migrations Prisma
npm run db:seed      # données de démonstration
```
