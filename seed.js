import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database logs...');
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();

  console.log('Creating active vehicles...');
  // 1. Vehicles
  const v1 = await prisma.vehicle.create({
    data: {
      regNumber: 'GJ01AB4527',
      model: 'TATA Ultra T.7',
      type: 'Truck',
      maxLoadCapacity: 4500,
      odometer: 12500,
      acquisitionCost: 1500000,
      status: 'Available'
    }
  });

  const v2 = await prisma.vehicle.create({
    data: {
      regNumber: 'MH02CD8841',
      model: 'Mahindra Supro',
      type: 'Van',
      maxLoadCapacity: 1200,
      odometer: 8400,
      acquisitionCost: 650000,
      status: 'Available'
    }
  });

  const v3 = await prisma.vehicle.create({
    data: {
      regNumber: 'DL03EF1029',
      model: 'Ashok Leyland Dost',
      type: 'Mini',
      maxLoadCapacity: 2000,
      odometer: 18400,
      acquisitionCost: 750000,
      status: 'In Shop' // Undergoing maintenance
    }
  });

  const v4 = await prisma.vehicle.create({
    data: {
      regNumber: 'KA04GH5309',
      model: 'Eicher Pro 2049',
      type: 'Truck',
      maxLoadCapacity: 3500,
      odometer: 24000,
      acquisitionCost: 1200000,
      status: 'On Trip' // Active dispatch
    }
  });

  const v5 = await prisma.vehicle.create({
    data: {
      regNumber: 'HR05JK1102',
      model: 'Force Traveller',
      type: 'Van',
      maxLoadCapacity: 1800,
      odometer: 32000,
      acquisitionCost: 950000,
      status: 'Retired' // Excluded from metrics
    }
  });

  console.log('Creating drivers with license statuses...');
  // 2. Drivers (Some unexpired, some expiring soon, some expired)
  const d1 = await prisma.driver.create({
    data: {
      name: 'Ravi Sharma',
      licenseNumber: 'DL-GJ01202049',
      licenseCategory: 'HMV',
      licenseExpiry: new Date('2032-05-15'), // Compliant
      contactNumber: '9876543210',
      tripCompletionRate: 98.4,
      status: 'Available'
    }
  });

  const d2 = await prisma.driver.create({
    data: {
      name: 'Suresh Patel',
      licenseNumber: 'DL-MH02201988',
      licenseCategory: 'LMV',
      licenseExpiry: new Date('2026-07-28'), // Expiring soon (<30 days left)
      contactNumber: '9922884411',
      tripCompletionRate: 95.2,
      status: 'Available'
    }
  });

  const d3 = await prisma.driver.create({
    data: {
      name: 'Anita Desai',
      licenseNumber: 'DL-DL03201411',
      licenseCategory: 'LMV',
      licenseExpiry: new Date('2026-06-10'), // Expired (tint red)
      contactNumber: '9765432109',
      tripCompletionRate: 100.0,
      status: 'Available'
    }
  });

  const d4 = await prisma.driver.create({
    data: {
      name: 'David Miller',
      licenseNumber: 'DL-KA04202115',
      licenseCategory: 'HMV',
      licenseExpiry: new Date('2029-10-30'), // Compliant
      contactNumber: '8833994400',
      tripCompletionRate: 97.8,
      status: 'On Trip'
    }
  });

  console.log('Creating active and historical completed trips...');
  // 3. Completed Trips spread across May, June, July for revenue line graph
  // May Completed Trips
  const tMay1 = await prisma.trip.create({
    data: {
      source: 'Mumbai Depot',
      destination: 'Pune Hub',
      cargoWeight: 3000,
      plannedDistance: 150,
      actualDistance: 152,
      status: 'Completed',
      vehicleReg: v1.regNumber,
      driverId: d1.id,
      revenue: 25000,
      completedAt: new Date('2026-05-12T14:30:00Z')
    }
  });

  const tMay2 = await prisma.trip.create({
    data: {
      source: 'Thane Station',
      destination: 'Nasik Depot',
      cargoWeight: 1000,
      plannedDistance: 180,
      actualDistance: 180,
      status: 'Completed',
      vehicleReg: v2.regNumber,
      driverId: d2.id,
      revenue: 35000,
      completedAt: new Date('2026-05-28T18:15:00Z')
    }
  });

  // June Completed Trips (Shows rising revenue trend)
  const tJun1 = await prisma.trip.create({
    data: {
      source: 'Delhi Depot',
      destination: 'Agra Hub',
      cargoWeight: 4000,
      plannedDistance: 240,
      actualDistance: 245,
      status: 'Completed',
      vehicleReg: v1.regNumber,
      driverId: d1.id,
      revenue: 65000,
      completedAt: new Date('2026-06-05T12:00:00Z')
    }
  });

  const tJun2 = await prisma.trip.create({
    data: {
      source: 'Gurugram Facility',
      destination: 'Jaipur Depot',
      cargoWeight: 1500,
      plannedDistance: 280,
      actualDistance: 290,
      status: 'Completed',
      vehicleReg: v4.regNumber,
      driverId: d4.id,
      revenue: 85000,
      completedAt: new Date('2026-06-22T17:45:00Z')
    }
  });

  // July Completed Trips
  const tJul1 = await prisma.trip.create({
    data: {
      source: 'Bengaluru Depot',
      destination: 'Chennai Hub',
      cargoWeight: 3500,
      plannedDistance: 350,
      actualDistance: 360,
      status: 'Completed',
      vehicleReg: v4.regNumber,
      driverId: d4.id,
      revenue: 125000,
      completedAt: new Date('2026-07-02T10:00:00Z')
    }
  });

  // Active / Dispatched Trip
  const tActive = await prisma.trip.create({
    data: {
      source: 'Ahmedabad Depot',
      destination: 'Rajkot Hub',
      cargoWeight: 2200,
      plannedDistance: 220,
      status: 'Dispatched',
      vehicleReg: v4.regNumber,
      driverId: d4.id,
      revenue: 11000
    }
  });

  // Draft Trip
  await prisma.trip.create({
    data: {
      source: 'Gandhinagar Hub',
      destination: 'Surat Facility',
      cargoWeight: 800,
      plannedDistance: 280,
      status: 'Draft',
      vehicleReg: v2.regNumber,
      driverId: d2.id,
      revenue: 14000
    }
  });

  console.log('Creating active maintenance records...');
  // 4. Maintenance Logs
  await prisma.maintenanceLog.create({
    data: {
      description: 'Active Engine Service and Brake Calipers Tuneup',
      cost: 8500,
      vehicleReg: v3.regNumber,
      status: 'Active',
      date: new Date('2026-07-10')
    }
  });

  await prisma.maintenanceLog.create({
    data: {
      description: 'Completed Radiator Replacement',
      cost: 14500,
      vehicleReg: v1.regNumber,
      status: 'Closed',
      date: new Date('2026-06-15')
    }
  });

  console.log('Creating active fuel logs...');
  // 5. Fuel Logs
  await prisma.fuelLog.create({
    data: {
      liters: 120,
      cost: 11500,
      vehicleReg: v1.regNumber,
      tripId: tMay1.id,
      date: new Date('2026-05-12')
    }
  });

  await prisma.fuelLog.create({
    data: {
      liters: 95,
      cost: 9200,
      vehicleReg: v4.regNumber,
      tripId: tJun2.id,
      date: new Date('2026-06-22')
    }
  });

  await prisma.fuelLog.create({
    data: {
      liters: 140,
      cost: 13800,
      vehicleReg: v4.regNumber,
      tripId: tJul1.id,
      date: new Date('2026-07-02')
    }
  });

  console.log('Creating toll and other expenses records...');
  // 6. Expenses
  await prisma.expense.create({
    data: {
      tollCost: 1200,
      otherCost: 800,
      vehicleReg: v1.regNumber,
      tripId: tMay1.id
    }
  });

  await prisma.expense.create({
    data: {
      tollCost: 1500,
      otherCost: 1200,
      vehicleReg: v4.regNumber,
      tripId: tJun2.id
    }
  });

  console.log('Seed data successfully fully populated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
