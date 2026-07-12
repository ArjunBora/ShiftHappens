import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldAlert } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import type { Role } from '../../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const [email, setEmail] = useState('Raven.k@shifthappens.in');
  const [password, setPassword] = useState('password');
  const [selectedRole, setSelectedRole] = useState<Role>('Dispatcher');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (failedAttempts >= 5) {
      setError('Account locked after 5 failed attempts. Please contact safety control.');
      return;
    }

    // Validation condition
    if (email === 'Raven.k@shifthappens.in' && password === 'password') {
      setRole(selectedRole);
      localStorage.setItem('simulated_role', selectedRole);
      localStorage.setItem('token', 'mock_jwt_token_12345');
      navigate('/dashboard');
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setError('Account locked after 5 failed attempts. Please contact safety control.');
      } else {
        setError('Invalid credentials. Please verify your email and password.');
      }
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#08090d] flex items-center justify-center p-4 overflow-hidden text-white font-sans">
      {/* Background ambient animations */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-[#7b39fc]/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none animate-pulse-glow-1" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none animate-pulse-glow-2" />

      {/* Main glass card container */}
      <div className="glass-card w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 overflow-hidden z-20 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 bg-slate-900/20 backdrop-blur-3xl">
        
        {/* Left Branding Panel (5 Columns) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-950/80 to-slate-900/60 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative">
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-gradient-to-tr from-[#7b39fc] to-[#a277ff] p-2.5 rounded-xl shadow-lg shadow-purple-500/10">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Shift Happens</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Fleet Management</p>
            </div>
          </div>

          <div className="my-10 space-y-5 relative z-10">
            <h3 className="text-xl font-bold text-white leading-tight">
              One login,<br />four operations roles.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access is automatically scoped to your active deployment assignment. Toggle roles instantly in testing.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7b39fc]" />
                Fleet Manager
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7b39fc]" />
                Dispatcher
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7b39fc]" />
                Safety Officer
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7b39fc]" />
                Financial Analyst
              </li>
            </ul>
          </div>

          <div className="text-[10px] text-slate-500 font-medium relative z-10 uppercase tracking-widest">
            SHIFT HAPPENS © 2026
          </div>
        </div>

        {/* Right Form Panel (7 Columns) */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Sign in to your account</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-xs text-red-400">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="font-bold">Error state</p>
                  <p className="text-red-300/80 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@shifthappens.in"
                  className="w-full bg-white/[0.02] hover:bg-white/[0.04] text-white border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-medium transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] hover:bg-white/[0.04] text-white border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-medium transition-all"
                />
              </div>

              {/* Simulated Role (RBAC) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Simulated Assignment (RBAC)
                </label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    className="w-full bg-white/[0.02] hover:bg-white/[0.04] text-white border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 font-medium appearance-none transition-all cursor-pointer"
                  >
                    <option value="Fleet Manager" className="bg-[#0b0c13]">Fleet Manager</option>
                    <option value="Dispatcher" className="bg-[#0b0c13]">Dispatcher</option>
                    <option value="Safety Officer" className="bg-[#0b0c13]">Safety Officer</option>
                    <option value="Financial Analyst" className="bg-[#0b0c13]">Financial Analyst</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-white/10 bg-white/[0.02] text-purple-500 focus:ring-purple-500/30"
                  />
                  <span className="text-slate-400">Remember me</span>
                </label>
                <a href="#forgot" className="text-purple-500 hover:text-purple-400 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={failedAttempts >= 5}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer select-none shadow-lg shadow-purple-500/10 active:scale-[0.98]"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
