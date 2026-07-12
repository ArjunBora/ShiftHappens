import React, { createContext, useContext, useState } from 'react';

export type Role = 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';

interface AuthContextValue {
  role: Role;
  setRole: (role: Role) => void;
  user: { name: string; initials: string };
}

export const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('Dispatcher');
  const user = { name: 'Raven K.', initials: 'RK' };
  return (
    <AuthContext.Provider value={{ role, setRole, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useRole = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useRole must be used within an AuthProvider');
  }
  return context;
};
