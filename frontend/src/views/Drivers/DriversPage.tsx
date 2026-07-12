import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, ShieldAlert, Download, Filter } from 'lucide-react';
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
  const [complianceOnly, setComplianceOnly] = useState(false);

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

  const canAddDriver = role === 'Fleet Manager' || role === 'Safety Officer';

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations:
    if (!newName.trim()) {
      setError('Driver name is required.');
      return;
    }

    const cleanLicense = newLicenseNo.trim().toUpperCase();
    if (!cleanLicense) {
      setError('License number is required.');
      return;
    }
    if (drivers.some(d => d.license_number.toLowerCase() === cleanLicense.toLowerCase())) {
      setError(`License number ${cleanLicense} is already registered.`);
      return;
    }

    if (!newExpiry) {
      setError('License expiry date is required.');
      return;
    }

    const cleanContact = newContact.trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      setError('Contact number must be exactly 10 digits.');
      return;
    }

    try {
      const payload = {
        name: newName.trim(),
        licenseNumber: cleanLicense,
        licenseCategory: newCategory,
        licenseExpiry: new Date(newExpiry).toISOString(),
        contactNumber: cleanContact,
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

  const getExpiryDetails = (expiryDateString: string) => {
    const expiry = new Date(expiryDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { expired: true, expiringSoon: false, daysLeft: 0, text: 'EXPIRED' };
    } else if (diffDays <= 30) {
      return { expired: false, expiringSoon: true, daysLeft: diffDays, text: `${diffDays}d left` };
    }
    return { expired: false, expiringSoon: false, daysLeft: diffDays, text: '' };
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.license_number.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || d.license_category === filterCategory;
    const matchesStatus = filterStatus === 'All' || d.safety_status === filterStatus.toLowerCase().replace(' ', '_');
    
    const expDetails = getExpiryDetails(d.license_expiry);
    const isNonCompliant = expDetails.expired || expDetails.expiringSoon;
    const matchesCompliance = !complianceOnly || isNonCompliant;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCompliance;
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const exportCSV = () => {
    const headers = ['Driver Name', 'License No', 'Category', 'Expiry Date', 'Contact', 'Trip Completion Rate', 'Status'];
    const rows = filteredDrivers.map(d => [
      d.name,
      d.license_number,
      d.license_category,
      new Date(d.license_expiry).toLocaleDateString('en-GB'),
      d.contact_number,
      `${d.trip_completion_rate}%`,
      d.safety_status.toUpperCase().replace('_', ' ')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `drivers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Drivers exported to CSV successfully', 'success');
  };

  return (
    <div className="space-y-6 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-instrument">Drivers</h2>
          <p className="text-sm text-slate-400">Manage driver registrations, licenses, and scheduling statuses</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-colors active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          {canAddDriver && (
            <button
              onClick={() => setIsOpen(true)}
              className="bg-[#7b39fc] hover:bg-[#6c2ee0] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-[#7b39fc]/10 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl backdrop-blur-md">
        {/* Search */}
        <div className="relative w-72">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search name or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.02] text-white placeholder-slate-500 text-xs border border-white/10 rounded-xl !pl-10 pr-4 py-2.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-medium transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white/[0.02] text-white text-xs border border-white/10 rounded-xl p-2.5 focus:outline-none focus:border-purple-500/50 font-medium cursor-pointer transition-all"
          >
            <option value="All" className="bg-[#0b0c13]">All Categories</option>
            <option value="LMV" className="bg-[#0b0c13]">LMV</option>
            <option value="HMV" className="bg-[#0b0c13]">HMV</option>
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
            <option value="Off Duty" className="bg-[#0b0c13]">Off Duty</option>
            <option value="Suspended" className="bg-[#0b0c13]">Suspended</option>
          </select>
        </div>

        {/* Compliance Only Toggle */}
        <button
          onClick={() => setComplianceOnly(!complianceOnly)}
          className={`ml-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            complianceOnly
              ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_4px_15px_rgba(239,68,68,0.1)]'
              : 'bg-white/[0.02] text-slate-400 border-white/10 hover:text-slate-200'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Compliance Flags Only
        </button>
      </div>

      {/* Grid table */}
      <div className="glass-card overflow-hidden bg-slate-900/15">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">License No.</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Trip Compl.</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Loading drivers...
                  </td>
                </tr>
              ) : filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => {
                  const { expired, expiringSoon, daysLeft } = getExpiryDetails(driver.license_expiry);
                  const rowClass = expired 
                    ? 'bg-red-950/15 hover:bg-red-950/20 border-l-2 border-l-red-500/80 transition-all duration-200' 
                    : 'hover:bg-white/[0.02] transition-colors duration-200';
                  
                  return (
                    <tr key={driver.id} className={rowClass}>
                      <td className="px-6 py-4 font-bold text-white">{driver.name}</td>
                      <td className="px-6 py-4 font-mono font-semibold">{driver.license_number}</td>
                      <td className="px-6 py-4 text-slate-400">{driver.license_category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={expired ? 'text-red-400 font-bold' : expiringSoon ? 'text-amber-400 font-bold' : 'text-slate-300 font-medium'}>
                            {formatDate(driver.license_expiry)}
                          </span>
                          {expired && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md">
                              EXPIRED
                            </span>
                          )}
                          {expiringSoon && (
                            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                              {daysLeft}d left
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">{driver.contact_number}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300 font-semibold">{driver.trip_completion_rate}%</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={driver.safety_status as StatusType} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No drivers found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="bg-slate-950/40 px-6 py-3 border-t border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
          Rule: Expired license or Suspended status → blocked from trip assignment
        </div>
      </div>

      {/* Add Driver Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-white/5 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#7b39fc]" />
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
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-xs text-red-400">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Driver Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Driver Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Crawford"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  License Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-88213778"
                  value={newLicenseNo}
                  onChange={(e) => setNewLicenseNo(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
              </div>

              {/* Grid Category & Expiry */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'LMV' | 'HMV')}
                    className="w-full bg-white/[0.02] cursor-pointer"
                  >
                    <option value="LMV" className="bg-[#0b0c13]">LMV</option>
                    <option value="HMV" className="bg-[#0b0c13]">HMV</option>
                  </select>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-white/[0.02]"
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full bg-white/[0.02]"
                />
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
                  className="px-4 py-2 bg-[#7b39fc] hover:bg-[#6c2ee0] text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-[0.98]"
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
