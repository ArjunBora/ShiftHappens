import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('simulated_role');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (role) {
    config.headers['X-Simulated-Role'] = role;
  }
  return config;
});

// Vehicles
export const getVehicles = () => api.get('/vehicles');
export const createVehicle = (data: object) => api.post('/vehicles', data);

// Drivers
export const getDrivers = () => api.get('/drivers');
export const createDriver = (data: object) => api.post('/drivers', data);

// Trips
export const getTrips = () => api.get('/trips');
export const createTrip = (data: object) => api.post('/trips', data);
export const dispatchTrip = (id: number) => api.post(`/trips/${id}/dispatch`);
export const completeTrip = (id: number, data: object) => api.post(`/trips/${id}/complete`, data);

// Maintenance
export const getMaintenance = () => api.get('/maintenance');
export const createMaintenance = (data: object) => api.post('/maintenance', data);
export const patchMaintenance = (id: number, data: object) => api.patch(`/maintenance/${id}`, data);

// Fuel & Expenses
export const getFuelLogs = () => api.get('/fuel');
export const getExpenses = () => api.get('/expenses');
export const createFuelLog = (data: object) => api.post('/fuel', data);
export const createExpense = (data: object) => api.post('/expenses', data);

// Analytics
export const getAnalyticsSummary = () => api.get('/analytics/summary');
export const getMonthlyRevenue = () => api.get('/analytics/revenue');
export const getCostliestVehicles = () => api.get('/analytics/costliest-vehicles');

export default api;
