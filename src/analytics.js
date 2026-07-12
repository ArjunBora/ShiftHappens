export const buildAnalyticsSummary = ({ vehicles = [], trips = [], fuelLogs = [], maintenanceLogs = [], expenses = [] }) => {
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== 'Retired');
  const onTripVehicles = vehicles.filter((vehicle) => vehicle.status === 'On Trip').length;
  const completedTrips = trips.filter((trip) => trip.status === 'Completed');
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost || 0), 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + Number(log.cost || 0), 0);
  const totalExpenseCost = expenses.reduce((sum, expense) => sum + Number(expense.tollCost || 0) + Number(expense.otherCost || 0), 0);

  const fleetUtilization = activeVehicles.length > 0 ? (onTripVehicles / activeVehicles.length) * 100 : 0;
  const fuelEfficiency = completedTrips.length > 0
    ? completedTrips.reduce((sum, trip) => {
        const tripFuelLogs = fuelLogs.filter((log) => {
          const matchesTripId = Number(log.tripId || 0) === trip.id;
          const matchesVehicleReg = log.vehicleReg === trip.vehicleReg;
          return matchesTripId || matchesVehicleReg;
        });
        const liters = tripFuelLogs.reduce((total, log) => total + Number(log.liters || 0), 0);
        const efficiency = liters > 0 ? Number(trip.actualDistance || 0) / liters : 0;
        return sum + efficiency;
      }, 0) / completedTrips.length
    : 0;

  const vehicleROI = vehicles.map((vehicle) => {
    const vehicleFuel = fuelLogs.filter((log) => log.vehicleReg === vehicle.regNumber).reduce((sum, log) => sum + Number(log.cost || 0), 0);
    const vehicleMaintenance = maintenanceLogs.filter((log) => log.vehicleReg === vehicle.regNumber).reduce((sum, log) => sum + Number(log.cost || 0), 0);
    const vehicleRevenue = trips.filter((trip) => trip.vehicleReg === vehicle.regNumber).reduce((sum, trip) => sum + Number(trip.revenue || 0), 0);
    const roi = Number(vehicle.acquisitionCost || 0) > 0 ? ((vehicleRevenue - (vehicleMaintenance + vehicleFuel)) / Number(vehicle.acquisitionCost || 0)) * 100 : 0;

    return {
      vehicleReg: vehicle.regNumber,
      roi
    };
  });

  const monthlyRevenue = completedTrips.reduce((acc, trip) => {
    const month = new Date(trip.completedAt || Date.now()).toLocaleString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + Number(trip.revenue || 0);
    return acc;
  }, {});

  const costliestVehicles = vehicles
    .map((vehicle) => ({
      vehicleReg: vehicle.regNumber,
      totalCost: fuelLogs.filter((log) => log.vehicleReg === vehicle.regNumber).reduce((sum, log) => sum + Number(log.cost || 0), 0) + maintenanceLogs.filter((log) => log.vehicleReg === vehicle.regNumber).reduce((sum, log) => sum + Number(log.cost || 0), 0)
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 5);

  return {
    fleetUtilization: Number(fleetUtilization.toFixed(2)),
    fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
    totalOperationalCost: Number((totalFuelCost + totalMaintenanceCost + totalExpenseCost).toFixed(2)),
    vehicleROI,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, value]) => ({ month, revenue: Number(value.toFixed(2)) })),
    costliestVehicles
  };
};
