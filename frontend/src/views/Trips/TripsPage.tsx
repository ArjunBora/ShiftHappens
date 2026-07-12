import React, { useState, useEffect } from 'react';
import { Play, ClipboardList, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
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
  status: 'draft' | 'dispatched' | 'completed' | 'cancelled';
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
  const [validationError, setValidationError] = useState('');
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
        status: v.status.toLowerCase().replace(/ /g, '_')
      }));

      const mappedDrivers = dRes.data.map((d: any) => ({
        id: d.id,
        name: d.name,
        license_expiry: d.licenseExpiry,
        safety_status: d.status.toLowerCase().replace(/ /g, '_')
      }));

      const mappedTrips = tRes.data.map((t: any) => {
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
          contextNote: t.status === 'Dispatched' ? 'In transit' : t.status === 'Completed' ? 'Finished' : 'Pending dispatch'
        };
      });

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

  // Check RBAC write permission (Only Dispatcher can create/dispatch trips)
  const canDispatch = role === 'Dispatcher';

  // Filter available items for selectors
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  
  const isLicenseExpired = (expiry: string) => {
    return new Date(expiry) < new Date();
  };

  const availableDrivers = drivers.filter(d => 
    d.safety_status === 'available' && !isLicenseExpired(d.license_expiry)
  );

  const selectedVehicle = vehicles.find(v => v.reg_number === selectedVehicleReg);

  // Dynamic cargo weight capacity checking
  useEffect(() => {
    if (selectedVehicle && cargoWeight) {
      const weight = Number(cargoWeight);
      if (weight > selectedVehicle.max_load_capacity) {
        setValidationError(
          `Vehicle Capacity: ${selectedVehicle.max_load_capacity} kg | Cargo Weight: ${weight} kg | ❌ Capacity exceeded by ${weight - selectedVehicle.max_load_capacity} kg – dispatch blocked`
        );
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [selectedVehicleReg, cargoWeight, vehicles]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedVehicleReg || !selectedDriverId) {
      setFormError('Please select an available vehicle and driver.');
      return;
    }

    if (validationError) {
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
      showToast('Trip dispatched!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to dispatch trip.', 'error');
    }
  };

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompleteTripId) return;

    try {
      const payload = {
        actualDistance: Number(actualDistance),
        fuelLiters: Number(fuelLiters),
        fuelCost: Number(fuelCost),
        tollCost: Number(tollCost),
        otherCost: Number(otherCost)
      };

      await completeTrip(activeCompleteTripId, payload);
      showToast('Trip completed and expenses logged!', 'success');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Trip Dispatcher</h2>
        <p className="text-sm text-slate-400">Plan routes, allocate fleet capacity, and track assignments in real-time</p>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Trip Form (45%) */}
        <div className="lg:col-span-5 bg-[#1A1D27] border border-[#2E3148] rounded-xl overflow-hidden p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#2E3148] pb-4">
            <ClipboardList className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-base font-semibold text-white">Create Route Assignment</h3>
          </div>

          {/* Stepper progress indicator */}
          <div className="relative flex justify-between items-center text-xs">
            <div className="absolute left-0 right-0 h-0.5 bg-[#2E3148] top-3 z-0" />
            <div className="z-10 flex flex-col items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#10B981] flex items-center justify-center font-bold text-white text-[11px] ring-4 ring-[#1A1D27]">1</span>
              <span className="text-[#10B981] font-semibold">Draft</span>
            </div>
            <div className="z-10 flex flex-col items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#3B82F6] flex items-center justify-center font-bold text-white text-[11px] ring-4 ring-[#1A1D27]">2</span>
              <span className="text-[#3B82F6] font-semibold">Dispatched</span>
            </div>
            <div className="z-10 flex flex-col items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 text-[11px] ring-4 ring-[#1A1D27]">3</span>
              <span className="text-slate-500 font-medium">Completed</span>
            </div>
            <div className="z-10 flex flex-col items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400 text-[11px] ring-4 ring-[#1A1D27]">4</span>
              <span className="text-slate-500 font-medium">Cancelled</span>
            </div>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 text-xs text-red-400">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Source & Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Source Depot
                </label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
                />
              </div>
            </div>

            {/* Vehicle Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Vehicle (Available Only)
              </label>
              <select
                value={selectedVehicleReg}
                onChange={(e) => setSelectedVehicleReg(e.target.value)}
                disabled={!canDispatch}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
              >
                <option value="">Select a vehicle...</option>
                {availableVehicles.map(v => (
                  <option key={v.reg_number} value={v.reg_number}>
                    {v.model} ({v.max_load_capacity} kg max)
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Driver (Available Only)
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                disabled={!canDispatch}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
              >
                <option value="">Select a driver...</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} (License OK)
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo Weight & Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cargo Weight (kg)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Planned Distance (km)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={plannedDistance}
                  onChange={(e) => setPlannedDistance(e.target.value)}
                  disabled={!canDispatch}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
                />
              </div>
            </div>

            {/* Dynamic Warning Card */}
            {validationError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Dispatch Blocked</span>
                </div>
                <p className="font-medium text-red-300">{validationError}</p>
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
                  className="px-4 py-2 border border-[#2E3148] hover:bg-[#232635] text-slate-300 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={!!validationError}
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-slate-700 disabled:text-slate-500 text-[#0F1117] rounded-lg text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-[#0F1117]" />
                  Dispatch
                </button>
              </div>
            ) : (
              <div className="text-center p-3 bg-[#151821] border border-[#2E3148] rounded-lg text-xs text-slate-400 font-medium">
                🔒 Access Restricted. Only a Dispatcher can schedule route dispatches.
              </div>
            )}
          </form>
        </div>

        {/* Live Board (55%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl p-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Live Operations Board</h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {trips.length} active assignments
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="bg-[#1A1D27] border border-[#2E3148] rounded-lg p-8 text-center text-slate-500 font-medium">
                Loading live operations board...
              </div>
            ) : trips.length > 0 ? (
              trips.map((trip) => (
                <div key={trip.id} className="bg-[#1A1D27] border border-[#2E3148] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-[#F59E0B]">TR-{trip.id}</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {trip.vehicle_reg} / {trip.driver_name}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span>{trip.source}</span>
                      <span className="text-[#2E3148]">➔</span>
                      <span>{trip.destination}</span>
                    </div>
                  </div>

                  <div className="flex md:flex-row items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-start md:items-end gap-1">
                      <StatusBadge status={trip.status as StatusType} />
                      {trip.contextNote && (
                        <span className="text-[10px] text-slate-400 font-semibold">{trip.contextNote}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {trip.status === 'draft' && (
                      <button
                        onClick={() => handleDispatchDraft(trip.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                      >
                        Dispatch
                      </button>
                    )}

                    {trip.status === 'dispatched' && (
                      <button
                        onClick={() => {
                          setActiveCompleteTripId(trip.id);
                          setActualDistance(String(trip.planned_distance)); // default to planned
                          setCompleteModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#1A1D27] border border-[#2E3148] rounded-lg p-8 text-center text-slate-500 font-medium">
                No trips scheduled yet. Use the form to plan one.
              </div>
            )}
          </div>

          <div className="bg-[#1A1D27] border border-[#2E3148] p-4 rounded-lg text-xs text-slate-500 font-medium">
            💡 On Complete: Odometer gets updated → fuel & maintenance logs gets recorded → vehicle & driver returns to Available pool.
          </div>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Actual Distance Traveled (km)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Fuel Consumed (Liters)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Fuel Cost (Rs)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Toll Expenses (Rs)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={tollCost}
                    onChange={(e) => setTollCost(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Other Expenses (Rs)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={otherCost}
                    onChange={(e) => setOtherCost(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#2E3148] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 border border-[#2E3148] hover:bg-[#232635] text-slate-300 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition-colors"
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
