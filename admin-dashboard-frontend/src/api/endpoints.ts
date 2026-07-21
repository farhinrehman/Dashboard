import { apiClient } from './client';
import type { AuthResponse, DashboardSummary, UserListItem, UserSummary } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (email: string, password: string, firstName: string, lastName: string) =>
    apiClient.post<AuthResponse>('/auth/register', { email, password, firstName, lastName }).then((r) => r.data),

  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken })
};

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
  getMe: () => apiClient.get<UserSummary>('/dashboard/me').then((r) => r.data)
};

export const usersApi = {
  getAll: () => apiClient.get<UserListItem[]>('/users').then((r) => r.data),

  create: (payload: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    apiClient.post<UserListItem>('/users', payload).then((r) => r.data),

  update: (id: string, payload: { firstName: string; lastName: string; role: string; isActive: boolean }) =>
    apiClient.put<UserListItem>(`/users/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/users/${id}`)
};