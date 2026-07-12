import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Fuel, 
  BarChart3, 
  Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Fleet', path: '/fleet', icon: Truck },
  { label: 'Drivers', path: '/drivers', icon: Users },
  { label: 'Trips', path: '/trips', icon: Map },
  { label: 'Expenses & Logs', path: '/expenses', icon: Fuel },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col h-screen text-slate-300 relative z-20">
      {/* Branding */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3 relative overflow-hidden">
        <div className="bg-gradient-to-tr from-[#7b39fc] to-[#a277ff] p-2.5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] shadow-lg shadow-purple-500/10">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide drop-shadow-md">TransitOps</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fleet Core</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] border ${
                  isActive
                    ? 'bg-purple-500/8 text-[#7b39fc] border-purple-500/15 shadow-[0_4px_20px_rgba(123,57,252,0.05)] font-semibold'
                    : 'hover:bg-white/[0.03] hover:text-white border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 transition-colors duration-200 ${isActive ? 'text-[#7b39fc]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
