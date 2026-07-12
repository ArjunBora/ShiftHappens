# TransitOps: Backend & Database Developer Specification

This guide is designed for the **Backend Developer** to build the database layer, API endpoints, authentication system, and business logic engine for **TransitOps**.

* **GitHub Repository:** `https://github.com/ArjunBora/ShiftHappens.git`

---

## 🗄️ 1. Database Schema Design (SQLite/Prisma/SQLAlchemy)

Define the following tables and integrity constraints to ensure clean relationships:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     VEHICLE     │       │     DRIVER      │       │      TRIP       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ reg_number (PK) │       │ id (PK)         │       │ id (PK)         │
│ model           │       │ name            │       │ source          │
│ type            │       │ license_number  │       │ destination     │
│ capacity        │       │ license_category│       │ cargo_weight    │
│ odometer        │       │ license_expiry  │       │ distance        │
│ acq_cost        │       │ contact_number  │       │ status          │
│ status          │       │ completion_rate │       │ vehicle_reg(FK) │
└─────────┬───────┘       │ status          │       │ driver_id (FK)  │
          │               └────────┬────────┘       └────────┬────────┘
          │                        │                         │
          ├────────────────────────┼─────────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ MAINTENANCE_LOG │       │    FUEL_LOG     │       │     EXPENSE     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ description     │       │ liters          │       │ toll_cost       │
