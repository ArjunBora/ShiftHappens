import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { KpiCard } from '../../components/shared/KpiCard';
import { useToast } from '../../context/ToastContext';
import { getAnalyticsSummary } from '../../services/api';

interface SummaryData {
  fleetUtilization: number;
  fuelEfficiency: number;
  totalOperationalCost: number;
  vehicleROI: Array<{ vehicleReg: string; roi: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  costliestVehicles: Array<{ vehicleReg: string; totalCost: number }>;
}

export function AnalyticsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SummaryData>({
    fleetUtilization: 0,
    fuelEfficiency: 0,
    totalOperationalCost: 0,
    vehicleROI: [],
    monthlyRevenue: [],
    costliestVehicles: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await getAnalyticsSummary();
        setData(res.data);
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Failed to load analytics summary', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const averageROI = data.vehicleROI.length > 0 
    ? data.vehicleROI.reduce((sum, v) => sum + v.roi, 0) / data.vehicleROI.length 
    : 0;

  const maxCost = data.costliestVehicles.length > 0 
    ? Math.max(...data.costliestVehicles.map(v => v.totalCost), 1000) 
    : 1000;

  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Reports & Analytics</h2>
        <p className="text-sm text-slate-400">Monitor fleet efficiency, operational expenses, and asset yields</p>
      </div>

      {loading ? (
        <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl p-12 text-center text-slate-500 font-medium">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Analytics KPIs (4 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Fuel Efficiency" value={`${data.fuelEfficiency} km/l`} accent="blue" />
            <KpiCard label="Fleet Utilization" value={`${data.fleetUtilization}%`} accent="green" />
            <KpiCard label="Operational Cost" value={`Rs. ${data.totalOperationalCost.toLocaleString()}`} accent="orange" />
            <KpiCard label="Vehicle ROI" value={`${averageROI.toFixed(1)}%`} accent="green" />
          </div>

          {/* ROI Formula Legend */}
          <div className="bg-[#1A1D27] border border-[#2E3148] px-4 py-2.5 rounded-lg text-xs text-slate-400 font-medium">
            📚 Calculation Formula: <code className="text-white font-mono bg-[#0F1117] px-1.5 py-0.5 rounded">ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost</code>
          </div>

          {/* Split layout charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Monthly Revenue Bar Chart (7 cols) */}
            <div className="lg:col-span-7 bg-[#1A1D27] border border-[#2E3148] rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-white">Monthly Revenue</h3>
              <div className="h-64 w-full">
                {data.monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2E3148" vertical={false} />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2E3148' }}
                        labelStyle={{ color: '#F1F5F9' }}
                        itemStyle={{ color: '#F59E0B' }}
                      />
                      <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No revenue data recorded. Complete trips to generate revenue.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Top Costliest Vehicles (5 cols) */}
            <div className="lg:col-span-5 bg-[#1A1D27] border border-[#2E3148] rounded-xl p-6 space-y-6">
              <h3 className="text-base font-semibold text-white">Top Costliest Vehicles</h3>
              
              <div className="space-y-4">
                {data.costliestVehicles.length > 0 ? (
                  data.costliestVehicles.map((vehicle, idx) => {
                    const widthPercentage = Math.min((vehicle.totalCost / maxCost) * 100, 100);
                    return (
                      <div key={vehicle.vehicleReg} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-white font-mono">{vehicle.vehicleReg}</span>
                          <span className="text-slate-400">Rs. {vehicle.totalCost.toLocaleString()}</span>
                        </div>
                        {/* Progress Bar Container */}
                        <div className="w-full h-3 bg-[#0F1117] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${colors[idx % colors.length]}`}
                            style={{ width: `${widthPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 text-sm py-4 text-center">
                    No cost logs recorded.
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
                ℹ️ Top costliest metrics aggregate both linked fuel logs and completed maintenance service records.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
