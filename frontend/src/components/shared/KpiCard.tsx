import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: 'green' | 'blue' | 'orange';
}

export function KpiCard({ label, value, accent = 'green' }: KpiCardProps) {
  const borderMap = {
    green: 'border-l-[#10B981]',
    blue: 'border-l-[#3B82F6]',
    orange: 'border-l-[#F59E0B]',
  };
  return (
    <div className={`bg-[#1A1D27] rounded-lg p-4 border border-[#2E3148] border-l-2 ${borderMap[accent]}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
