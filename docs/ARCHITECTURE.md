# Architecture fonctionnelle

## Principe réglementaire

Le MVP doit être traité comme une plateforme logicielle de gestion d'avantages repas. Avant production financière réelle, les fonds doivent être encaissés, cantonnés et réglés par un partenaire agréé.

## Modules

1. Admin: validation, supervision, création entreprises/marchands, audit.
2. Entreprise: salariés, dotations repas, reporting.
3. Salarié: solde, carte virtuelle interne, confirmation paiement.
4. Marchand: demande de paiement, QR, historique, règlement à préparer.
5. Ledger: registre double entrée.
6. PSP Adapter: couche future pour mobile money, banque ou EME.

## Flux MVP

Entreprise crédite salarié -> salarié paie demande marchand -> ledger débite salarié -> ledger crédite marchand net -> ledger crédite commission plateforme.

## Production réelle

Avant production, ajouter au minimum: KYC/KYB, antifraude, limites, rapprochement bancaire, règlement marchand, monitoring, sauvegardes, tests automatisés, durcissement sécurité et revue juridique.
