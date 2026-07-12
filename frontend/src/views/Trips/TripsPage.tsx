import React, { useState, useEffect } from 'react';
import { Play, ClipboardList, ShieldAlert, CheckCircle2, Download, CheckCircle } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import {
  getVehicles,
  getDrivers,
  getTrips,
  createTrip,
  dispatchTrip,
  completeTrip
} from '../../services/api';

interface Vehicle {
  reg_number: string;
  model: string;
  max_load_capacity: number; // in kg
  odometer: number;
  status: 'available' | 'on_trip' | 'in_shop' | 'retired';
}

interface Driver {
  id: number;
  name: string;
  license_expiry: string;
  safety_status: 'available' | 'suspended' | 'on_trip' | 'off_duty';
}

interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicle_reg: string;
  driver_id: number;
  driver_name?: string;
  cargo_weight: number;
  planned_distance: number;
  status: 'draft' | 'dispatched' | 'completed';
  contextNote?: string;
}

export function TripsPage() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [source, setSource] = useState('Gandhinagar Depot');
  const [destination, setDestination] = useState('Ahmedabad Hub');
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('700');
  const [plannedDistance, setPlannedDistance] = useState('38');
  
  // Validation state
  const [formError, setFormError] = useState('');

  // Complete modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeCompleteTripId, setActiveCompleteTripId] = useState<number | null>(null);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [tollCost, setTollCost] = useState('');
  const [otherCost, setOtherCost] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, dRes, tRes] = await Promise.all([getVehicles(), getDrivers(), getTrips()]);
      
      const mappedVehicles = vRes.data.map((v: any) => ({
        reg_number: v.regNumber,
        model: v.model,
        max_load_capacity: v.maxLoadCapacity,
        odometer: v.odometer,
        status: v.status.toLowerCase().replace(/ /g, '_')
      }));

      const mappedDrivers = dRes.data.map((d: any) => ({
        id: d.id,
        name: d.name,
        license_expiry: d.licenseExpiry,
        safety_status: d.status.toLowerCase().replace(/ /g, '_')
      }));

      const mappedTrips = tRes.data
        .map((t: any) => {
          const matchedDriver = mappedDrivers.find((d: any) => d.id === t.driverId);
          return {
            id: t.id,
            source: t.source,
            destination: t.destination,
            vehicle_reg: t.vehicleReg,
            driver_id: t.driverId,
            driver_name: matchedDriver ? matchedDriver.name : `Driver #${t.driverId}`,
            cargo_weight: t.cargoWeight,
            planned_distance: t.plannedDistance,
            status: t.status.toLowerCase() as any,
            contextNote: t.status === 'Dispatched' ? 'In transit' : t.status === 'Completed' ? 'Finished' : ''
          };
        })
        .filter((t: any) => t.status !== 'cancelled'); // Strip cancelled trips

      setVehicles(mappedVehicles);
      setDrivers(mappedDrivers);
      setTrips(mappedTrips);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load trip dispatcher data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const canDispatch = role === 'Dispatcher';

  const availableVehicles = vehicles.filter(v => v.status === 'available');
  
  const isLicenseExpired = (expiry: string) => {
    return new Date(expiry) < new Date();
  };

  const availableDrivers = drivers.filter(d => 
    d.safety_status === 'available' && !isLicenseExpired(d.license_expiry)
  );

  const selectedVehicleObj = vehicles.find(v => v.reg_number === selectedVehicleReg);
  const capacityRatio = selectedVehicleObj && cargoWeight 
    ? (Number(cargoWeight) / selectedVehicleObj.max_load_capacity) * 100 
    : 0;
  const isOverloaded = capacityRatio > 100;

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedVehicleReg || !selectedDriverId) {
      setFormError('Please select an available vehicle and driver.');
      return;
    }

    if (isOverloaded) {
      setFormError('Cannot dispatch trip: vehicle capacity exceeded.');
      return;
    }

    try {
      const payload = {
        source,
        destination,
        vehicleReg: selectedVehicleReg,
        driverId: Number(selectedDriverId),
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(plannedDistance),
        status: 'Draft'
      };

      // Create trip as draft
      const newTripRes = await createTrip(payload);
      showToast('Trip created as draft!', 'success');

      // Automatically Dispatch the trip
      await dispatchTrip(newTripRes.data.id);
      showToast('Trip dispatched successfully!', 'success');

      // Reset selectors
      setSelectedVehicleReg('');
      setSelectedDriverId('');
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to dispatch trip.');
      showToast(err.response?.data?.error || 'Failed to dispatch trip.', 'error');
    }
  };

  const handleDispatchDraft = async (id: number) => {
    try {
      await dispatchTrip(id);
      showToast('Trip dispatched successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to dispatch trip.', 'error');
    }
  };

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompleteTripId) return;

    if (Number(actualDistance) <= 0) {
      showToast('Actual distance must be greater than 0 km.', 'error');
      return;
    }

    const matchedTrip = trips.find(t => t.id === activeCompleteTripId);
    if (!matchedTrip) return;

    try {
      const payload = {
        actualDistance: Number(actualDistance),
        fuelLiters: Number(fuelLiters) || 0,
        fuelCost: Number(fuelCost) || 0,
        tollCost: Number(tollCost) || 0,
        otherCost: Number(otherCost) || 0
      };

      await completeTrip(activeCompleteTripId, payload);
      showToast('Trip marked Completed successfully!', 'success');
      
      // Save created Fuel Log to localStorage so it is available in Expenses Page tables
      if (Number(fuelLiters) > 0 || Number(fuelCost) > 0) {
        const localFuelLogsString = localStorage.getItem('local_fuel_logs');
        const localFuelLogs = localFuelLogsString ? JSON.parse(localFuelLogsString) : [];
        const newFuelLog = {
          id: Date.now() + Math.random(),
          vehicle_reg: matchedTrip.vehicle_reg,
          date: new Date().toLocaleDateString('en-GB'),
          liters: Number(fuelLiters) || 0,
          cost: Number(fuelCost) || 0
        };
        localFuelLogs.push(newFuelLog);
        localStorage.setItem('local_fuel_logs', JSON.stringify(localFuelLogs));
      }

      // Save created Expense to localStorage
      if (Number(tollCost) > 0 || Number(otherCost) > 0) {
        const localExpensesString = localStorage.getItem('local_expenses_logs');
        const localExpenses = localExpensesString ? JSON.parse(localExpensesString) : [];
        const newExpense = {
          id: Date.now() + Math.random(),
          trip_id: `TR-${activeCompleteTripId}`,
          vehicle_reg: matchedTrip.vehicle_reg,
          toll: Number(tollCost) || 0,
          other: Number(otherCost) || 0
        };
        localExpenses.push(newExpense);
        localStorage.setItem('local_expenses_logs', JSON.stringify(localExpenses));
      }

      setCompleteModalOpen(false);
      
      // Reset inputs
      setActualDistance('');
      setFuelLiters('');
      setFuelCost('');
      setTollCost('');
      setOtherCost('');
      
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to complete trip.', 'error');
    }
  };

  const exportTripsCSV = () => {
    const headers = ['Trip ID', 'Vehicle Reg', 'Driver', 'Source', 'Destination', 'Cargo Weight (kg)', 'Planned Distance (km)', 'Status'];
    const rows = trips.map(t => [
      `TR-${t.id}`,
      t.vehicle_reg,
      t.driver_name || `Driver #${t.driver_id}`,
      t.source,
      t.destination,
      t.cargo_weight,
      t.planned_distance,
      t.status.toUpperCase()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trips_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Trips log exported to CSV successfully', 'success');
  };

  // Find odometer stats for the active completion modal
  const matchedTripObj = trips.find(t => t.id === activeCompleteTripId);
  const matchedVehicle = matchedTripObj ? vehicles.find(v => v.reg_number === matchedTripObj.vehicle_reg) : null;
  const currentOdo = matchedVehicle ? matchedVehicle.odometer : 0;
  const nextOdo = currentOdo + (Number(actualDistance) || 0);

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-instrument">Trip Dispatcher</h2>
          <p className="text-sm text-slate-400">Plan routes, allocate fleet capacity, and track assignments in real-time</p>
        </div>
        <button
          onClick={exportTripsCSV}
          className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Trip Form (45%) */}
        <div className="lg:col-span-5 glass-card overflow-hidden p-6 space-y-5 bg-slate-900/15">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4.5">
            <ClipboardList className="h-5 w-5 text-[#7b39fc]" />
            <h3 className="text-base font-bold text-white tracking-wide">Create Route Assignment</h3>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-xs text-red-400">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Source & Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Source Depot
                </label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-white/[0.02]"
                />
              </div>
            </div>

            {/* Vehicle Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Vehicle (Available Only)
              </label>
              <select
                value={selectedVehicleReg}
                onChange={(e) => setSelectedVehicleReg(e.target.value)}
                disabled={!canDispatch}
                className="w-full bg-white/[0.02] cursor-pointer"
              >
                <option value="" className="bg-[#0b0c13]">Select a vehicle...</option>
                {availableVehicles.map(v => (
                  <option key={v.reg_number} value={v.reg_number} className="bg-[#0b0c13]">
                    {v.model} - {v.reg_number} ({v.max_load_capacity} kg capacity)
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Driver (Available Only)
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                disabled={!canDispatch}
                className="w-full bg-white/[0.02] cursor-pointer"
              >
                <option value="" className="bg-[#0b0c13]">Select a driver...</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#0b0c13]">
                    {d.name} (License OK)
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo Weight & Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Cargo Weight (kg)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Planned Distance (km)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={plannedDistance}
                  onChange={(e) => setPlannedDistance(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-white/[0.02]"
                />
              </div>
            </div>

            {/* Dynamic Cargo Load Capacity progress bar */}
            {selectedVehicleObj && (
              <div className="space-y-1.5 mt-2 bg-slate-950/20 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Cargo Load Ratio</span>
                  <span className={`${
                    capacityRatio > 100 ? 'text-red-400 font-extrabold animate-pulse' : capacityRatio >= 85 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'
                  }`}>
                    {capacityRatio.toFixed(1)}% ({cargoWeight}kg / {selectedVehicleObj.max_load_capacity}kg)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      capacityRatio > 100 ? 'bg-red-500' : capacityRatio >= 85 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(capacityRatio, 100)}%` }}
                  />
                </div>
                {isOverloaded && (
                  <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-wide flex items-center gap-1 mt-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Over capacity — blocked
                  </p>
                )}
              </div>
            )}

            {/* Form actions */}
            {canDispatch ? (
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicleReg('');
                    setSelectedDriverId('');
                  }}
                  className="px-4 py-2 border border-white/10 hover:bg-white/[0.03] text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isOverloaded || !selectedVehicleReg || !selectedDriverId}
                  className="px-4 py-2 bg-[#7b39fc] hover:bg-[#6c2ee0] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Dispatch
                </button>
              </div>
            ) : (
              <div className="text-center p-3.5 bg-slate-950/40 border border-white/5 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                🔒 Access Restricted. Only a Dispatcher can schedule route dispatches.
              </div>
            )}
          </form>
        </div>

        {/* Live Board (55%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-4 flex items-center justify-between bg-slate-900/15">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Operations Board</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {trips.length} active assignment{trips.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="glass-card p-8 text-center text-slate-500 font-medium">
                Loading live operations board...
              </div>
            ) : trips.length > 0 ? (
              trips.map((trip) => (
                <div key={trip.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/15">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-extrabold text-[#7b39fc]">TR-{trip.id}</span>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {trip.vehicle_reg} • {trip.driver_name}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{trip.source}</span>
                      <span className="text-slate-600 font-mono">➔</span>
                      <span>{trip.destination}</span>
                    </div>
                  </div>

                  <div className="flex md:flex-row items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-start md:items-end gap-1">
                      <StatusBadge status={trip.status as StatusType} />
                      {trip.contextNote && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{trip.contextNote}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {trip.status === 'draft' && (
                      <button
                        onClick={() => handleDispatchDraft(trip.id)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Dispatch
                      </button>
                    )}

                    {trip.status === 'dispatched' && (
                      <button
                        onClick={() => {
                          setActiveCompleteTripId(trip.id);
                          setActualDistance(String(trip.planned_distance)); // default to planned
                          setFuelLiters('');
                          setFuelCost('');
                          setTollCost('');
                          setOtherCost('');
                          setCompleteModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-8 text-center text-slate-500 font-medium bg-slate-900/15">
                No trips scheduled yet. Use the form to plan one.
              </div>
            )}
          </div>

          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            💡 On Complete: Odometer gets updated → fuel & maintenance logs gets recorded → vehicle & driver returns to Available pool.
          </div>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-white/5 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Complete Trip & Log Costs
              </h3>
              <button 
                onClick={() => setCompleteModalOpen(false)}
                className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCompleteTripSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Actual Distance Traveled (km)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* Odometer progression live preview */}
              {matchedVehicle && (
                <div className="p-3.5 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-300 font-semibold select-none flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Odo Progression:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-400 font-bold">{currentOdo.toLocaleString()} km</span> 
                    <span className="text-slate-600">➔</span> 
                    <span className={Number(actualDistance) <= 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {nextOdo.toLocaleString()} km
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Fuel Consumed (L)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
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
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Toll Expenses (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={tollCost}
                    onChange={(e) => setTollCost(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Other Expenses (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={otherCost}
                    onChange={(e) => setOtherCost(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/[0.03] text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Number(actualDistance) <= 0 || loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-[0.98]"
                >
                  Submit Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
