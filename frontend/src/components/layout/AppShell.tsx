import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090d] relative text-slate-300">
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Decorative ambient background for glassmorphism refraction */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/8 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none animate-pulse-glow-1" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/8 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none animate-pulse-glow-2" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-20">
        {/* Top Header */}
        <TopBar />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
