import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { checkRole } from './middleware/checkRole.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/vehicles', checkRole(['Fleet Manager']), async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/drivers', checkRole(['Fleet Manager', 'Safety Officer']), async (req, res) => {
  try {
    const driver = await prisma.driver.create({ data: req.body });
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/trips', checkRole(['Dispatcher']), async (req, res) => {
  try {
    const trip = await prisma.trip.create({ data: req.body });
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/expenses', checkRole(['Financial Analyst']), async (req, res) => {
  try {
    const expense = await prisma.expense.create({ data: req.body });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/fuel', checkRole(['Financial Analyst']), async (req, res) => {
  try {
    const fuelLog = await prisma.fuelLog.create({ data: req.body });
    res.status(201).json(fuelLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/trips/:id/dispatch', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: Number(req.params.id) },
      include: { vehicle: true, driver: true }
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.vehicle.status !== 'Available') {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }

    if (trip.driver.status !== 'Available') {
      return res.status(400).json({ error: 'Driver is not available' });
    }

    if (new Date(trip.driver.licenseExpiry) <= new Date()) {
      return res.status(400).json({ error: 'Driver license has expired' });
    }

    if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) {
      return res.status(400).json({ error: 'Cargo exceeds vehicle capacity' });
    }

    await prisma.$transaction([
      prisma.trip.update({ where: { id: trip.id }, data: { status: 'Dispatched' } }),
      prisma.vehicle.update({ where: { regNumber: trip.vehicleReg }, data: { status: 'On Trip' } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'On Trip' } })
    ]);

    res.json({ message: 'Trip dispatched successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/trips/:id/complete', async (req, res) => {
  try {
    const { actualDistance, fuelLiters, fuelCost, tollCost, otherCost } = req.body;
    const trip = await prisma.trip.findUnique({
      where: { id: Number(req.params.id) },
      include: { vehicle: true, driver: true }
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.vehicle.odometer + actualDistance <= trip.vehicle.odometer) {
      return res.status(400).json({ error: 'Invalid actual distance' });
    }

    await prisma.$transaction([
      prisma.trip.update({ where: { id: trip.id }, data: { status: 'Completed', actualDistance } }),
      prisma.vehicle.update({ where: { regNumber: trip.vehicleReg }, data: { odometer: trip.vehicle.odometer + actualDistance, status: 'Available' } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'Available' } }),
      prisma.fuelLog.create({ data: { liters: fuelLiters, cost: fuelCost, vehicleReg: trip.vehicleReg } }),
      prisma.expense.create({ data: { tollCost, otherCost, vehicleReg: trip.vehicleReg, tripId: trip.id } })
    ]);

    res.json({ message: 'Trip completed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const { description, cost, vehicleReg } = req.body;
    const vehicle = await prisma.vehicle.findUnique({ where: { regNumber: vehicleReg } });

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const maintenanceLog = await prisma.maintenanceLog.create({
      data: {
        description,
        cost,
        vehicleReg,
        status: 'Active'
      }
    });

    await prisma.vehicle.update({ where: { regNumber: vehicleReg }, data: { status: 'In Shop' } });

    res.status(201).json(maintenanceLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/maintenance/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const maintenanceLog = await prisma.maintenanceLog.findUnique({ where: { id: Number(req.params.id) } });

    if (!maintenanceLog) return res.status(404).json({ error: 'Maintenance log not found' });

    const updatedLog = await prisma.maintenanceLog.update({ where: { id: maintenanceLog.id }, data: { status } });

    if (status === 'Closed') {
      const vehicle = await prisma.vehicle.findUnique({ where: { regNumber: maintenanceLog.vehicleReg } });
      if (vehicle && vehicle.status !== 'Retired') {
        await prisma.vehicle.update({ where: { regNumber: maintenanceLog.vehicleReg }, data: { status: 'Available' } });
      }
    }

    res.json(updatedLog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analytics/summary', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    const completedTrips = await prisma.trip.findMany({ where: { status: 'Completed' } });
    const fuelLogs = await prisma.fuelLog.findMany();
    const maintenanceLogs = await prisma.maintenanceLog.findMany();
    const expenses = await prisma.expense.findMany();

    const fleetUtilization = vehicles.filter(v => v.status === 'On Trip').length / Math.max(vehicles.filter(v => v.status !== 'Retired').length, 1) * 100;
    const fuelEfficiency = completedTrips.length
      ? completedTrips.reduce((sum, trip) => sum + ((trip.actualDistance || 0) / Math.max(1, trip.cargoWeight || 1)), 0) / completedTrips.length
      : 0;
    const totalOperationalCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0) + maintenanceLogs.reduce((sum, log) => sum + log.cost, 0) + expenses.reduce((sum, expense) => sum + expense.tollCost + expense.otherCost, 0);

    res.json({
      fleetUtilization,
      fuelEfficiency,
      totalOperationalCost,
      vehicles: vehicles.length,
      completedTrips: completedTrips.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`TransitOps backend listening on port ${PORT}`);
});
