import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import useMeasure from 'react-use-measure';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Fuel, 
  BarChart3, 
  Settings,
  Shield,
  Wrench,
  ChevronUp
} from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import type { Role } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
  { label: 'Fleet', path: '/fleet', icon: Truck, roles: ['Fleet Manager', 'Dispatcher', 'Financial Analyst'] },
  { label: 'Drivers', path: '/drivers', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] },
  { label: 'Trips', path: '/trips', icon: Map, roles: ['Dispatcher', 'Safety Officer'] },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Fleet Manager'] },
  { label: 'Expenses & Logs', path: '/expenses', icon: Fuel, roles: ['Financial Analyst'] },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['Fleet Manager', 'Financial Analyst'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
];

const ROLES: Role[] = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export function Sidebar() {
  const { role, setRole } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const [measureRef, bounds] = useMeasure();

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('simulated_role', newRole);
  };

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col h-screen text-slate-300 relative z-20">
      {/* Branding */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3 relative overflow-hidden">
        <div className="bg-gradient-to-tr from-[#7b39fc] to-[#a277ff] p-2.5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] shadow-lg shadow-purple-500/10">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide drop-shadow-md">Shift Happens</h1>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fleet Core</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
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

      {/* Liminal Collapsible RBAC Simulator */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20">
        <MotionConfig transition={{ duration: 0.4, type: "spring", bounce: 0.15 }}>
          <motion.div 
            animate={{ height: bounds.height || 'auto' }}
            className="overflow-hidden bg-white/[0.02] border border-white/5 rounded-xl shadow-lg relative"
          >
            <div ref={measureRef} className="p-3">
              {/* Header Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-[#7b39fc]" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RBAC Simulator</p>
                    {!isOpen && (
                      <p className="text-xs text-white/80 font-medium truncate mt-0.5">{role}</p>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  className="text-slate-500 group-hover:text-slate-300 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </motion.div>
              </button>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-2 border-t border-white/5 space-y-1"
                  >
                    {ROLES.map((r) => {
                      const isActive = role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors relative cursor-pointer block text-slate-300 hover:text-white"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="active-role-bubble"
                              className="absolute inset-0 bg-[#7b39fc]/10 border border-[#7b39fc]/20 rounded-lg -z-10"
                              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                            />
                          )}
                          <span className={isActive ? "text-[#a277ff] font-semibold" : ""}>
                            {r}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </MotionConfig>
      </div>
    </aside>
  );
}

