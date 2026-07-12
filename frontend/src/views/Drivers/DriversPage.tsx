import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, ShieldAlert } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { StatusType } from '../../components/shared/StatusBadge';
import { getDrivers, createDriver } from '../../services/api';

interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category: 'LMV' | 'HMV';
  license_expiry: string;
  contact_number: string;
  trip_completion_rate: number;
  safety_status: 'available' | 'suspended' | 'on_trip' | 'off_duty';
}

export function DriversPage() {
  const { role } = useRole();
  const { showToast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLicenseNo, setNewLicenseNo] = useState('');
  const [newCategory, setNewCategory] = useState<'LMV' | 'HMV'>('LMV');
  const [newExpiry, setNewExpiry] = useState('');
  const [newContact, setNewContact] = useState('');
  const [error, setError] = useState('');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await getDrivers();
      const mapped = res.data.map((d: any) => ({
        id: d.id,
        name: d.name,
        license_number: d.licenseNumber,
        license_category: d.licenseCategory,
        license_expiry: d.licenseExpiry,
        contact_number: d.contactNumber,
        trip_completion_rate: d.tripCompletionRate,
        safety_status: d.status.toLowerCase().replace(/ /g, '_')
      }));
      setDrivers(mapped);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Check RBAC permissions: Fleet Manager & Safety Officer can edit
  const canAddDriver = role === 'Fleet Manager' || role === 'Safety Officer';

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Unique License check
    if (drivers.some(d => d.license_number.toLowerCase() === newLicenseNo.trim().toLowerCase())) {
      setError(`License number ${newLicenseNo} is already registered.`);
      return;
    }

    try {
      const payload = {
        name: newName.trim(),
        licenseNumber: newLicenseNo.trim().toUpperCase(),
        licenseCategory: newCategory,
        licenseExpiry: new Date(newExpiry).toISOString(),
        contactNumber: newContact.trim(),
        tripCompletionRate: 100.0,
        status: 'Available'
      };

      await createDriver(payload);
      showToast('Driver registered successfully!', 'success');
      setIsOpen(false);
      fetchDrivers();

      // Reset form
      setNewName('');
      setNewLicenseNo('');
      setNewCategory('LMV');
      setNewExpiry('');
      setNewContact('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register driver.');
      showToast(err.response?.data?.error || 'Failed to register driver.', 'error');
    }
  };

  const handleStatusChange = (id: number, nextStatus: Driver['safety_status']) => {
    // We will implement API call if backend supports it, or keep it local for now
    if (!canAddDriver) return;
    setDrivers(drivers.map(d => d.id === id ? { ...d, safety_status: nextStatus } : d));
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.license_number.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || d.license_category === filterCategory;
    const matchesStatus = filterStatus === 'All' || d.safety_status === filterStatus.toLowerCase().replace(' ', '_');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' });
  };

  const checkExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Drivers</h2>
          <p className="text-sm text-slate-400">Manage driver registrations, licenses, and scheduling statuses</p>
        </div>

        {canAddDriver && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1117] font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Driver
          </button>
        )}
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-wrap gap-4 bg-[#1A1D27] p-4 border border-[#2E3148] rounded-lg">
        {/* Search */}
        <div className="relative w-72">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search name or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1117] text-white placeholder-slate-500 text-xs border border-[#2E3148] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#4B5280] font-medium"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">License Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#0F1117] text-white text-xs border border-[#2E3148] rounded-lg p-2 focus:outline-none focus:border-[#4B5280] font-medium"
          >
            <option value="All">All Categories</option>
            <option value="LMV">LMV</option>
            <option value="HMV">HMV</option>
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
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid table */}
      <div className="bg-[#1A1D27] border border-[#2E3148] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#151821] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2E3148]">
              <tr>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">License No.</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Trip Compl.</th>
                <th className="px-6 py-4">Scheduling Status</th>
                {canAddDriver && <th className="px-6 py-4">Quick Status Switch</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3148]">
              {loading ? (
                <tr>
                  <td colSpan={canAddDriver ? 8 : 7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Loading drivers...
                  </td>
                </tr>
              ) : filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => {
                  const isExpired = checkExpired(driver.license_expiry);
                  return (
                    <tr key={driver.id} className="hover:bg-[#232635] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{driver.name}</td>
                      <td className="px-6 py-4 font-mono">{driver.license_number}</td>
                      <td className="px-6 py-4 text-slate-400">{driver.license_category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={isExpired ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                            {formatDate(driver.license_expiry)}
                          </span>
                          {isExpired && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 ring-1 ring-red-500/20 px-1.5 py-0.5 rounded">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{driver.contact_number}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">{driver.trip_completion_rate}%</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={driver.safety_status as StatusType} />
                      </td>
                      {canAddDriver && (
                        <td className="px-6 py-4">
                          <select
                            value={driver.safety_status}
                            onChange={(e) => handleStatusChange(driver.id, e.target.value as Driver['safety_status'])}
                            className="bg-[#0F1117] text-white text-[11px] border border-[#2E3148] rounded-md px-2 py-1 focus:outline-none focus:border-[#4B5280] font-medium"
                          >
                            <option value="available">Available</option>
                            <option value="on_trip">On Trip</option>
                            <option value="off_duty">Off Duty</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canAddDriver ? 8 : 7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No drivers found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="bg-[#151821] px-6 py-3 border-t border-[#2E3148] text-xs text-slate-500 font-medium">
          Rule: Expired license or Suspended status → blocked from trip assignment
        </div>
      </div>

      {/* Add Driver Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1D27] border border-[#2E3148] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2E3148] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#F59E0B]" />
                Register New Driver
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 text-xs text-red-400">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Driver Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Driver Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  License Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-88213"
                  value={newLicenseNo}
                  onChange={(e) => setNewLicenseNo(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                />
              </div>

              {/* Grid Category & Expiry */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'LMV' | 'HMV')}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                  >
                    <option value="LMV">LMV (Light Motor Vehicle)</option>
                    <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                  </select>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    License Expiry
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium text-slate-300"
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 98765xxxxx"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full bg-[#0F1117] text-white border border-[#2E3148] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4B5280] font-medium"
                />
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
                  Add Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
