import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ShieldAlert, CheckCircle, Lock, TrendingUp } from 'lucide-react';
import { KpiCard } from '../../components/shared/KpiCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useRole } from '../../context/AuthContext';
import { getAnalyticsSummary, getTrips, getVehicles, getDrivers } from '../../services/api';

interface RecentTrip {
  id: number;
  vehicle: string;
  driver: string;
  status: 'on_trip' | 'completed' | 'dispatched' | 'draft';
  eta: string;
}

interface ExpiringDriver {
  id: number;
  name: string;
  daysLeft: number;
  expired: boolean;
  expiryDate: string;
}

export function DashboardPage() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<RecentTrip[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<any[]>([]);
  const [expiringDrivers, setExpiringDrivers] = useState<ExpiringDriver[]>([]);
  
  // KPI & charts analytics state
  const [analytics, setAnalytics] = useState<any>({
    fleetUtilization: 0,
    fuelEfficiency: 0,
    totalOperationalCost: 0,
    vehicleROI: [],
    monthlyRevenue: []
  });

  const [kpis, setKpis] = useState({
    onTrip: 0,
    available: 0,
    inShop: 0,
    activeTrips: 0,
    utilization: 0,
    pendingTrips: 0
  });

  // Check permission for Financial Cost data (FA and FM only)
  const canViewFinancials = role === 'Fleet Manager' || role === 'Financial Analyst';

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
      const summary = summaryRes.data;

      setAnalytics({
        fleetUtilization: summary.fleetUtilization || 0,
        fuelEfficiency: summary.fuelEfficiency || 0,
        totalOperationalCost: summary.totalOperationalCost || 0,
        vehicleROI: summary.vehicleROI || [],
        monthlyRevenue: summary.monthlyRevenue || []
      });

      // Calculate Vehicle Status distributions
      const statusCounts = {
        Available: vehicles.filter((v: any) => v.status === 'Available').length,
        'On Trip': vehicles.filter((v: any) => v.status === 'On Trip').length,
        'In Shop': vehicles.filter((v: any) => v.status === 'In Shop').length,
        Retired: vehicles.filter((v: any) => v.status === 'Retired').length
      };

      const totalVeh = vehicles.length || 1;
      const mappedStatuses = [
        { label: 'Available', count: statusCounts.Available, total: totalVeh, color: 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]' },
        { label: 'On Trip', count: statusCounts["On Trip"], total: totalVeh, color: 'bg-gradient-to-r from-blue-500 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.25)]' },
        { label: 'In Shop', count: statusCounts["In Shop"], total: totalVeh, color: 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]' },
        { label: 'Retired', count: statusCounts.Retired, total: totalVeh, color: 'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]' }
      ];

      // Map recent trips (last 5)
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

      // Filter drivers expiring within 30 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiringList = drivers
        .map((d: any) => {
          const expiry = new Date(d.licenseExpiry);
          expiry.setHours(0, 0, 0, 0);
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return {
            id: d.id,
            name: d.name,
            daysLeft: diffDays,
            expired: diffDays < 0,
            expiryDate: expiry.toLocaleDateString('en-GB')
          };
        })
        .filter((d: any) => d.daysLeft <= 30)
        .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

      setVehicleStatuses(mappedStatuses);
      setTrips(mappedTrips);
      setExpiringDrivers(expiringList);

      setKpis({
        onTrip: statusCounts["On Trip"],
        available: statusCounts.Available,
        inShop: statusCounts["In Shop"],
        activeTrips: apiTrips.filter((t: any) => t.status === 'Dispatched').length,
        utilization: Math.round(summary.fleetUtilization || 0),
        pendingTrips: apiTrips.filter((t: any) => t.status === 'Draft').length
      });

    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to sync dashboard summary analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-instrument">Operations Dashboard</h2>
        <p className="text-sm text-slate-400">Real-time snapshots of fleet utilization and operations metrics</p>
      </div>

      {loading ? (
        <div className="glass-card p-16 text-center text-slate-500 font-medium">
          <div className="flex items-center justify-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#7b39fc] animate-ping" />
            <span>Loading dashboard telemetry...</span>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Row (7 Columns) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
            <KpiCard label="On Trip" value={String(kpis.onTrip)} accent="green" />
            <KpiCard label="Available" value={String(kpis.available)} accent="green" />
            <KpiCard label="In Shop" value={String(kpis.inShop)} accent="orange" />
            <KpiCard label="Active Trips" value={String(kpis.activeTrips)} accent="blue" />
            <KpiCard label="Utilization" value={`${analytics.fleetUtilization}%`} accent="green" />
            <KpiCard label="Fuel Efficiency" value={`${analytics.fuelEfficiency} km/L`} accent="blue" />
            <KpiCard 
              label="Operating Cost" 
              value={canViewFinancials ? `₹${analytics.totalOperationalCost.toLocaleString()}` : `Restricted`}
              accent="orange" 
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI Bar Chart (Financials Restricted) */}
            <div className="glass-card p-6 bg-slate-900/15 flex flex-col justify-between min-h-[300px]">
              <div className="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Vehicle ROI (%)</h3>
                {!canViewFinancials && (
                  <span className="text-[9px] font-extrabold uppercase bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Restricted
                  </span>
                )}
              </div>

              {canViewFinancials ? (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.vehicleROI} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="vehicleReg" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090a0f', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11 }} 
                        labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                      />
                      <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                        {analytics.vehicleROI.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.roi < 0 ? '#ef4444' : '#7b39fc'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-xl border border-white/5">
                  <Lock className="h-8 w-8 text-[#7b39fc] mb-2" />
                  <p className="text-xs font-bold text-white">Financial Data Restricted</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Restricted for {role}</p>
                </div>
              )}
            </div>

            {/* Monthly Revenue Line Chart */}
            <div className="glass-card p-6 bg-slate-900/15 flex flex-col justify-between min-h-[300px]">
              <div className="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monthly Revenue Trend</h3>
                <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Live Revenue
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090a0f', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11 }} 
                      labelStyle={{ fontWeight: 'bold', color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#7b39fc" strokeWidth={3} dot={{ fill: '#7b39fc', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Lower Grid: Recent Trips & Status Summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Recent Trips (65%) */}
            <div className="lg:col-span-8 glass-card overflow-hidden bg-slate-900/15">
              <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-wide">Recent Trips</h3>
                <span className="h-1.5 w-1.5 rounded-full bg-[#7b39fc] animate-pulse" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Trip</th>
                      <th className="px-6 py-4">Vehicle</th>
                      <th className="px-6 py-4">Driver</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">ETA/Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {trips.length > 0 ? (
                      trips.map((trip) => (
                        <tr key={trip.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#7b39fc]">TR-{trip.id}</td>
                          <td className="px-6 py-4 font-mono text-slate-200">{trip.vehicle}</td>
                          <td className="px-6 py-4 text-slate-300">{trip.driver}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={trip.status as StatusType} />
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-semibold">{trip.eta}</td>
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

            {/* Right Column: Vehicle status summary & license compliance (35%) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Vehicle status summary */}
              <div className="glass-card p-6 bg-slate-900/15 space-y-5">
                <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">Vehicle Status</h3>
                <div className="space-y-4">
                  {vehicleStatuses.map((status) => {
                    const widthPercentage = status.total > 0 ? (status.count / status.total) * 100 : 0;
                    return (
                      <div key={status.label} className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300 uppercase tracking-wider">{status.label}</span>
                          <span className="text-slate-400 font-mono">
                            {status.count} ({Math.round(widthPercentage)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${status.color}`}
                            style={{ width: `${widthPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* License compliance expiry panel */}
              <div className="glass-card p-6 bg-slate-900/15 space-y-4">
                <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3 flex items-center justify-between">
                  <span>License Expiry Alert</span>
                  <span className="bg-red-500/10 text-red-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/25">
                    {expiringDrivers.length} Alert{expiringDrivers.length !== 1 ? 's' : ''}
                  </span>
                </h3>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {expiringDrivers.length > 0 ? (
                    expiringDrivers.map((d) => (
                      <div 
                        key={d.id} 
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-1 transition-all ${
                          d.expired 
                            ? 'bg-red-950/15 border-red-500/20 text-red-400' 
                            : 'bg-amber-950/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{d.name}</span>
                          <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            d.expired ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {d.expired ? 'EXPIRED' : `${d.daysLeft}d left`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold leading-none mt-1">
                          Expiry Date: {d.expiryDate}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center bg-slate-950/30 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                      <p className="text-xs font-bold text-white">Compliance Check Clear</p>
                      <p className="text-[9.5px] uppercase tracking-wider text-slate-500">All driver licenses active</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
