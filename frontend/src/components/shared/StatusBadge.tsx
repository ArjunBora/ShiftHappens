import React from 'react';

export type StatusType =
  | 'available' | 'on_trip' | 'in_shop' | 'retired'       // vehicle
  | 'off_duty' | 'suspended'                                // driver
  | 'draft' | 'dispatched' | 'completed' | 'cancelled'     // trip
  | 'active' | 'closed';                                    // maintenance

const STATUS_MAP: Record<StatusType, { label: string; className: string }> = {
  available:   { label: 'Available',   className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  on_trip:     { label: 'On Trip',     className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  in_shop:     { label: 'In Shop',     className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  retired:     { label: 'Retired',     className: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  off_duty:    { label: 'Off Duty',    className: 'bg-gray-500/10 text-gray-400 ring-gray-500/20' },
  suspended:   { label: 'Suspended',   className: 'bg-orange-500/10 text-orange-400 ring-orange-500/20' },
  draft:       { label: 'Draft',       className: 'bg-gray-500/10 text-gray-400 ring-gray-500/20' },
  dispatched:  { label: 'Dispatched',  className: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  completed:   { label: 'Completed',   className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  active:      { label: 'Active',      className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  closed:      { label: 'Closed',      className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
};

export function StatusBadge({ status }: { status: StatusType }) {
  const statusInfo = STATUS_MAP[status];
  if (!statusInfo) return null;
  const { label, className } = statusInfo;

  const dotColorMap: Record<StatusType, string> = {
    available: 'bg-emerald-400',
    on_trip: 'bg-blue-400',
    in_shop: 'bg-amber-400',
    retired: 'bg-red-400',
    off_duty: 'bg-slate-400',
    suspended: 'bg-orange-400',
    draft: 'bg-slate-400',
    dispatched: 'bg-blue-400',
    completed: 'bg-emerald-400',
    cancelled: 'bg-red-400',
    active: 'bg-amber-400',
    closed: 'bg-emerald-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColorMap[status]} animate-pulse`} />
      {label}
    </span>
  );
}
