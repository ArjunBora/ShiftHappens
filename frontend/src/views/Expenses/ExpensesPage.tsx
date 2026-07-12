import React, { useState, useEffect } from 'react';
import { Fuel, DollarSign, Plus, ShieldAlert } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getFuelLogs,
  getExpenses,
  getVehicles,
  getTrips,
  createFuelLog,
  createExpense
} from '../../services/api';

interface FuelLog {
  id: number;
  vehicle_reg: string;
  date: string;
  liters: number;
  cost: number;
}

interface OtherExpense {
  id: number;
  trip_id: string;
  vehicle_reg: string;
  toll: number;
  other: number;
  maint_linked: number;
}

export function ExpensesPage() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [trips, setTrips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Fuel form state
  const [fuelVehicle, setFuelVehicle] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Expense form state
  const [expTrip, setExpTrip] = useState('');
  const [expVehicle, setExpVehicle] = useState('');
  const [expToll, setExpToll] = useState('');
  const [expOther, setExpOther] = useState('');
  const [expMaint, setExpMaint] = useState('');

  const [error, setError] = useState('');

  // RBAC Permission: Financial Analyst can log fuel & expenses
  const canEditExpenses = role === 'Financial Analyst';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fRes, eRes, vRes, tRes] = await Promise.all([
        getFuelLogs(),
        getExpenses(),
        getVehicles(),
        getTrips()
      ]);

      const mappedFuel = fRes.data.map((fl: any) => ({
        id: fl.id,
        vehicle_reg: fl.vehicleReg,
        date: new Date(fl.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        liters: fl.liters,
        cost: fl.cost
      }));

      const mappedExpenses = eRes.data.map((ex: any) => ({
        id: ex.id,
        trip_id: ex.tripId ? `TR-${ex.tripId}` : '—',
        vehicle_reg: ex.vehicleReg,
        toll: ex.tollCost,
        other: ex.otherCost,
        maint_linked: 0 // maintenance cost is computed separately in analytics, or set to 0 for log
      }));

      const activeVehicles = vRes.data.map((v: any) => v.regNumber);
      const activeTrips = tRes.data.map((t: any) => String(t.id));

      setFuelLogs(mappedFuel);
      setOtherExpenses(mappedExpenses);
      setVehicles(activeVehicles);
      setTrips(activeTrips);

      if (activeVehicles.length > 0) {
        setFuelVehicle(activeVehicles[0]);
        setExpVehicle(activeVehicles[0]);
      }
      if (activeTrips.length > 0) {
        setExpTrip(activeTrips[0]);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load operational expenses data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fuelLiters || !fuelCost) {
      setError('Please fill in liters and cost.');
      return;
    }

    try {
      const payload = {
        vehicleReg: fuelVehicle,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        date: new Date().toISOString()
      };

      await createFuelLog(payload);
      showToast('Fuel refueling logged successfully!', 'success');
      setIsFuelModalOpen(false);
      setFuelLiters('');
      setFuelCost('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log fuel.');
      showToast(err.response?.data?.error || 'Failed to log fuel.', 'error');
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        tripId: expTrip ? Number(expTrip) : null,
        vehicleReg: expVehicle,
        tollCost: Number(expToll) || 0,
        otherCost: Number(expOther) || 0
      };

      await createExpense(payload);
      showToast('Operational expense logged successfully!', 'success');
      setIsExpenseModalOpen(false);
      setExpToll('');
      setExpOther('');
      setExpMaint('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log expense.');
      showToast(err.response?.data?.error || 'Failed to log expense.', 'error');
    }
  };

  // Calculations
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const totalTolls = otherExpenses.reduce((acc, curr) => acc + curr.toll, 0);
  const totalOther = otherExpenses.reduce((acc, curr) => acc + curr.other, 0);
  const totalOperationalCost = totalFuelCost + totalTolls + totalOther;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Fuel & Expense Management</h2>
          <p className="text-sm text-slate-400">Track vehicle refueling logs, toll receipts, and aggregate operating costs</p>
        </div>

        {canEditExpenses && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFuelModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Fuel className="h-4 w-4" />
              Log Fuel
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Fuel Logs Grid Table */}
      <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Fuel Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Liters</th>
                <th className="px-6 py-4 text-right">Fuel Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3148]">
              {fuelLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#232635] transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-white">{log.vehicle_reg}</td>
                  <td className="px-6 py-4 text-slate-400">{log.date}</td>
                  <td className="px-6 py-4 text-slate-300">{log.liters} L</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-300">Rs. {log.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Expenses Grid Table */}
      <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Other Expenses (Toll / Misc)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
              <tr>
                <th className="px-6 py-4">Trip</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4 text-right">Toll</th>
                <th className="px-6 py-4 text-right">Other</th>
                <th className="px-6 py-4 text-right">Maint. (Linked)</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3148]">
              {otherExpenses.map((exp) => {
                const rowTotal = exp.toll + exp.other + exp.maint_linked;
                return (
                  <tr key={exp.id} className="hover:bg-[#232635] transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">{exp.trip_id}</td>
                    <td className="px-6 py-4 font-mono">{exp.vehicle_reg}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-400">Rs. {exp.toll.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-400">Rs. {exp.other.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-400">Rs. {exp.maint_linked.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-200">Rs. {rowTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cost Footer Bar */}
      <div className="bg-[#1A1D27] border border-[#2E3148] p-5 rounded-xl flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Total Operational Cost (Auto) = Fuel + Maint + Tolls
        </span>
        <span className="text-2xl font-bold font-mono text-[#F59E0B]">
          Rs. {totalOperationalCost.toLocaleString()}
        </span>
      </div>

      {/* Fuel Log Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Fuel className="h-5 w-5 text-[#F59E0B]" />
                Log Fuel Refueling
              </h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleLogFuel} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex gap-2">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle</label>
                <select
                  value={fuelVehicle}
                  onChange={(e) => setFuelVehicle(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Liters</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 40"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fuel Cost (Rs)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 3000"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-[#2E3148] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="px-4 py-2 border border-[#2E3148] hover:bg-[#232635] text-slate-300 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] rounded-lg text-sm font-semibold cursor-pointer">
                  Log Fuel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#F59E0B]" />
                Log Operations Expense
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleLogExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Linked Trip</label>
                  <select
                    value={expTrip}
                    onChange={(e) => setExpTrip(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  >
                    <option value="">No trip link</option>
                    {trips.map(t => <option key={t} value={t}>TR-{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle</label>
                  <select
                    value={expVehicle}
                    onChange={(e) => setExpVehicle(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Toll</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expToll}
                    onChange={(e) => setExpToll(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Other</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expOther}
                    onChange={(e) => setExpOther(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Maint</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expMaint}
                    onChange={(e) => setExpMaint(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-[#2E3148] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-[#2E3148] hover:bg-[#232635] text-slate-300 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] rounded-lg text-sm font-semibold cursor-pointer">
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
