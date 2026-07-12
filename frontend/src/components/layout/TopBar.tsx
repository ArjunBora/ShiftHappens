import React from 'react';
import { Search } from 'lucide-react';
import { useRole } from '../../context/AuthContext';

export function TopBar() {
  const { role, user } = useRole();

  return (
    <header className="h-16 bg-slate-950/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 text-slate-300">
      {/* Search Input */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Search registrations, drivers, trips..."
          className="w-full bg-white/[0.03] hover:bg-white/[0.05] text-white placeholder-slate-500 text-xs border border-white/10 rounded-xl !pl-10 pr-4 py-2 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-medium transition-all"
        />
      </div>

      {/* User Card Indicator */}
      <div className="flex items-center gap-3">
        {/* User Role Badge */}
        <div className="text-right">
          <p className="text-xs font-bold text-white tracking-wide">{user.name}</p>
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[9px] font-bold text-[#7b39fc] border border-purple-500/20 mt-1 uppercase tracking-wider">
            {role}
          </span>
        </div>

        {/* Initials Avatar */}
        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-xs select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {user.initials}
        </div>
      </div>
    </header>
  );
}
