import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, ShieldAlert } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import { getVehicles, createVehicle } from '../../services/api';

interface Vehicle {
  reg_number: string;
  model: string;
  type: 'Van' | 'Truck' | 'Mini';
  capacity: string;
  odometer: number;
  acq_cost: number;
  status: 'available' | 'on_trip' | 'in_shop' | 'retired';
}

export function FleetPage() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [newReg, setNewReg] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState<'Van' | 'Truck' | 'Mini'>('Van');
  const [newCapacity, setNewCapacity] = useState('');
  const [newOdometer, setNewOdometer] = useState('');
  const [newAcqCost, setNewAcqCost] = useState('');
  const [error, setError] = useState('');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await getVehicles();
      const mapped = res.data.map((v: any) => ({
        reg_number: v.regNumber,
        model: v.model,
        type: v.type,
        capacity: `${v.maxLoadCapacity} kg`,
        odometer: v.odometer,
        acq_cost: v.acquisitionCost,
        status: v.status.toLowerCase().replace(/ /g, '_')
      }));
      setVehicles(mapped);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load vehicles from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Check write permission based on RBAC matrix
  const canAddVehicle = role === 'Fleet Manager';

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Unique validation
    if (vehicles.some(v => v.reg_number.toLowerCase() === newReg.trim().toLowerCase())) {
      setError(`Registration number ${newReg} is already registered.`);
      return;
    }

    try {
      const payload = {
        regNumber: newReg.trim().toUpperCase(),
        model: newModel.trim(),
        type: newType,
        maxLoadCapacity: parseFloat(newCapacity) || 0,
        odometer: Number(newOdometer) || 0,
        acquisitionCost: Number(newAcqCost) || 0,
        status: 'Available'
      };

      await createVehicle(payload);
      showToast('Vehicle registered successfully!', 'success');
      setIsOpen(false);
      fetchVehicles();
      
      // Reset form
      setNewReg('');
      setNewModel('');
      setNewType('Van');
      setNewCapacity('');
      setNewOdometer('');
      setNewAcqCost('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register vehicle.');
      showToast(err.response?.data?.error || 'Failed to register vehicle.', 'error');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.reg_number.toLowerCase().includes(search.toLowerCase()) || 
                          v.model.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || v.type === filterType;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus.toLowerCase().replace(' ', '_');
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Vehicle Registry</h2>
          <p className="text-sm text-slate-400">View, search, and manage your operations fleet</p>
        </div>

        {canAddVehicle && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-4 bg-[#1A1D27] p-4 border border-[#2E3148] rounded-lg">
        {/* Search */}
        <div className="relative w-72">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search reg. no or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1117] text-white placeholder-slate-500 text-xs border border-[#2E3148] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#4B5280] font-medium"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0F1117] text-white text-xs border border-[#2E3148] rounded-lg p-2 focus:outline-none focus:border-[#4B5280] font-medium"
          >
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Mini">Mini</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0F1117] text-white text-xs border border-[#2E3148] rounded-lg p-2 focus:outline-none focus:border-[#4B5280] font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Grid table */}
      <div className="bg-[#1A1D27] border border-[#2E3148] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
              <tr>
                <th className="px-6 py-4">Reg. No. (Unique)</th>
                <th className="px-6 py-4">Name/Model</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Capacity</th>
                <th className="px-6 py-4 text-right">Odometer</th>
                <th className="px-6 py-4 text-right">Acq. Cost</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3148]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Loading vehicles...
                  </td>
                </tr>
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.reg_number} className="hover:bg-[#232635] transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">{vehicle.reg_number}</td>
                    <td className="px-6 py-4 font-medium">{vehicle.model}</td>
                    <td className="px-6 py-4 text-slate-400">{vehicle.type}</td>
                    <td className="px-6 py-4 text-right font-medium">{vehicle.capacity}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                      {vehicle.odometer.toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-400">
                      {vehicle.acq_cost > 0 ? `Rs. ${vehicle.acq_cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={vehicle.status as StatusType} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No vehicles found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rule Footnote */}
        <div className="bg-[#151821] px-6 py-3 border-t border-[#2E3148] text-xs text-slate-500 font-medium">
          Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip Dispatcher
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#F59E0B]" />
                Register New Vehicle
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 text-xs text-red-400">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Registration Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Registration Number (Unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GJ01AB4527"
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Model / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAN-05"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                />
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'Van' | 'Truck' | 'Mini')}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Capacity
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 kg or 5 Ton"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
              </div>

              {/* Odometer & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Initial Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Acquisition Cost (Rs)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newAcqCost}
                    onChange={(e) => setNewAcqCost(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-[#2E3148] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-[#2E3148] hover:bg-[#232635] text-slate-300 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
