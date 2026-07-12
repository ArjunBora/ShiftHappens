# TransitOps Backend

This project implements a backend service for the TransitOps specification using Express, Prisma, and SQLite.

## Run locally

```bash
npm install
npx prisma db push
npm start
```

## Core endpoints

- POST /api/vehicles
- POST /api/drivers
- POST /api/trips
- POST /api/expenses
- POST /api/fuel
- POST /api/trips/:id/dispatch
- POST /api/trips/:id/complete
- POST /api/maintenance
- PATCH /api/maintenance/:id
- GET /api/analytics/summary