│ cost            │       │ cost            │       │ other_cost      │
│ date            │       │ date            │       │ vehicle_reg(FK) │
│ status          │       │ vehicle_reg(FK) │       │ trip_id (FK)    │
│ vehicle_reg(FK) │       └─────────────────┘       └─────────────────┘
└─────────────────┘
```

### Table Schema Definitions

#### 1. `vehicles`
* `reg_number` (String, PK, Unique): Vehicle Registration Number (e.g., `GJ01AB4527`).
* `model` (String): e.g., `VAN-05`, `TRUCK-11`.
* `type` (String): Options: `Van`, `Truck`, `Mini`.
* `max_load_capacity` (Float): Capacity value (e.g., 500.0) in kg or tons.
* `odometer` (Float): Current mileage of the vehicle.
* `acquisition_cost` (Float): Vehicle cost value for ROI calculations.
* `status` (String): Options: `Available`, `On Trip`, `In Shop`, `Retired`. Default is `Available`.

#### 2. `drivers`
* `id` (Integer, PK, AutoIncrement)
* `name` (String)
* `license_number` (String, Unique)
* `license_category` (String): Options: `LMV`, `HMV`.
* `license_expiry` (Date)
* `contact_number` (String)
* `trip_completion_rate` (Float): Default to `100.0`.
* `status` (String): Options: `Available`, `On Trip`, `Off Duty`, `Suspended`. Default is `Available`.

#### 3. `trips`
* `id` (Integer, PK, AutoIncrement)
* `source` (String)
* `destination` (String)
* `cargo_weight` (Float)
* `planned_distance` (Float)
* `actual_distance` (Float, Nullable)
* `status` (String): Options: `Draft`, `Dispatched`, `Completed`, `Cancelled`. Default is `Draft`.
* `vehicle_reg` (String, FK $\rightarrow$ `vehicles.reg_number`)
* `driver_id` (Integer, FK $\rightarrow$ `drivers.id`)

#### 4. `maintenance_logs`
* `id` (Integer, PK, AutoIncrement)
* `description` (String): Service description (e.g. `Oil Change`).
* `cost` (Float)
* `date` (Date)
* `status` (String): Options: `Active`, `Closed`. Default is `Active`.
* `vehicle_reg` (String, FK $\rightarrow$ `vehicles.reg_number`)

#### 5. `fuel_logs`
* `id` (Integer, PK, AutoIncrement)
* `liters` (Float)
* `cost` (Float)
* `date` (Date)
* `vehicle_reg` (String, FK $\rightarrow$ `vehicles.reg_number`)

#### 6. `expenses`
* `id` (Integer, PK, AutoIncrement)
* `toll_cost` (Float)
* `other_cost` (Float)
* `vehicle_reg` (String, FK $\rightarrow$ `vehicles.reg_number`)
* `trip_id` (Integer, FK $\rightarrow$ `trips.id`, Nullable)

---

## 🔐 2. Authentication & RBAC Middleware

To enable flexible testing, verify permissions against the user's role.
* During the hackathon, support an `X-Simulated-Role` header sent from the client. If it is present, use it to override the JWT role for easy visual testing of the switcher dropdown.
* Implement middleware `checkRole(allowedRoles: string[])`:
  ```typescript
  // Express example
  export const checkRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const activeRole = req.headers['x-simulated-role'] || req.user?.role;
      if (!activeRole) {
        return res.status(401).json({ error: "Unauthorized access" });
      }
      if (!allowedRoles.includes(activeRole as string)) {
        return res.status(403).json({ error: `Forbidden. Required role: ${allowedRoles.join(' or ')}` });
      }
      next();
    };
  };
  ```

### Permissions Configuration Checklist:
* `POST /api/vehicles` $\rightarrow$ Allowed: `["Fleet Manager"]`
* `POST /api/drivers` $\rightarrow$ Allowed: `["Fleet Manager", "Safety Officer"]`
* `POST /api/trips` $\rightarrow$ Allowed: `["Dispatcher"]`
* `POST /api/expenses` or `/api/fuel` $\rightarrow$ Allowed: `["Financial Analyst"]`
* `/api/analytics` endpoints $\rightarrow$ Allowed: `["Fleet Manager", "Financial Analyst"]`

---

## ⚡ 3. Critical Business Rules & Transactions

Implement these validations and database state-transitions:

### A. Trip Dispatch Validation (`POST /api/trips/:id/dispatch`)
1. Query the trip details, along with the assigned vehicle and driver records.
2. **Perform checks:**
   * Vehicle status must be `Available` (block if `On Trip`, `In Shop`, or `Retired`).
   * Driver status must be `Available` (block if `On Trip`, `Off Duty`, or `Suspended`).
   * Driver license expiry date must be greater than current date.
   * Cargo weight must not exceed the vehicle's max load capacity.
3. **Execute Transaction:**
   * Update Trip status $\rightarrow$ `Dispatched`.
   * Update Vehicle status $\rightarrow$ `On Trip`.
   * Update Driver status $\rightarrow$ `On Trip`.

### B. Trip Completion Flow (`POST /api/trips/:id/complete`)
1. Request body contains: `actual_distance`, `fuel_liters`, `fuel_cost`, `toll_cost`, `other_cost`.
2. **Execute Transaction:**
   * Validate that `vehicle.odometer + actual_distance > vehicle.odometer`.
   * Update Trip status $\rightarrow$ `Completed`.
   * Increment `vehicle.odometer` by `actual_distance`.
   * Update Vehicle status $\rightarrow$ `Available`.
   * Update Driver status $\rightarrow$ `Available`.
   * Insert record into `fuel_logs` (Vehicle, date, liters, fuel_cost).
   * Insert record into `expenses` (toll_cost, other_cost, vehicle_reg, trip_id).

### C. Maintenance Actions (`POST /api/maintenance`)
1. Create a `maintenance_log` record with status `Active`.
2. Automatically update `vehicle.status` $\rightarrow$ `In Shop`.
3. When updating a log status to `Closed`:
   * Update `vehicle.status` $\rightarrow$ `Available` (unless vehicle status is `Retired`).

---

## 📈 4. Reports & Aggregations Queries

Expose a `/api/analytics/summary` endpoint that computes the following:

1. **Fleet Utilization (%):**
   $$\text{Fleet Utilization} = \frac{\text{Vehicles with status 'On Trip'}}{\text{Total Vehicles (excluding 'Retired')}} \times 100$$
2. **Fuel Efficiency (km/L):**
   * Average of $\frac{\text{Distance travelled}}{\text{Liters consumed}}$ across completed trips.
3. **Total Operational Cost:**
   * Aggregation query:
     $$\text{Total Cost} = \sum(\text{fuel\_logs.cost}) + \sum(\text{maintenance\_logs.cost}) + \sum(\text{expenses.toll\_cost}) + \sum(\text{expenses.other\_cost})$$
4. **Vehicle ROI (Return on Investment):**
   * Let Revenue be calculated as: $\text{Planned Distance} \times \text{Rate Per Kilometer}$ (e.g. Rs 50/km, or mock revenue field in Trip table).
   * For each vehicle:
     $$\text{ROI} = \frac{\text{Allocated Trip Revenue} - (\text{Maintenance Cost} + \text{Fuel Cost})}{\text{Acquisition Cost}} \times 100$$
5. **Monthly Revenue & Costliest Vehicles:**
   * Support a query returning monthly revenue groupings for bar chart rendering.
   * Support an ordered query returning the top 5 vehicles ranked by maintenance + fuel costs.
