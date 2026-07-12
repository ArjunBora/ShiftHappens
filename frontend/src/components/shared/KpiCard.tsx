import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: 'green' | 'blue' | 'orange';
}

export function KpiCard({ label, value, accent = 'green' }: KpiCardProps) {
  const accentColorMap = {
    green: 'text-[#10B981] border-l-[#10B981]',
    blue: 'text-[#3B82F6] border-l-[#3B82F6]',
    orange: 'text-[#F59E0B] border-l-[#F59E0B]',
  };

  const glowColorMap = {
    green: 'rgba(16, 185, 129, 0.1)',
    blue: 'rgba(59, 130, 246, 0.1)',
    orange: 'rgba(245, 158, 11, 0.1)',
  };

  return (
    <div 
      className={`glass-card p-5 border-l-[3px] flex flex-col justify-between hover:translate-y-[-2px] transition-all relative overflow-hidden ${accentColorMap[accent]}`}
      style={{
        boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5), inset 1px 0px 0px 0px ${glowColorMap[accent]}`
      }}
    >
      <span className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.015] rounded-full blur-2xl pointer-events-none" />
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight mt-2.5">{value}</p>
      </div>
    </div>
  );
}
