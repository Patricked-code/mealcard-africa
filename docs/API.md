# API principale

## Auth

- POST `/auth/login`

## Admin

- GET `/admin/overview`
- POST `/admin/companies`
- POST `/admin/merchants`
- GET `/admin/transactions`

## Entreprise

- GET `/company/dashboard`
- GET `/company/employees`
- POST `/company/employees`
- POST `/company/employees/:id/create-access`
- POST `/company/employees/:id/credit`

## Salarié

- GET `/employee/wallet`
- GET `/employee/transactions`
- POST `/employee/payments/confirm`

## Marchand

- GET `/merchant/wallet`
- POST `/merchant/payment-requests`
- GET `/merchant/transactions`
