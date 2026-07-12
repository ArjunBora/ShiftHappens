import React from 'react';
import { Search, User } from 'lucide-react';
import { useRole } from '../../context/AuthContext';

export function TopBar() {
  const { role, user } = useRole();

  return (
    <header className="h-16 bg-[#1A1D27] border-b border-[#2E3148] flex items-center justify-between px-6 text-slate-300">
      {/* Search Input */}
      <div className="relative w-80">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Search registrations, drivers, trips..."
          className="w-full bg-[#0F1117] text-white placeholder-slate-500 text-xs border border-[#2E3148] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#4B5280] font-medium"
        />
      </div>

      {/* User Card Indicator */}
      <div className="flex items-center gap-3">
        {/* User Role Badge */}
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <span className="inline-flex items-center rounded-full bg-[#F59E0B]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#F59E0B] ring-1 ring-inset ring-[#F59E0B]/20">
            {role}
          </span>
        </div>

        {/* Initials Avatar */}
        <div className="h-9 w-9 rounded-full bg-[#232635] border border-[#2E3148] flex items-center justify-center font-bold text-white text-xs select-none">
          {user.initials}
        </div>
      </div>
    </header>
  );
}
