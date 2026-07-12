import React, { useState } from 'react';
import { Shield, Cog, Save } from 'lucide-react';

export function SettingsPage() {
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('Settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-slate-400">Manage depot options and review user role authorization rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - General Settings (5 cols) */}
        <div className="lg:col-span-5 bg-[#1A1D27] border border-[#2E3148] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#2E3148] pb-4">
            <Cog className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-base font-semibold text-white">General Settings</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-medium">
                {successMessage}
              </div>
            )}

            {/* Depot Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Depot Name
              </label>
              <input
                type="text"
                required
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
              >
                <option value="INR (Rs)">INR (Rs.)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
              </select>
            </div>

            {/* Distance Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Distance Unit
              </label>
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
              >
                <option value="Kilometers">Kilometers (km)</option>
                <option value="Miles">Miles (mi)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] rounded-lg text-sm font-bold py-2.5 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Role-Based Access Control matrix table (7 cols) */}
        <div className="lg:col-span-7 bg-[#1A1D27] border border-[#2E3148] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2E3148] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-base font-semibold text-white">Role-Based Access Control (RBAC)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
                <tr>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Fleet</th>
                  <th className="px-6 py-4 text-center">Drivers</th>
                  <th className="px-6 py-4 text-center">Trips</th>
                  <th className="px-6 py-4 text-center">Fuel/Exp.</th>
                  <th className="px-6 py-4 text-center">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3148] font-medium">
                <tr className="hover:bg-[#232635] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">Fleet Manager</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                </tr>
                <tr className="hover:bg-[#232635] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">Dispatcher</td>
                  <td className="px-6 py-4 text-center text-blue-400">view</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                </tr>
                <tr className="hover:bg-[#232635] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">Safety Officer</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="px-6 py-4 text-center text-blue-400">view</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                </tr>
                <tr className="hover:bg-[#232635] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">Financial Analyst</td>
                  <td className="px-6 py-4 text-center text-blue-400">view</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-bold">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
