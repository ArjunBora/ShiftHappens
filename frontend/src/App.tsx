import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './views/Login/LoginPage';
import { DashboardPage } from './views/Dashboard/DashboardPage';
import { FleetPage } from './views/Fleet/FleetPage';
import { DriversPage } from './views/Drivers/DriversPage';
import { TripsPage } from './views/Trips/TripsPage';
import { MaintenancePage } from './views/Maintenance/MaintenancePage';
import { ExpensesPage } from './views/Expenses/ExpensesPage';
import { AnalyticsPage } from './views/Analytics/AnalyticsPage';
import { SettingsPage } from './views/Settings/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected App Routes */}
            <Route path="/" element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="fleet" element={<FleetPage />} />
              <Route path="drivers" element={<DriversPage />} />
              <Route path="trips" element={<TripsPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
