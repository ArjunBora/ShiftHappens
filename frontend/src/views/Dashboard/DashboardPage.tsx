import React, { useState, useEffect } from 'react';
import { KpiCard } from '../../components/shared/KpiCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { getAnalyticsSummary, getTrips, getVehicles, getDrivers } from '../../services/api';

interface RecentTrip {
  id: number;
  vehicle: string;
  driver: string;
  status: 'on_trip' | 'completed' | 'dispatched' | 'draft';
  eta: string;
}

export function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<RecentTrip[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<any[]>([]);
  
  // KPI state
  const [kpis, setKpis] = useState({
    activeVehicles: 0,
    available: 0,
    inShop: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    utilization: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, tRes, vRes, dRes] = await Promise.all([
        getAnalyticsSummary(),
        getTrips(),
        getVehicles(),
        getDrivers()
      ]);

      const vehicles = vRes.data;
      const drivers = dRes.data;
      const apiTrips = tRes.data;

      // Calculate Vehicle Status distributions
      const totalActive = vehicles.filter((v: any) => v.status !== 'Retired').length || 1;
      const statusCounts = {
        Available: vehicles.filter((v: any) => v.status === 'Available').length,
        'On Trip': vehicles.filter((v: any) => v.status === 'On Trip').length,
        'In Shop': vehicles.filter((v: any) => v.status === 'In Shop').length,
        Retired: vehicles.filter((v: any) => v.status === 'Retired').length
      };

      const totalVeh = vehicles.length || 1;
      const mappedStatuses = [
        { label: 'Available', count: statusCounts.Available, total: totalVeh, color: 'bg-emerald-500' },
        { label: 'On Trip', count: statusCounts["On Trip"], total: totalVeh, color: 'bg-blue-500' },
        { label: 'In Shop', count: statusCounts["In Shop"], total: totalVeh, color: 'bg-amber-500' },
        { label: 'Retired', count: statusCounts.Retired, total: totalVeh, color: 'bg-red-500' }
      ];

      // Map recent trips
      const mappedTrips = apiTrips.slice(-5).reverse().map((t: any) => {
        const d = drivers.find((driver: any) => driver.id === t.driverId);
        return {
          id: t.id,
          vehicle: t.vehicleReg,
          driver: d ? d.name : `Driver #${t.driverId}`,
          status: t.status.toLowerCase() as any,
          eta: t.status === 'Dispatched' ? 'In transit' : '—'
        };
      });

      setVehicleStatuses(mappedStatuses);
      setTrips(mappedTrips);
      setKpis({
        activeVehicles: statusCounts["On Trip"],
        available: statusCounts.Available,
        inShop: statusCounts["In Shop"],
        activeTrips: apiTrips.filter((t: any) => t.status === 'Dispatched').length,
        pendingTrips: apiTrips.filter((t: any) => t.status === 'Draft').length,
        driversOnDuty: drivers.filter((d: any) => d.status === 'Available' || d.status === 'On Trip').length,
        utilization: Math.round(summaryRes.data.fleetUtilization || 0)
      });
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Operations Dashboard</h2>
        <p className="text-sm text-slate-400">Real-time snapshots of fleet utilization and trip logs</p>
      </div>

      {loading ? (
        <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl p-12 text-center text-slate-500 font-medium">
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          {/* KPI Cards Row (7 Columns) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <KpiCard label="Active Vehicles" value={String(kpis.activeVehicles)} accent="green" />
            <KpiCard label="Available" value={String(kpis.available)} accent="green" />
            <KpiCard label="In Shop" value={String(kpis.inShop)} accent="orange" />
            <KpiCard label="Active Trips" value={String(kpis.activeTrips)} accent="blue" />
            <KpiCard label="Pending Trips" value={String(kpis.pendingTrips)} accent="blue" />
            <KpiCard label="Drivers On Duty" value={String(kpis.driversOnDuty)} accent="blue" />
            <KpiCard label="Utilization" value={`${kpis.utilization}%`} accent="green" />
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Side: Recent Trips Table (65%) */}
            <div className="lg:col-span-8 bg-[#1A1D27] border border-[#2E3148] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#2E3148]">
                <h3 className="text-base font-semibold text-white">Recent Trips</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
                    <tr>
                      <th className="px-6 py-4">Trip</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Driver</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">ETA/Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E3148]">
                    {trips.length > 0 ? (
                      trips.map((trip) => (
                        <tr key={trip.id} className="hover:bg-[#232635] transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-white">TR-{trip.id}</td>
                          <td className="px-6 py-4 font-mono">{trip.vehicle}</td>
                          <td className="px-6 py-4">{trip.driver}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={trip.status as StatusType} />
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-medium">{trip.eta}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No recent trips recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: Vehicle Status Summary (35%) */}
            <div className="lg:col-span-4 bg-[#1A1D27] border border-[#2E3148] rounded-xl p-6 space-y-5">
              <h3 className="text-base font-semibold text-white">Vehicle Status</h3>

              <div className="space-y-4">
                {vehicleStatuses.map((status) => {
                  const widthPercentage = status.total > 0 ? (status.count / status.total) * 100 : 0;
                  return (
                    <div key={status.label} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{status.label}</span>
                        <span className="text-slate-400 font-mono">
                          {status.count} ({Math.round(widthPercentage)}%)
                        </span>
                      </div>
                      {/* Custom Progress Bar */}
                      <div className="w-full h-3 bg-[#0F1117] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${status.color}`}
                          style={{ width: `${widthPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
