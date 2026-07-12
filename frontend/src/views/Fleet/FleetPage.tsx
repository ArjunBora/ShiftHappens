import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, ShieldAlert, Download, Wrench } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import { getVehicles, createVehicle, createMaintenance } from '../../services/api';

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

  // Maintenance log modal states
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [selectedMaintReg, setSelectedMaintReg] = useState('');
  const [maintDescription, setMaintDescription] = useState('Routine Checkup');
  const [maintCost, setMaintCost] = useState('2000');
  const [maintError, setMaintError] = useState('');

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

  const canAddVehicle = role === 'Fleet Manager';

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Unique validation
    if (vehicles.some(v => v.reg_number.toLowerCase() === newReg.trim().toLowerCase())) {
      setError(`Registration number ${newReg} is already registered.`);
      return;
    }

    // Number validations
    const loadCapacity = parseFloat(newCapacity);
    if (isNaN(loadCapacity) || loadCapacity <= 0) {
      setError('Max load capacity must be greater than 0 kg.');
      return;
    }

    const odo = Number(newOdometer);
    if (isNaN(odo) || odo < 0) {
      setError('Odometer must be 0 or positive.');
      return;
    }

    const cost = Number(newAcqCost);
    if (isNaN(cost) || cost <= 0) {
      setError('Acquisition cost must be greater than 0.');
      return;
    }

    try {
      const payload = {
        regNumber: newReg.trim().toUpperCase(),
        model: newModel.trim(),
        type: newType,
        maxLoadCapacity: loadCapacity,
        odometer: odo,
        acquisitionCost: cost,
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

  const handleSendToShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintError('');

    if (!maintDescription || !maintCost || !selectedMaintReg) {
      setMaintError('All fields are required.');
      return;
    }

    try {
      const payload = {
        description: maintDescription.trim(),
        cost: Number(maintCost) || 0,
        vehicleReg: selectedMaintReg
      };

      const res = await createMaintenance(payload);
      showToast(`Vehicle ${selectedMaintReg} sent to maintenance shop!`, 'success');
      
      // Save created maintenance log to localStorage so that it appears in Expenses page even if GET 404s
      const localLogsString = localStorage.getItem('local_maintenance_logs');
      const localLogs = localLogsString ? JSON.parse(localLogsString) : [];
      const newLog = {
        id: res.data.id,
        description: res.data.description,
        cost: res.data.cost,
        date: new Date(res.data.date).toLocaleDateString('en-GB'),
        status: res.data.status,
        vehicle_reg: res.data.vehicleReg
      };
      localLogs.push(newLog);
      localStorage.setItem('local_maintenance_logs', JSON.stringify(localLogs));

      setMaintModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setMaintError(err.response?.data?.error || 'Failed to register maintenance log.');
      showToast(err.response?.data?.error || 'Failed to register maintenance log.', 'error');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.reg_number.toLowerCase().includes(search.toLowerCase()) || 
                          v.model.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || v.type === filterType;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus.toLowerCase().replace(' ', '_');
    return matchesSearch && matchesType && matchesStatus;
  });

  const exportFleetCSV = () => {
    const headers = ['Registration No', 'Model/Name', 'Type', 'Max Load Capacity', 'Odometer', 'Acquisition Cost', 'Status'];
    const rows = filteredVehicles.map(v => [
      v.reg_number,
      v.model,
      v.type,
      v.capacity,
      v.odometer,
      v.acq_cost,
      v.status.toUpperCase().replace('_', ' ')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fleet_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fleet list exported to CSV successfully', 'success');
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-instrument">Vehicle Registry</h2>
          <p className="text-sm text-slate-400">View, search, and manage your operations fleet</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportFleetCSV}
            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          <button
            disabled={!canAddVehicle}
            onClick={() => setIsOpen(true)}
            title={!canAddVehicle ? "Add Vehicle restricted to Fleet Manager role" : undefined}
            className="bg-[#7b39fc] hover:bg-[#6c2ee0] disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#7b39fc]/10 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl backdrop-blur-md">
        {/* Search */}
        <div className="relative w-72">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search reg. no or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] text-white placeholder-slate-500 text-xs border border-white/10 rounded-xl !pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-medium transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/[0.02] text-white text-xs border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-purple-500/50 font-medium cursor-pointer transition-all"
          >
            <option value="All" className="bg-[#0b0c13]">All Types</option>
            <option value="Van" className="bg-[#0b0c13]">Van</option>
            <option value="Truck" className="bg-[#0b0c13]">Truck</option>
            <option value="Mini" className="bg-[#0b0c13]">Mini</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/[0.02] text-white text-xs border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-purple-500/50 font-medium cursor-pointer transition-all"
          >
            <option value="All" className="bg-[#0b0c13]">All Statuses</option>
            <option value="Available" className="bg-[#0b0c13]">Available</option>
            <option value="On Trip" className="bg-[#0b0c13]">On Trip</option>
            <option value="In Shop" className="bg-[#0b0c13]">In Shop</option>
            <option value="Retired" className="bg-[#0b0c13]">Retired</option>
          </select>
        </div>
      </div>

      {/* Grid table */}
      <div className="glass-card overflow-hidden bg-slate-900/15">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Reg. No. (Unique)</th>
                <th className="px-6 py-4">Name/Model</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Capacity</th>
                <th className="px-6 py-4 text-right">Odometer</th>
                <th className="px-6 py-4 text-right">Acq. Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Loading vehicles...
                  </td>
                </tr>
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.reg_number} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">{vehicle.reg_number}</td>
                    <td className="px-6 py-4 font-bold text-slate-300">{vehicle.model}</td>
                    <td className="px-6 py-4 text-slate-400">{vehicle.type}</td>
                    <td className="px-6 py-4 text-right font-semibold">{vehicle.capacity}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300 font-semibold">
                      {vehicle.odometer.toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-400 font-semibold">
                      {vehicle.acq_cost > 0 ? `₹${vehicle.acq_cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={vehicle.status as StatusType} />
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.status === 'available' ? (
                        <button
                          onClick={() => {
                            setSelectedMaintReg(vehicle.reg_number);
                            setMaintModalOpen(true);
                          }}
                          className="bg-[#2b2344] hover:bg-[#392e59] text-[#f6f7f9] font-bold text-[10px] px-3 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                        >
                          <Wrench className="h-3 w-3" />
                          Send to Shop
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-semibold select-none italic">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No vehicles found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rule Footnote */}
        <div className="bg-slate-950/40 px-6 py-3 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
          Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip Dispatcher
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-white/5 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#7b39fc]" />
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
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-xs text-red-400">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Registration Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Registration Number (Unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GJ01AB4527"
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Model / Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TATA-LP-407"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as 'Van' | 'Truck' | 'Mini')}
                    className="w-full bg-white/[0.02] cursor-pointer"
                  >
                    <option value="Van" className="bg-[#0b0c13]">Van</option>
                    <option value="Truck" className="bg-[#0b0c13]">Truck</option>
                    <option value="Mini" className="bg-[#0b0c13]">Mini</option>
                  </select>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              {/* Odometer & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Initial Odo (km)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={newOdometer}
                    onChange={(e) => setNewOdometer(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Acq. Cost (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={newAcqCost}
                    onChange={(e) => setNewAcqCost(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/[0.03] text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7b39fc] hover:bg-[#6c2ee0] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send to shop Modal */}
      {maintModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-white/5 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#7b39fc]" />
                Send Vehicle to Maintenance Shop
              </h3>
              <button 
                onClick={() => setMaintModalOpen(false)}
                className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendToShopSubmit} className="p-6 space-y-4">
              {maintError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-xs text-red-400">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{maintError}</span>
                </div>
              )}

              {/* Vehicle Registration (Display Only) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Vehicle Registration
                </label>
                <p className="text-sm font-mono font-bold text-white select-all">{selectedMaintReg}</p>
              </div>

              {/* Maintenance description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Maintenance Job Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine tune-up and brake checks"
                  value={maintDescription}
                  onChange={(e) => setMaintDescription(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* Cost estimate */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Cost Estimate (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMaintModalOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/[0.03] text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7b39fc] hover:bg-[#6c2ee0] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Send to Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
