import React, { useState, useEffect } from 'react';
import { Wrench, ShieldAlert } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import { getMaintenance, createMaintenance, getVehicles, patchMaintenance } from '../../services/api';

interface MaintenanceLog {
  id: number;
  vehicle_reg: string;
  service_type: string;
  cost: number;
  date: string;
  status: 'active' | 'closed'; // active -> In Shop, closed -> Completed/Available
}

export function MaintenancePage() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceType, setServiceType] = useState('Oil Change');
  const [cost, setCost] = useState('2500');
  const [date, setDate] = useState('2026-07-07');
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, vRes] = await Promise.all([getMaintenance(), getVehicles()]);
      
      const mappedLogs = mRes.data.map((l: any) => ({
        id: l.id,
        vehicle_reg: l.vehicleReg,
        service_type: l.description,
        cost: l.cost,
        date: new Date(l.date).toISOString().split('T')[0],
        status: l.status.toLowerCase() as 'active' | 'closed'
      }));

      const activeVehicles = vRes.data
        .filter((v: any) => v.status !== 'Retired')
        .map((v: any) => v.regNumber);

      setLogs(mappedLogs);
      setVehicles(activeVehicles);
      if (activeVehicles.length > 0 && !selectedVehicle) {
        setSelectedVehicle(activeVehicles[0]);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load maintenance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check permissions: Fleet Manager can view and edit maintenance logs
  const canEditLogs = role === 'Fleet Manager';

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicle || !serviceType || !cost || !date) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        vehicleReg: selectedVehicle,
        description: serviceType.trim(),
        cost: Number(cost) || 0,
        date: new Date(date).toISOString(),
        status: status === 'active' ? 'Active' : 'Closed'
      };

      await createMaintenance(payload);
      showToast('Maintenance log saved successfully!', 'success');
      
      // Reset form values
      setServiceType('');
      setCost('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save log.');
      showToast(err.response?.data?.error || 'Failed to save log.', 'error');
    }
  };

  const handleCloseLog = async (id: number) => {
    try {
      await patchMaintenance(id, { status: 'Closed' });
      showToast('Maintenance log closed. Vehicle is now Available.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to close log.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Maintenance Desk</h2>
        <p className="text-sm text-slate-400">Log repairs, track maintenance costs, and manage workshop schedules</p>
      </div>

      {/* Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Panel (40%) */}
        <div className="lg:col-span-5 bg-[#1A1D27] border border-[#2E3148] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#2E3148] pb-4">
            <Wrench className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-base font-semibold text-white">Log Service Record</h3>
          </div>

          <form onSubmit={handleSaveLog} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 text-xs text-red-400">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Vehicle Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Vehicle
              </label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                disabled={!canEditLogs}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
              >
                <option value="">Select a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Service Type
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Oil Change"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                disabled={!canEditLogs}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
              />
            </div>

            {/* Cost & Date Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cost (Rs)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  disabled={!canEditLogs}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!canEditLogs}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50 text-slate-300"
                />
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'closed')}
                disabled={!canEditLogs}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
              {/* Trigger Warning Info */}
              <p className="mt-2 text-slate-500 text-[11px] font-medium leading-relaxed">
                ℹ️ Setting status to &quot;Active&quot; will move the vehicle to &quot;In Shop&quot; and remove it from available dispatch options.
              </p>
            </div>

            {/* Form actions */}
            {canEditLogs ? (
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="submit"
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] rounded-lg text-sm font-bold py-2.5 cursor-pointer transition-colors"
                >
                  Save Log
                </button>
              </div>
            ) : (
              <div className="text-center p-3 bg-[#151821] border border-[#2E3148] rounded-lg text-xs text-slate-400 font-medium">
                🔒 Access Restricted. Only a Fleet Manager can log maintenance service.
              </div>
            )}
          </form>
        </div>

        {/* Right Service Log Table (60%) */}
        <div className="lg:col-span-7 bg-[#1A1D27] border border-[#2E3148] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Workshop Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  {canEditLogs && <th className="px-6 py-4">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3148]">
                {loading ? (
                  <tr>
                    <td colSpan={canEditLogs ? 6 : 5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Loading workshop logs...
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#232635] transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-white">{log.vehicle_reg}</td>
                      <td className="px-6 py-4 font-medium">{log.service_type}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">Rs. {log.cost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400">{log.date}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={log.status === 'active' ? 'active' : 'closed'} />
                      </td>
                      {canEditLogs && (
                        <td className="px-6 py-4">
                          {log.status === 'active' && (
                            <button
                              onClick={() => handleCloseLog(log.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition-colors cursor-pointer"
                            >
                              Close Log
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canEditLogs ? 6 : 5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No workshop logs recorded.
                    </td>
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
