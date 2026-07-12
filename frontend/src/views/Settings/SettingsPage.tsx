import React, { useState } from 'react';
import { Shield, Cog, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function SettingsPage() {
  const { showToast } = useToast();
  const [depotName, setDepotName] = useState(() => localStorage.getItem('depot_name') || 'Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState(() => localStorage.getItem('distance_unit') || 'Kilometers');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('depot_name', depotName);
    localStorage.setItem('currency', currency);
    localStorage.setItem('distance_unit', distanceUnit);
    
    setSuccessMessage('Settings persisted in workspace storage successfully!');
    showToast('Settings saved successfully', 'success');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-instrument">Settings</h2>
        <p className="text-sm text-slate-400">Manage depot options and review user role authorization rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - General Settings (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 space-y-6 bg-slate-900/15">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Cog className="h-5 w-5 text-[#7b39fc]" />
            <h3 className="text-base font-bold text-white tracking-wide">General Settings</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold text-center">
                {successMessage}
              </div>
            )}

            {/* Depot Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Depot Name
              </label>
              <input
                type="text"
                required
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                className="w-full bg-white/[0.02]"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white/[0.02] cursor-pointer"
              >
                <option value="INR (Rs)" className="bg-[#0b0c13]">INR (Rs.)</option>
                <option value="USD ($)" className="bg-[#0b0c13]">USD ($)</option>
                <option value="EUR (€)" className="bg-[#0b0c13]">EUR (€)</option>
              </select>
            </div>

            {/* Distance Unit */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Distance Unit
              </label>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="w-full bg-white/[0.02] cursor-pointer"
              >
                <option value="Kilometers" className="bg-[#0b0c13]">Kilometers (km)</option>
                <option value="Miles" className="bg-[#0b0c13]">Miles (mi)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="w-full bg-[#7b39fc] hover:bg-[#6c2ee0] text-white rounded-xl text-xs font-bold py-3.5 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Role-Based Access Control matrix table (7 cols) */}
        <div className="lg:col-span-7 glass-card overflow-hidden bg-slate-900/15">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#7b39fc]" />
            <h3 className="text-base font-bold text-white tracking-wide">Role-Based Access Control (RBAC)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">API Action / Endpoint</th>
                  <th className="px-6 py-4 text-center">Fleet Mgr</th>
                  <th className="px-6 py-4 text-center">Dispatcher</th>
                  <th className="px-6 py-4 text-center">Safety Off.</th>
                  <th className="px-6 py-4 text-center">Fin. Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-semibold text-slate-300">
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-white">Create Vehicle (POST /api/vehicles)</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Allowed</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-white">Create Driver (POST /api/drivers)</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Allowed</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Allowed</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-white">Dispatch Trip (POST /api/trips)</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Allowed</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-white">Log Fuel & Expenses (POST /api/fuel, /api/expenses)</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-red-400">Blocked</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Allowed</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-bold text-white">Operations (Dispatch, Complete, Maintenance Close)</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Open</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Open</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Open</td>
                  <td className="px-6 py-4 text-center text-emerald-400">Open</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
