# TransitOps

TransitOps is a comprehensive fleet management platform featuring a robust Express/Prisma/SQLite backend and a highly responsive, aesthetically premium React 19 frontend.

## UI/UX Design & Aesthetic
The frontend has been designed with a premium "Anti-Slop" philosophy:
- **Glassmorphism UI:** Advanced frosted glass elements (`.glass-panel`) are used for navigation and key focal points, using multi-layered box-shadows to simulate physical edge refraction and light bleed.
- **Role-Based Access (RBAC):** The frontend simulates real-time role-switching (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) with dynamic view updates.
- **Ambient Lighting:** Backgrounds include subtle generative glows (mix-blend-screen) to give the translucent panels physical depth.

## Run Locally

### Backend
Navigate to the root directory and start the server:
```bash
npm install
npx prisma db push
node seed.js
npm start
```
*The backend runs on `http://localhost:3000/api`*

### Frontend
In a separate terminal, navigate to the `/frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on `http://localhost:5174`*

## Demo Assets
- Seed data script: `seed.js`
- Postman collection: `TransitOps_API.postman_collection.json`

## Core API Endpoints
- `POST /api/vehicles`
- `POST /api/drivers`
- `POST /api/trips`
- `POST /api/expenses`
- `POST /api/fuel`
- `POST /api/trips/:id/dispatch`
- `POST /api/trips/:id/complete`
- `POST /api/maintenance`
- `PATCH /api/maintenance/:id`
- `GET /api/analytics/summary`
