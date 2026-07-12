import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  Fuel, 
  BarChart3, 
  Settings,
  Shield
} from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import type { Role } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
  { label: 'Fleet', path: '/fleet', icon: Truck, roles: ['Fleet Manager', 'Dispatcher', 'Financial Analyst'] },
  { label: 'Drivers', path: '/drivers', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] },
  { label: 'Trips', path: '/trips', icon: Map, roles: ['Dispatcher', 'Safety Officer'] },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Fleet Manager'] },
  { label: 'Fuel & Expenses', path: '/expenses', icon: Fuel, roles: ['Financial Analyst'] },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['Fleet Manager', 'Financial Analyst'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
];

export function Sidebar() {
  const { role, setRole } = useRole();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as Role;
    setRole(newRole);
    localStorage.setItem('simulated_role', newRole);
  };

  // Filter nav items based on permissions matrix
  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#1A1D27] border-r border-[#2E3148] flex flex-col h-screen text-slate-300">
      {/* Branding */}
      <div className="p-6 border-b border-[#2E3148] flex items-center gap-3">
        <div className="bg-[#F59E0B] p-2 rounded-md">
          <Truck className="h-6 w-6 text-[#0F1117]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">TransitOps</h1>
          <p className="text-xs text-slate-500 font-medium">Smart Fleet System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-l-2 border-[#F59E0B] rounded-l-none pl-2.5'
                    : 'hover:bg-[#232635] hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Simulated Role Switcher Panel */}
      <div className="p-4 border-t border-[#2E3148] bg-[#151821]">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Shield className="h-3 w-3 text-[#F59E0B]" />
          <span>RBAC Simulator</span>
        </div>
        <select
          value={role}
          onChange={handleRoleChange}
          className="w-full bg-[#232635] text-white text-xs border border-[#2E3148] rounded-md p-2 focus:outline-none focus:border-[#4B5280] font-medium"
        >
          <option value="Fleet Manager">Fleet Manager</option>
          <option value="Dispatcher">Dispatcher</option>
          <option value="Safety Officer">Safety Officer</option>
          <option value="Financial Analyst">Financial Analyst</option>
        </select>
      </div>
    </aside>
  );
}
