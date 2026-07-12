# Shift Happens

Shift Happens is a full-stack fleet management and operations tracking platform. The application is built with a decoupled architecture, using an Express/Prisma/SQLite backend service paired with a modern React 19 single-page application frontend.

---

## System Overview

The project provides live telemetry tracking, vehicle status monitoring, driver assignments, expense tracking, and role-based permissions management. 

### Core Features

1. **Role-Based Access Control (RBAC):** Simulated authorization scoping for four key operations roles:
   - Fleet Manager: Full write permissions to vehicles, drivers, and maintenance logs.
   - Dispatcher: Manages trip scheduling, driver/vehicle allocations, and dispatches trips.
   - Safety Officer: Accesses driver records, logs telemetry issues, and manages safety compliance.
   - Financial Analyst: Logs operational expenses, tracks fuel costs, and analyzes profitability reports.
2. **Interactive Dashboard:** Aggregated data visualizer tracking total distance travelled, active trips, vehicle allocation rates, and driver statuses.
3. **Fleet Management:** Grid tracking vehicle registers, fuel status, odometer telemetry, and maintenance status. Includes a custom modal flow to add vehicles or transfer active units to maintenance shops.
4. **Driver Dispatch Control:** Automated state machine managing driver statuses (Available, On Trip, Suspended) and allocating them to scheduled dispatches.
5. **Telemetry & Maintenance Shops:** Restrictive log capturing active repair jobs, estimated costs, and schedules. Includes automated release triggers returning vehicles to active duty.
6. **Expense Tracking & Auditing:** Specialized finance interface listing fuel bills, equipment updates, and general tolls. Includes CSV exporter utilities for financial reporting.
7. **Business Analytics:** Chart summaries tracing total fuel expenditures, operational metrics, and top-cost vehicles.

---

## Demo Video

A walkthrough demonstration of the system is available on YouTube:
[Shift Happens Demo Video](https://youtu.be/4wuzFHLQLuI)

---

## Technical Stack

### Backend Service
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database ORM:** Prisma ORM
- **Database Engine:** SQLite (Local database instance)
- **Logging & Tools:** Morgan middleware, CORS support

### Frontend Application
- **Library/Framework:** React 19, React Router DOM (v7)
- **Aesthetic System:** Tailwind CSS v4, custom glassmorphism utilities
- **State Animations:** Motion (Framer Motion v11+) and React Use Measure
- **Data Visualization:** Recharts API (responsive area and bar charts)
- **API Client:** Axios

---

## Local Setup and Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Step 1: Database Setup and Seeding
From the root directory of the repository, install server dependencies, generate the SQLite database schema, and seed test data:
```bash
# Install root/backend dependencies
npm install

# Push database schema to local SQLite instance
npx prisma db push

# Run the seeding script to pre-populate database records
node seed.js
```

### Step 2: Start the Backend API Server
Start the Express server on its default port (3000):
```bash
# Run backend development server
npm start
```

### Step 3: Run the Frontend Client
Open a second terminal instance, navigate to the frontend directory, install dependencies, and launch the Vite client:
```bash
# Navigate to frontend folder
cd frontend

# Install package dependencies
npm install

# Launch local development server
npm run dev
```

---

## API Endpoints Matrix

### Vehicles API
- `GET /api/vehicles` - Retrieve a list of all registered fleet vehicles.
- `POST /api/vehicles` - Add a new vehicle to the registry. Requires Fleet Manager privileges.

### Drivers API
- `GET /api/drivers` - Fetch all drivers in the system.
- `POST /api/drivers` - Register a new driver profile. Requires Fleet Manager or Safety Officer privileges.

### Trips API
- `GET /api/trips` - Query all scheduled, active, and completed trip schedules.
- `POST /api/trips` - Register a new trip route. Requires Dispatcher privileges.
- `POST /api/trips/:id/dispatch` - Transition a trip to "On Trip" status. Sets driver and vehicle statuses to "On Trip".
- `POST /api/trips/:id/complete` - Mark a trip as "Completed". Updates vehicle odometers and transitions resources back to "Available".

### Financials & Logs API
- `POST /api/expenses` - Create a new operational expense log. Requires Financial Analyst privileges.
- `POST /api/fuel` - Record a new fuel charge entry. Requires Financial Analyst privileges.
- `GET /api/analytics/summary` - Aggregate total costs, distance, and resource metrics.

### Maintenance API
- `GET /api/maintenance` - Retrieve active workshop repair records.
- `POST /api/maintenance` - Log a vehicle into the repair shop. Requires Fleet Manager privileges.
- `PATCH /api/maintenance/:id` - Complete service logs and release vehicles back to pool. Requires Fleet Manager privileges.

---

## Design and Accessibility Details
- **Glassmorphism:** Styled containers use custom frosted panels (.glass-panel) with edge highlights (gradient border elements via before and after selectors) to optimize contrast and typography.
- **Micro-Animations:** Interactive elements (buttons, inputs) utilize active:scale-[0.98] animations to provide tactile physical response.
- **RBAC Simulator:** Collapsible sidebar widgets powered by Motion and Use Measure allow developers to switch simulated security scopes in real time.
