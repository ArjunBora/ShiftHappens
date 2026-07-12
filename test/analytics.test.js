import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticsSummary } from '../src/analytics.js';

test('buildAnalyticsSummary calculates utilization, efficiency, cost, roi and revenue trends', () => {
  const summary = buildAnalyticsSummary({
    vehicles: [
      { regNumber: 'V1', status: 'On Trip', acquisitionCost: 1000 },
      { regNumber: 'V2', status: 'Available', acquisitionCost: 2000 },
      { regNumber: 'V3', status: 'Retired', acquisitionCost: 3000 }
    ],
    trips: [
      { id: 1, status: 'Completed', plannedDistance: 100, actualDistance: 90, vehicleReg: 'V1', revenue: 5000 },
      { id: 2, status: 'Completed', plannedDistance: 200, actualDistance: 180, vehicleReg: 'V2', revenue: 10000 }
    ],
    fuelLogs: [
      { vehicleReg: 'V1', cost: 100, liters: 3 },
      { vehicleReg: 'V2', cost: 50, liters: 6 }
    ],
    maintenanceLogs: [
      { vehicleReg: 'V1', cost: 200 },
      { vehicleReg: 'V2', cost: 100 }
    ],
    expenses: [
      { vehicleReg: 'V1', tollCost: 10, otherCost: 20 },
      { vehicleReg: 'V2', tollCost: 5, otherCost: 15 }
    ]
  });

  assert.equal(summary.fleetUtilization, 50);
  assert.equal(summary.fuelEfficiency, 30);
  assert.equal(summary.totalOperationalCost, 500);
  assert.equal(summary.vehicleROI.length, 3);
  assert.equal(summary.monthlyRevenue.length, 1);
  assert.equal(summary.costliestVehicles[0].vehicleReg, 'V1');
});
