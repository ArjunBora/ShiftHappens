import React, { useState, useEffect } from 'react';
import { Fuel, DollarSign, Wrench, ShieldAlert, Download, Lock, CheckCircle } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  getFuelLogs, 
  getExpenses, 
  getVehicles, 
  getTrips, 
  createFuelLog, 
  createExpense,
  getMaintenance,
  patchMaintenance 
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
}

interface MaintenanceLog {
  id: number;
  description: string;
  cost: number;
  date: string;
  status: 'Active' | 'Closed';
  vehicle_reg: string;
}

export function ExpensesPage() {
  const { role } = useRole();
  const { showToast } = useToast();
  
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [trips, setTrips] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [fuelLogsAvailable, setFuelLogsAvailable] = useState(true);
  const [expensesAvailable, setExpensesAvailable] = useState(true);
  const [maintAvailable, setMaintAvailable] = useState(true);

  // Fuel form state
  const [fuelVehicle, setFuelVehicle] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelError, setFuelError] = useState('');

  // Expense form state
  const [expTrip, setExpTrip] = useState('');
  const [expVehicle, setExpVehicle] = useState('');
  const [expToll, setExpToll] = useState('');
  const [expOther, setExpOther] = useState('');
  const [expError, setExpError] = useState('');

  const canEditExpenses = role === 'Financial Analyst';

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Load vehicles and trips
      const [vRes, tRes] = await Promise.all([
        getVehicles().catch(() => ({ data: [] })),
        getTrips().catch(() => ({ data: [] }))
      ]);

      const activeVehicles = vRes.data.map((v: any) => v.regNumber);
      const activeTrips = tRes.data.map((t: any) => String(t.id));
      setVehicles(activeVehicles);
      setTrips(activeTrips);

      if (activeVehicles.length > 0) {
        setFuelVehicle(activeVehicles[0]);
        setExpVehicle(activeVehicles[0]);
      }
      if (activeTrips.length > 0) {
        setExpTrip(activeTrips[0]);
      }

      // Safe fetch for fuel logs
      try {
        const fRes = await getFuelLogs();
        const mappedFuel = fRes.data.map((fl: any) => ({
          id: fl.id,
          vehicle_reg: fl.vehicleReg,
          date: new Date(fl.date).toLocaleDateString('en-GB'),
          liters: fl.liters,
          cost: fl.cost
        }));
        setFuelLogs(mappedFuel);
        setFuelLogsAvailable(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setFuelLogsAvailable(false);
        } else {
          showToast('Failed to load fuel history logs', 'error');
        }
      }

      // Safe fetch for expenses
      try {
        const eRes = await getExpenses();
        const mappedExpenses = eRes.data.map((ex: any) => ({
          id: ex.id,
          trip_id: ex.tripId ? `TR-${ex.tripId}` : '—',
          vehicle_reg: ex.vehicleReg,
          toll: ex.tollCost,
          other: ex.otherCost
        }));
        setOtherExpenses(mappedExpenses);
        setExpensesAvailable(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setExpensesAvailable(false);
        } else {
          showToast('Failed to load operational expenses history', 'error');
        }
      }

      // Safe fetch for maintenance logs
      // We will merge fetched logs with local storage logs to ensure the dispatcher flow works even if 404
      let fetchedMaint: MaintenanceLog[] = [];
      try {
        const mRes = await getMaintenance();
        fetchedMaint = mRes.data.map((ml: any) => ({
          id: ml.id,
          description: ml.description,
          cost: ml.cost,
          date: new Date(ml.date).toLocaleDateString('en-GB'),
          status: ml.status,
          vehicle_reg: ml.vehicleReg
        }));
        setMaintAvailable(true);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setMaintAvailable(false);
        } else {
          showToast('Failed to load maintenance history', 'error');
        }
      }

      // Fetch local storage maintenance logs
      const localMaintString = localStorage.getItem('local_maintenance_logs');
      const localMaint: MaintenanceLog[] = localMaintString ? JSON.parse(localMaintString) : [];
      
      // Combine logs, removing duplicates by id
      const combinedMaint = [...fetchedMaint];
      localMaint.forEach(lm => {
        if (!combinedMaint.some(cm => cm.id === lm.id)) {
          combinedMaint.push(lm);
        }
      });
      setMaintenanceLogs(combinedMaint);

    } catch (err: any) {
      showToast('Error syncing operational logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError('');

    if (!fuelLiters || !fuelCost || !fuelVehicle) {
      setFuelError('All fields are required.');
      return;
    }

    try {
      const payload = {
        vehicleReg: fuelVehicle,
        liters: Number(fuelLiters),
        cost: Number(fuelCost)
      };

      await createFuelLog(payload);
      showToast('Fuel refueling logged successfully!', 'success');
      setFuelLiters('');
      setFuelCost('');
      fetchData();
    } catch (err: any) {
      setFuelError(err.response?.data?.error || 'Failed to log refueling.');
      showToast(err.response?.data?.error || 'Failed to log refueling.', 'error');
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError('');

    if (!expVehicle) {
      setExpError('Vehicle selection is required.');
      return;
    }

    try {
      const payload = {
        tripId: expTrip ? Number(expTrip) : null,
        vehicleReg: expVehicle,
        tollCost: Number(expToll) || 0,
        otherCost: Number(expOther) || 0
      };

      await createExpense(payload);
      showToast('Expense logged successfully!', 'success');
      setExpToll('');
      setExpOther('');
      fetchData();
    } catch (err: any) {
      setExpError(err.response?.data?.error || 'Failed to log operations expense.');
      showToast(err.response?.data?.error || 'Failed to log operations expense.', 'error');
    }
  };

  const handleCloseMaintenance = async (id: number) => {
    try {
      await patchMaintenance(id, { status: 'Closed' });
      showToast('Vehicle maintenance status closed and vehicle released!', 'success');
      
      // Update local storage maintenance list as well
      const localMaintString = localStorage.getItem('local_maintenance_logs');
      if (localMaintString) {
        const localMaint: MaintenanceLog[] = JSON.parse(localMaintString);
        const updated = localMaint.map(m => m.id === id ? { ...m, status: 'Closed' as const } : m);
        localStorage.setItem('local_maintenance_logs', JSON.stringify(updated));
      }
      
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to close maintenance log', 'error');
    }
  };

  const exportCSV = (type: 'fuel' | 'expenses' | 'maintenance') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (type === 'fuel') {
      headers = ['Vehicle Reg', 'Date', 'Liters', 'Fuel Cost'];
      rows = fuelLogs.map(l => [l.vehicle_reg, l.date, `${l.liters} L`, `Rs. ${l.cost}`]);
      filename = `fuel_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === 'expenses') {
      headers = ['Linked Trip', 'Vehicle Reg', 'Toll Cost', 'Other Cost', 'Total Cost'];
      rows = otherExpenses.map(e => [e.trip_id, e.vehicle_reg, `Rs. ${e.toll}`, `Rs. ${e.other}`, `Rs. ${e.toll + e.other}`]);
      filename = `expenses_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (type === 'maintenance') {
      headers = ['Vehicle Reg', 'Description', 'Cost', 'Date', 'Status'];
      rows = maintenanceLogs.map(m => [m.vehicle_reg, m.description, `Rs. ${m.cost}`, m.date, m.status]);
      filename = `maintenance_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} logs exported successfully`, 'success');
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-instrument">Expenses & Logs</h2>
        <p className="text-sm text-slate-400">Track refueling logs, toll operating cost sheets, and shop logs</p>
      </div>

      {/* INPUT FORMS SECTION (Financial Analyst only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* FUEL REFUELLING FORM */}
        <div className="glass-card p-6 bg-slate-900/15 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <Fuel className="h-4 w-4 text-[#7b39fc]" />
                Log Refueling
              </h3>
              {!canEditExpenses && (
                <span className="text-[9px] font-extrabold uppercase bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 select-none">
                  <Lock className="h-3 w-3" /> Read Only
                </span>
              )}
            </div>

            {!canEditExpenses && (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] leading-relaxed text-slate-400 mb-4 flex items-center gap-2 select-none">
                <Lock className="h-4 w-4 text-[#7b39fc] flex-shrink-0" />
                <span>Refueling logs submission is restricted to the Financial Analyst role.</span>
              </div>
            )}

            {fuelError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-4 flex gap-2">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{fuelError}</span>
              </div>
            )}

            <form onSubmit={handleLogFuel} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Select Vehicle
                </label>
                <select
                  disabled={!canEditExpenses}
                  value={fuelVehicle}
                  onChange={(e) => setFuelVehicle(e.target.value)}
                  className="w-full bg-white/[0.02] cursor-pointer"
                >
                  <option value="" className="bg-[#0b0c13]">Choose a vehicle...</option>
                  {vehicles.map(v => <option key={v} value={v} className="bg-[#0b0c13]">{v}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Liters
                  </label>
                  <input
                    disabled={!canEditExpenses}
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Fuel Cost (₹)
                  </label>
                  <input
                    disabled={!canEditExpenses}
                    type="number"
                    min="1"
                    placeholder="e.g. 4500"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              <button
                disabled={!canEditExpenses}
                type="submit"
                className="w-full mt-2 bg-[#7b39fc] hover:bg-[#6c2ee0] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer select-none shadow-lg shadow-purple-500/10 active:scale-[0.98]"
              >
                Submit Refueling Log
              </button>
            </form>
          </div>
        </div>

        {/* OPERATIONS EXPENSE FORM */}
        <div className="glass-card p-6 bg-slate-900/15 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#7b39fc]" />
                Log Operations Expense
              </h3>
              {!canEditExpenses && (
                <span className="text-[9px] font-extrabold uppercase bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 select-none">
                  <Lock className="h-3 w-3" /> Read Only
                </span>
              )}
            </div>

            {!canEditExpenses && (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] leading-relaxed text-slate-400 mb-4 flex items-center gap-2 select-none">
                <Lock className="h-4 w-4 text-[#7b39fc] flex-shrink-0" />
                <span>Operational expenses submission is restricted to the Financial Analyst role.</span>
              </div>
            )}

            {expError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 mb-4 flex gap-2">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{expError}</span>
              </div>
            )}

            <form onSubmit={handleLogExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Vehicle Reg
                  </label>
                  <select
                    disabled={!canEditExpenses}
                    value={expVehicle}
                    onChange={(e) => setExpVehicle(e.target.value)}
                    className="w-full bg-white/[0.02] cursor-pointer"
                  >
                    <option value="" className="bg-[#0b0c13]">Choose vehicle...</option>
                    {vehicles.map(v => <option key={v} value={v} className="bg-[#0b0c13]">{v}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Linked Trip
                  </label>
                  <select
                    disabled={!canEditExpenses}
                    value={expTrip}
                    onChange={(e) => setExpTrip(e.target.value)}
                    className="w-full bg-white/[0.02] cursor-pointer"
                  >
                    <option value="" className="bg-[#0b0c13]">No link (General)</option>
                    {trips.map(t => <option key={t} value={t} className="bg-[#0b0c13]">TR-{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Toll Cost (₹)
                  </label>
                  <input
                    disabled={!canEditExpenses}
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={expToll}
                    onChange={(e) => setExpToll(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Other Cost (₹)
                  </label>
                  <input
                    disabled={!canEditExpenses}
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={expOther}
                    onChange={(e) => setExpOther(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              <button
                disabled={!canEditExpenses}
                type="submit"
                className="w-full mt-2 bg-[#7b39fc] hover:bg-[#6c2ee0] disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer select-none shadow-lg shadow-purple-500/10 active:scale-[0.98]"
              >
                Submit Expense Log
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ACTIVE MAINTENANCE LOGS TABLE */}
      <div className="glass-card overflow-hidden bg-slate-900/15">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#7b39fc]" />
            Active Maintenance Shop Logs
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV('maintenance')}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Syncing shop logs...
                  </td>
                </tr>
              ) : maintenanceLogs.length > 0 ? (
                maintenanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="px-6 py-4 font-mono font-bold text-white">{log.vehicle_reg}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">{log.description}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-200">₹{log.cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400">{log.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
                        log.status === 'Active'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'Active' ? (
                        <button
                          onClick={() => handleCloseMaintenance(log.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors active:scale-[0.98]"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Close & Release
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-semibold italic">Released</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No active maintenance shop logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RE-FUELING AND EXPENSES GRID VIEWS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* FUEL HISTORY VIEW */}
        <div className="glass-card overflow-hidden bg-slate-900/15">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Fuel History</h3>
            <button
              onClick={() => exportCSV('fuel')}
              disabled={!fuelLogsAvailable || fuelLogs.length === 0}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 disabled:opacity-50 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Liters</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : !fuelLogsAvailable ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-semibold italic">
                      Refueling history unavailable (GET /api/fuel returned 404).
                    </td>
                  </tr>
                ) : fuelLogs.length > 0 ? (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono font-bold text-white">{log.vehicle_reg}</td>
                      <td className="px-6 py-4 text-slate-400">{log.date}</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">{log.liters} L</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-200">₹{log.cost.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No fuel records.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EXPENSES HISTORY VIEW */}
        <div className="glass-card overflow-hidden bg-slate-900/15">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">Operational Expenses</h3>
            <button
              onClick={() => exportCSV('expenses')}
              disabled={!expensesAvailable || otherExpenses.length === 0}
              className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 disabled:opacity-50 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Trip</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4 text-right">Toll</th>
                  <th className="px-6 py-4 text-right">Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : !expensesAvailable ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-semibold italic">
                      Operational expenses history unavailable (GET /api/expenses returned 404).
                    </td>
                  </tr>
                ) : otherExpenses.length > 0 ? (
                  otherExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono font-bold text-white">{exp.trip_id}</td>
                      <td className="px-6 py-4 font-mono">{exp.vehicle_reg}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">₹{exp.toll.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400">₹{exp.other.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No expense records.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
