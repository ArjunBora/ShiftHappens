import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldAlert } from 'lucide-react';
import { useRole } from '../../context/AuthContext';
import type { Role } from '../../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const [email, setEmail] = useState('Raven.k@transitops.in');
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
    if (email === 'Raven.k@transitops.in' && password === 'password') {
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
    <div className="flex h-screen w-screen bg-[#0F1117] text-white">
      {/* Left branding pane (40%) */}
      <div className="hidden md:flex md:w-[40%] bg-[#0F1117] text-slate-300 flex-col justify-between p-10 border-r border-white/5 relative overflow-hidden">
        {/* Low-contrast vehicle background with blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.18] scale-105 pointer-events-none"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />

        {/* Ambient gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-[#0F1117]/40 to-[#0F1117]/70 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-[#F59E0B] p-2.5 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            <Truck className="h-7 w-7 text-[#0F1117]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">TransitOps</h2>
            <p className="text-xs text-[#F59E0B] font-semibold uppercase tracking-wider">Fleet System</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
            One login,<br />four operations roles.
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-[32ch]">
            Access is automatically scoped to your active deployment assignment. Toggle roles instantly in testing.
          </p>
          <ul className="space-y-2.5 text-sm font-semibold text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              Fleet Manager
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              Dispatcher
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              Safety Officer
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              Financial Analyst
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium tracking-wide">
          TRANSITOPS © 2026 · SECURED DEPLOYMENT
        </div>
      </div>

      {/* Right form pane (60%) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="glass-panel w-full max-w-md p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-slate-400 mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3 text-sm text-red-400">
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error state</p>
                <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@transitops.in"
                className="w-full bg-white/5 text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              />
            </div>

            {/* Simulated Role (RBAC) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Simulated Assignment (RBAC)
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full bg-white/5 text-white border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 font-medium appearance-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer"
              >
                <option value="Fleet Manager" className="bg-[#151821]">Fleet Manager</option>
                <option value="Dispatcher" className="bg-[#151821]">Dispatcher</option>
                <option value="Safety Officer" className="bg-[#151821]">Safety Officer</option>
                <option value="Financial Analyst" className="bg-[#151821]">Financial Analyst</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs font-medium pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-white/10 bg-white/5 text-[#F59E0B] focus:ring-offset-[#0F1117] focus:ring-[#F59E0B]"
                />
                <span className="text-slate-400">Remember me</span>
              </label>
              <a href="#forgot" className="text-[#F59E0B] hover:text-[#D97706] hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={failedAttempts >= 5}
              className="w-full glass-panel hover:bg-white/15 disabled:bg-slate-700/50 disabled:text-slate-500 text-white font-bold text-sm py-3 rounded-lg transition-all duration-200 active:scale-[0.98] cursor-pointer select-none border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
