import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();

  const vehicle = await prisma.vehicle.create({
    data: {
      regNumber: 'GJ01AB4527',
      model: 'VAN-05',
      type: 'Van',
      maxLoadCapacity: 500,
      odometer: 1200,
      acquisitionCost: 800000,
      status: 'Available'
    }
  });

  const driver = await prisma.driver.create({
    data: {
      name: 'Ravi Sharma',
      licenseNumber: 'DL123456',
      licenseCategory: 'LMV',
      licenseExpiry: new Date('2030-01-01'),
      contactNumber: '9999999999',
      tripCompletionRate: 100,
      status: 'Available'
    }
  });

  const trip = await prisma.trip.create({
    data: {
      source: 'Ahmedabad',
      destination: 'Rajkot',
      cargoWeight: 450,
      plannedDistance: 250,
      status: 'Draft',
      vehicleReg: vehicle.regNumber,
      driverId: driver.id,
      revenue: 12500
    }
  });

  await prisma.maintenanceLog.create({
    data: {
      description: 'Oil Change',
      cost: 2500,
      vehicleReg: vehicle.regNumber,
      status: 'Active'
    }
  });

  await prisma.fuelLog.create({
    data: {
      liters: 25,
      cost: 2100,
      vehicleReg: vehicle.regNumber,
      tripId: trip.id
    }
  });

  await prisma.expense.create({
    data: {
      tollCost: 300,
      otherCost: 150,
      vehicleReg: vehicle.regNumber,
      tripId: trip.id
    }
  });

  console.log('Seed data created');
}

main().finally(async () => {
  await prisma.$disconnect();
});
