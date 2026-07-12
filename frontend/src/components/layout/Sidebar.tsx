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
    <aside className="w-64 bg-white/[0.02] backdrop-blur-3xl border-r border-white/5 flex flex-col h-screen text-slate-300 relative z-20">
      {/* Branding */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3 relative overflow-hidden">
        <div className="bg-gradient-to-tr from-[#F59E0B] to-amber-300 p-2 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          <Truck className="h-6 w-6 text-[#0F1117]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-md">TransitOps</h1>
          <p className="text-xs text-slate-400 font-medium">Smart Fleet System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98] ${
                  isActive
                    ? 'glass-panel text-white'
                    : 'hover:bg-white/5 hover:text-white border border-transparent'
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
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Shield className="h-3 w-3 text-[#F59E0B]" />
          <span>RBAC Simulator</span>
        </div>
        <select
          value={role}
          onChange={handleRoleChange}
          className="w-full bg-white/5 text-white text-xs border border-white/10 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-white/20 font-medium appearance-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <option value="Fleet Manager" className="bg-[#151821]">Fleet Manager</option>
          <option value="Dispatcher" className="bg-[#151821]">Dispatcher</option>
          <option value="Safety Officer" className="bg-[#151821]">Safety Officer</option>
          <option value="Financial Analyst" className="bg-[#151821]">Financial Analyst</option>
        </select>
      </div>
    </aside>
  );
}
